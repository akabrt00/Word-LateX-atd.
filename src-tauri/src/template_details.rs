//! Plain-text metadata patched into exact, bundled template declarations before creation.
use crate::semester::{czech_date, plain, tex_text};
use serde::Deserialize;
use std::io::Read;

#[derive(Clone, Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub(crate) enum TemplateDetails {
    Thesis(ThesisDetails),
    Presentation(PresentationDetails),
    Poster(PosterDetails),
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct ThesisDetails {
    pub faculty: String, pub work_type: String, pub title: String, pub title_en: String,
    pub author: String, pub supervisor: String, pub year: u16, pub declaration: String,
    pub programme_code: String, pub programme: String, pub programme_en: String,
    pub branch_code: String, pub branch: String, pub branch_en: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct PresentationDetails {
    pub faculty: String, pub title: String, pub authors: Vec<String>, pub institute: String,
    pub date: String, pub email: String, pub phone: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct PosterDetails {
    pub faculty: String, pub title: String, pub subtitle: String, pub authors: Vec<String>,
    pub department: String, pub contact: String, pub website: String, pub event: String,
}

fn text(value: &str, label: &str, max: usize) -> Result<String, String> {
    plain(value, label, max).map(|s| tex_text(&s))
}

fn optional(value: &str, label: &str, max: usize) -> Result<String, String> {
    if value.trim().is_empty() { Ok(String::new()) } else { text(value, label, max) }
}

fn faculty(value: &str, legacy: bool) -> Result<String, String> {
    if !["TUL", "FS", "FT", "FP", "EF", "FUA", "FM", "FZS", "CXI"].contains(&value) { return Err("Vyberte součást TUL z nabídky.".into()); }
    Ok(match value { "TUL" => "", "FUA" if legacy => "FA", other => other }.into())
}

fn authors(values: &[String]) -> Result<String, String> {
    if values.is_empty() || values.len() > 20 { return Err("Vyplňte 1 až 20 autorů, každého na samostatný řádek.".into()); }
    values.iter().map(|name| text(name, "Autor", 200)).collect::<Result<Vec<_>, _>>().map(|names| names.join(", "))
}

fn source(bytes: &[u8], path: &str) -> Result<String, String> {
    let mut zip = zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|e| e.to_string())?;
    let mut source = String::new();
    zip.by_name(path).map_err(|e| e.to_string())?.read_to_string(&mut source).map_err(|e| e.to_string())?;
    Ok(source)
}

// Derive every range from the original before applying any user value. No inserted
// text can become another replacement target; unknown structure is a hard failure.
fn patch(original: &str, edits: Vec<(&str, String)>) -> Result<String, String> {
    let mut ranges = Vec::new();
    for (expected, replacement) in edits {
        if original.matches(expected).count() != 1 { return Err("Tato verze šablony nepodporuje průvodce. Nebyl vytvořen žádný dokument.".into()); }
        ranges.push((original.find(expected).unwrap(), expected.len(), replacement));
    }
    ranges.sort_by_key(|(offset, _, _)| std::cmp::Reverse(*offset));
    let mut output = original.to_owned();
    for (offset, length, replacement) in ranges { output.replace_range(offset..offset + length, &replacement); }
    Ok(output)
}

pub(crate) fn prepare(template: &str, bytes: &[u8], details: &TemplateDetails) -> Result<Vec<(String, String)>, String> {
    let files = match (template, details) {
        ("tul-thesis", TemplateDetails::Thesis(d)) => {
            let unit = faculty(&d.faculty, true)?;
            if !["BP", "DP"].contains(&d.work_type.as_str()) { return Err("Vyberte bakalářskou nebo diplomovou práci.".into()); }
            if !["male", "female"].contains(&d.declaration.as_str()) { return Err("Vyberte variantu prohlášení.".into()); }
            if !(1900..=9999).contains(&d.year) { return Err("Vyplňte čtyřciferný rok (1900–9999).".into()); }
            let class = if unit.is_empty() { d.work_type.clone() } else { format!("{unit},{}", d.work_type) };
            let main = patch(&source(bytes, "main.tex")?, vec![
                ("\\documentclass[BP]{tulthesis}", format!("\\documentclass[{class}]{{tulthesis}}")),
                ("\\ThesisStart{male}", format!("\\ThesisStart{{{}}}", d.declaration)),
            ])?;
            let branch = if [&d.branch_code, &d.branch, &d.branch_en].iter().all(|s| s.trim().is_empty()) { String::new() }
                else { format!("\\TULbranch{{{}}}{{{}}}{{{}}}", text(&d.branch_code, "Kód oboru", 80)?, text(&d.branch, "Název oboru", 200)?, text(&d.branch_en, "Anglický název oboru", 200)?) };
            let data = patch(&source(bytes, "nastaveni/udaje.tex")?, vec![
                ("\\TULtitle{Ukázková práce}{Example thesis}", format!("\\TULtitle{{{}}}{{{}}}", text(&d.title, "Název práce", 300)?, text(&d.title_en, "Anglický název práce", 300)?)),
                ("\\TULauthor{Jméno Příjmení}", format!("\\TULauthor{{{}}}", text(&d.author, "Autor", 200)?)),
                ("\\TULprogramme{KÓD}{Název programu}{Programme name}", format!("\\TULprogramme{{{}}}{{{}}}{{{}}}", text(&d.programme_code, "Kód programu", 80)?, text(&d.programme, "Studijní program", 200)?, text(&d.programme_en, "Anglický název programu", 200)?)),
                ("\\TULbranch{KÓD}{Název oboru}{Field of study}", branch),
                ("\\TULsupervisor{Jméno vedoucího}", format!("\\TULsupervisor{{{}}}", text(&d.supervisor, "Vedoucí práce", 200)?)),
                ("\\TULyear{2026}", format!("\\TULyear{{{}}}", d.year)),
            ])?;
            vec![("main.tex".into(), main), ("nastaveni/udaje.tex".into(), data)]
        },
        ("tul-presentation", TemplateDetails::Presentation(d)) => {
            let unit = faculty(&d.faculty, true)?;
            let options = if unit.is_empty() { "aspect169".into() } else { format!("aspect169,{unit}") };
            let main = patch(&source(bytes, "main.tex")?, vec![
                ("\\documentclass[aspect169]{tulpresentation}", format!("\\documentclass[{options}]{{tulpresentation}}")),
                ("\\title{Moje první prezentace}", format!("\\title{{{}}}", text(&d.title, "Název prezentace", 300)?)),
                ("\\author{Cvičný autor}", format!("\\author{{{}}}", authors(&d.authors)?)),
                // This class displays \insertinstitute, but never \insertdate itself.
                ("\\institute{Cvičné pracoviště}", format!("\\institute{{{}\\\\ \\insertdate}}", text(&d.institute, "Pracoviště", 200)?)),
                ("\\newcommand{\\authorMail}{}", format!("\\newcommand{{\\authorMail}}{{{}}}", optional(&d.email, "E-mail", 200)?)),
                ("\\newcommand{\\authorPhone}{}", format!("\\newcommand{{\\authorPhone}}{{{}}}", optional(&d.phone, "Telefon", 80)?)),
                ("\\date{}", format!("\\date{{{}}}", czech_date(&d.date)?)),
            ])?;
            vec![("main.tex".into(), main)]
        },
        ("tul-poster", TemplateDetails::Poster(d)) => {
            let unit = faculty(&d.faculty, false)?;
            let options = if unit.is_empty() { "a1paper,portrait,screen".into() } else { format!("a1paper,portrait,screen,{unit}") };
            let main = patch(&source(bytes, "main.tex")?, vec![("\\documentclass[a1paper,portrait,screen]{tulposter}", format!("\\documentclass[{options}]{{tulposter}}"))])?;
            let data = patch(&source(bytes, "nastaveni.tex")?, vec![
                ("title={Chytrý květináč}", format!("title={{{}}}", text(&d.title, "Název posteru", 300)?)),
                ("subtitle={Otevřená senzorová platforma pro školní laboratoř}", format!("subtitle={{{}}}", optional(&d.subtitle, "Podnázev", 300)?)),
                ("author={Anna Malá, David Horák, Eliška Veselá}", format!("author={{{}}}", authors(&d.authors)?)),
                ("department={Katedra fyziky}", format!("department={{{}}}", text(&d.department, "Pracoviště", 200)?)),
                ("contact={smartplanter@tul.cz}", format!("contact={{{}}}", optional(&d.contact, "Kontakt", 200)?)),
                ("website={www.fp.tul.cz}", format!("website={{{}}}", optional(&d.website, "Web", 200)?)),
                ("event={Studentská přehlídka 2026\\\\Ukázkový projekt}", format!("event={{{}}}", optional(&d.event, "Akce", 200)?)),
            ])?;
            vec![("main.tex".into(), main), ("nastaveni.tex".into(), data)]
        },
        _ => return Err("Údaje neodpovídají zvolené šabloně.".into()),
    };
    Ok(files)
}

#[cfg(test)]
pub(crate) fn example(template: &str) -> TemplateDetails {
    match template {
        "tul-thesis" => TemplateDetails::Thesis(ThesisDetails { faculty: "FUA".into(), work_type: "DP".into(), title: "Měření & modelování 50%".into(), title_en: "Measurement & modelling".into(), author: "Zkušební autorka".into(), supervisor: "Zkušební vedoucí".into(), year: 2026, declaration: "female".into(), programme_code: "N0000".into(), programme: "Ukázkový program".into(), programme_en: "Example programme".into(), branch_code: "".into(), branch: "".into(), branch_en: "".into() }),
        "tul-presentation" => TemplateDetails::Presentation(PresentationDetails { faculty: "FUA".into(), title: "Prezentace & výsledky 50%".into(), authors: vec!["Zkušební autorka".into(), "Zkušební autor".into()], institute: "Zkušební pracoviště".into(), date: "2026-11-06".into(), email: "test_user@tul.cz".into(), phone: "".into() }),
        _ => TemplateDetails::Poster(PosterDetails { faculty: "FUA".into(), title: "Poster & výsledky 50%".into(), subtitle: "Zkušební podnázev".into(), authors: vec!["Zkušební autorka".into(), "Zkušební autor".into()], department: "Zkušební pracoviště".into(), contact: "test_user@tul.cz".into(), website: "https://example.org/test_page".into(), event: "Ukázková konference 2026".into() }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const THESIS: &[u8] = include_bytes!("../../resources/templates/thesis-tul.zip");
    const PRESENTATION: &[u8] = include_bytes!("../../resources/templates/presentation-tul.zip");
    const POSTER: &[u8] = include_bytes!("../../resources/templates/poster-tul.zip");

    #[test]
    fn metadata_preserves_bodies_comments_and_original_ranges() {
        for (kind, bytes) in [("tul-thesis", THESIS), ("tul-presentation", PRESENTATION), ("tul-poster", POSTER)] {
            let files = prepare(kind, bytes, &example(kind)).unwrap();
            let main = &files.iter().find(|(p, _)| p == "main.tex").unwrap().1;
            let original = source(bytes, "main.tex").unwrap();
            let boundary = "\\begin{document}";
            let expected_body = if kind == "tul-thesis" { original[original.find(boundary).unwrap()..].replace("\\ThesisStart{male}", "\\ThesisStart{female}") } else { original[original.find(boundary).unwrap()..].into() };
            assert_eq!(&main[main.find(boundary).unwrap()..], expected_body);
            let (_, metadata) = files.last().unwrap();
            assert!(metadata.contains("\\&")); assert!(metadata.contains("50\\%") || kind == "tul-thesis");
            assert!(main.contains(if kind == "tul-poster" { ",FUA]" } else { "FA]" }) || main.contains("[FA,DP]"));
            if kind == "tul-presentation" { assert!(main.contains("\\\\ \\insertdate}")); }
        }
        let original = "\u{feff}a\r\nMARK1\r\nMARK2\r\n";
        assert_eq!(patch(original, vec![("MARK1", "MARK2 & user".into()), ("MARK2", "done".into())]).unwrap(), "\u{feff}a\r\nMARK2 & user\r\ndone\r\n");
        assert!(patch("duplicate duplicate", vec![("duplicate", "x".into())]).is_err());
    }

    #[test]
    fn mismatches_invalid_enums_lists_and_partial_branch_are_rejected() {
        assert!(prepare("tul-poster", POSTER, &example("tul-thesis")).is_err());
        if let TemplateDetails::Thesis(mut d) = example("tul-thesis") {
            d.branch = "Only one field".into(); assert!(prepare("tul-thesis", THESIS, &TemplateDetails::Thesis(d.clone())).is_err());
            d.branch.clear(); d.work_type = "DP]\\input{x}".into(); assert!(prepare("tul-thesis", THESIS, &TemplateDetails::Thesis(d)).is_err());
        }
        assert!(authors(&[]).is_err()); assert!(authors(&vec!["Author".into(); 21]).is_err()); assert!(authors(&["First\nSecond".into()]).is_err());
        for unit in ["TUL", "FS", "FT", "FP", "EF", "FUA", "FM", "FZS", "CXI"] { assert!(faculty(unit, true).is_ok()); }
        assert!(faculty("FM,EN", false).is_err());
    }

    #[test]
    fn ipc_payload_uses_camel_case_and_rejects_unknown_fields() {
        let payload = serde_json::json!({"kind":"presentation","faculty":"TUL","title":"Title","authors":["First","Second"],"institute":"Lab","date":"2026-11-06","email":"","phone":""});
        let decoded: TemplateDetails = serde_json::from_value(payload.clone()).unwrap();
        assert!(prepare("tul-presentation", PRESENTATION, &decoded).is_ok());
        let mut unknown = payload; unknown["workType"] = "DP".into();
        assert!(serde_json::from_value::<TemplateDetails>(unknown).is_err());
        let thesis = serde_json::json!({"kind":"thesis","faculty":"TUL","workType":"BP","title":"CZ","titleEn":"EN","author":"Name","supervisor":"Supervisor","year":2026,"declaration":"male","programmeCode":"B0000","programme":"CZ","programmeEn":"EN","branchCode":"","branch":"","branchEn":""});
        let decoded: TemplateDetails = serde_json::from_value(thesis).unwrap();
        assert!(prepare("tul-thesis", THESIS, &decoded).is_ok());
    }
}
