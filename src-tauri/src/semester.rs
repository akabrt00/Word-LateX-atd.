//! Plain-text metadata applied only to the known declarations of a new semester copy.
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct SemesterDetails {
    pub faculty: String,
    pub title: String,
    pub authors: Vec<String>,
    pub subject: String,
    pub year: u16,
    pub date: String,
    pub assignment_version: String,
}

fn plain(value: &str, label: &str, max: usize) -> Result<String, String> {
    let value = value.trim();
    if value.is_empty() || value.chars().count() > max
        || value.chars().any(|c| c.is_control() || c == '\u{2028}' || c == '\u{2029}')
    { return Err(format!("{label}: vyplňte jeden řádek textu (nejvýše {max} znaků).")); }
    Ok(value.to_owned())
}

pub(super) fn tex_text(text: &str) -> String {
    text.chars().map(|c| match c {
        '\\' => "\\textbackslash{}".into(), '{' => "\\{".into(), '}' => "\\}".into(),
        '$' => "\\$".into(), '&' => "\\&".into(), '%' => "\\%".into(), '#' => "\\#".into(),
        '_' => "\\_".into(), '~' => "\\textasciitilde{}".into(), '^' => "\\textasciicircum{}".into(),
        _ => c.to_string(),
    }).collect()
}

pub(super) fn czech_date(iso: &str) -> Result<String, String> {
    let invalid = || "Datum musí být platný kalendářní den ve tvaru RRRR-MM-DD.".to_string();
    let parts: Vec<_> = iso.split('-').collect();
    if parts.len() != 3 || parts[0].len() != 4 || parts[1].len() != 2 || parts[2].len() != 2
        || parts.iter().any(|p| !p.bytes().all(|b| b.is_ascii_digit())) { return Err(invalid()); }
    let year: u16 = parts[0].parse().map_err(|_| invalid())?;
    let month: usize = parts[1].parse().map_err(|_| invalid())?;
    let day: u8 = parts[2].parse().map_err(|_| invalid())?;
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let days = [31, if leap {29} else {28}, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if year < 1900 || !(1..=12).contains(&month) || day == 0 || day > days[month - 1] { return Err(invalid()); }
    let months = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    Ok(format!("{day}. {} {year}", months[month - 1]))
}

impl SemesterDetails {
    fn authors_tex(&self) -> Result<String, String> {
        if self.authors.is_empty() || self.authors.len() > 20 {
            return Err("Vyplňte alespoň jednoho autora, nejvýše 20 jmen.".into());
        }
        self.authors.iter().enumerate().map(|(index, author)|
            plain(author, &format!("Autor {}", index + 1), 200).map(|text| tex_text(&text)))
            .collect::<Result<Vec<_>, _>>().map(|names| names.join("\\\\ "))
    }

    pub(crate) fn render_style(&self, original: &str) -> Result<String, String> {
        self.authors_tex()?;
        let marker = "\\tul@coverrow{Autor práce}{\\AutorPrace}";
        if original.matches(marker).count() != 1 {
            return Err("Tato verze titulní strany nepodporuje průvodce autory. Nebyl vytvořen žádný dokument.".into());
        }
        Ok(if self.authors.len() > 1 {
            original.replacen(marker, "\\tul@coverrow{Autoři práce}{\\AutorPrace}", 1)
        } else { original.to_owned() })
    }

    pub(crate) fn render(&self, original: &str) -> Result<String, String> {
        if !["TUL", "FS", "FT", "FP", "EF", "FUA", "FM", "FZS", "CXI"].contains(&self.faculty.as_str()) {
            return Err("Vyberte součást TUL z nabídky.".into());
        }
        if !(1900..=9999).contains(&self.year) { return Err("Rok musí mít čtyři číslice (1900–9999).".into()); }
        let replacements = [
            ("\\Fakulta{TUL}".to_string(), format!("\\Fakulta{{{}}}", self.faculty)),
            declaration("Predmet", "Modelování a simulace", &plain(&self.subject, "Předmět", 200)?),
            declaration("NazevPrace", "Semestrální práce", &plain(&self.title, "Název práce", 300)?),
            // Escape each name before inserting our own controlled line breaks.
            ("\\newcommand{\\AutorPrace}{Ukázkový autor}".into(), format!("\\newcommand{{\\AutorPrace}}{{{}}}", self.authors_tex()?)),
            declaration("DatumPrace", "20. října 2026", &czech_date(&self.date)?),
            declaration("RokPrace", "2026", &self.year.to_string()),
            declaration("VerzeZadani", "2", &plain(&self.assignment_version, "Verze zadání", 40)?),
        ];
        let boundary = original.find("\\begin{document}").ok_or("Šablona nemá očekávanou strukturu.")?;
        // Fail closed when a future template changes; never serialize or rewrite its body.
        for (expected, _) in &replacements {
            if original.matches(expected).count() != 1 || !original[..boundary].contains(expected) {
                return Err("Tato verze šablony nepodporuje předvyplnění údajů. Nebyl vytvořen žádný dokument.".into());
            }
        }
        // Apply only original ranges, backwards. User text cannot become another search target.
        let mut edits: Vec<_> = replacements.iter().map(|(expected, replacement)|
            (original.find(expected).unwrap(), expected.len(), replacement)).collect();
        edits.sort_by_key(|(offset, _, _)| std::cmp::Reverse(*offset));
        let mut result = original.to_owned();
        for (offset, length, replacement) in edits { result.replace_range(offset..offset + length, replacement); }
        Ok(result)
    }
}

fn declaration(name: &str, previous: &str, value: &str) -> (String, String) {
    (format!("\\newcommand{{\\{name}}}{{{previous}}}"), format!("\\newcommand{{\\{name}}}{{{}}}", tex_text(value)))
}

#[cfg(test)]
pub(crate) fn example_details() -> SemesterDetails {
    SemesterDetails { faculty: "FM".into(), title: "Měření & modelování 50%: vzorek_1 #2 $x$ ~ ^ \\ {test}".into(),
        authors: vec!["Zkušební autor".into()], subject: "Modelování a simulace".into(), year: 2026,
        date: "2026-11-05".into(), assignment_version: "1".into() }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn source() -> String {
        let mut zip = zip::ZipArchive::new(std::io::Cursor::new(include_bytes!("../../resources/templates/semester-tul.zip").as_slice())).unwrap();
        let mut source = String::new();
        use std::io::Read;
        zip.by_name("semestralni-prace.tex").unwrap().read_to_string(&mut source).unwrap();
        source
    }

    #[test]
    fn metadata_preserves_body_comments_bom_and_line_endings() {
        let source = source();
        for original in [source.clone(), format!("\u{feff}{}", source.replace("\r\n", "\n").replace('\n', "\r\n"))] {
            let result = example_details().render(&original).unwrap();
            let body = original.find("\\begin{document}").unwrap();
            assert_eq!(&original[body..], &result[result.find("\\begin{document}").unwrap()..]);
            assert!(result.contains("\\Fakulta{FM}"));
            assert!(result.contains("\\newcommand{\\DatumPrace}{5. listopadu 2026}"));
            assert!(result.contains("Měření \\& modelování 50\\%: vzorek\\_1 \\#2 \\$x\\$ \\textasciitilde{} \\textasciicircum{} \\textbackslash{} \\{test\\}"));
            assert_eq!(result.matches("\r\n").count(), original.matches("\r\n").count());
            assert_eq!(result.starts_with('\u{feff}'), original.starts_with('\u{feff}'));
        }
    }

    #[test]
    fn all_faculties_and_calendar_boundaries_are_validated() {
        for faculty in ["TUL", "FS", "FT", "FP", "EF", "FUA", "FM", "FZS", "CXI"] {
            let mut details = example_details(); details.faculty = faculty.into();
            assert!(details.render(&source()).unwrap().contains(&format!("\\Fakulta{{{faculty}}}")));
        }
        assert_eq!(czech_date("2028-02-29").unwrap(), "29. února 2028");
        for date in ["2026-02-29", "2026-04-31", "1900-02-29", "2026-00-05", "2026-11-00", "2026-1-05", "2026-11-05x"] { assert!(czech_date(date).is_err(), "{date}"); }
        let mut details = example_details(); details.faculty = "FM}\\input{x}".into();
        assert!(details.render(&source()).is_err());
        details = example_details(); details.authors = vec![" \n ".into()];
        assert!(details.render(&source()).is_err());
        details = example_details(); details.title = "x\ny".into();
        assert!(details.render(&source()).is_err());
    }

    #[test]
    fn changed_template_is_rejected_and_input_cannot_retarget_other_fields() {
        let original = source();
        let mut details = example_details();
        details.title = "\\newcommand{\\AutorPrace}{Ukázkový autor}".into();
        let result = details.render(&original).unwrap();
        assert!(result.contains("\\newcommand{\\AutorPrace}{Zkušební autor}"));
        assert!(details.render(&original.replace("\\Fakulta{TUL}", "\\Fakulta{FS}")).is_err());
        assert!(details.render(&(original + "\n\\Fakulta{TUL}")).is_err());
    }

    #[test]
    fn teams_keep_order_duplicates_and_escape_names_before_line_breaks() {
        let mut details = example_details();
        details.authors = vec!["Jana Nová & Petr 50%".into(), "Jiří_1 {\\input{x}}".into(), "Jana Nová & Petr 50%".into()];
        let result = details.render(&source()).unwrap();
        assert!(result.contains("\\newcommand{\\AutorPrace}{Jana Nová \\& Petr 50\\%\\\\ Jiří\\_1 \\{\\textbackslash{}input\\{x\\}\\}\\\\ Jana Nová \\& Petr 50\\%}"));
        let style = "prefix\r\n\\tul@coverrow{Autor práce}{\\AutorPrace}%\r\nsuffix";
        assert_eq!(details.render_style(style).unwrap(), style.replace("{Autor práce}", "{Autoři práce}"));
        assert_eq!(example_details().render_style(style).unwrap(), style);
        assert!(details.render_style("unknown style").is_err());
    }

    #[test]
    fn author_lists_reject_missing_blank_multiline_or_excessive_entries() {
        for authors in [vec![], vec![" ".into()], vec!["First".into(), "".into()], vec!["First\nSecond".into()], vec!["a".repeat(201)], vec!["Author".into(); 21]] {
            let mut details = example_details(); details.authors = authors;
            assert!(details.render(&source()).is_err());
        }
    }
}
