//! Conservative edits of supported semester declarations, with disk revision checks.
use crate::semester::{czech_date, tex_text, SemesterDetails};
use serde::Serialize;
use std::ops::Range;

const MAIN: &str = "semestralni-prace.tex";
const STYLE: &str = "tul-semestralni.sty";
const NAMES: [&str; 7] = ["Fakulta", "Predmet", "NazevPrace", "AutorPrace", "DatumPrace", "RokPrace", "VerzeZadani"];
const UNSUPPORTED: &str = "Tento dokument obsahuje nepodporované nebo nejednoznačné údaje. Upravte je ve zdroji LaTeXu; formulář nic nezměnil.";
const MONTHS: [&str; 12] = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];

// Strip only real TeX comments, respecting escaped percent signs.
fn active(line: &str) -> &str {
    let mut escaped = false;
    for (i, c) in line.char_indices() {
        if c == '%' && !escaped { return &line[..i]; }
        escaped = c == '\\' && !escaped;
    }
    line
}

fn ranges(source: &str) -> Result<Vec<Range<usize>>, String> {
    let mut found: Vec<Option<Range<usize>>> = vec![None; 7];
    let mut offset = 0;
    let mut body = false;
    let mut mentions = [0; 7];
    for line in source.split_inclusive('\n') {
        let clean = active(line);
        if clean.contains("\\begin{document}") { body = true; }
        // Reject redefinitions and uses outside the known declaration. This deliberately
        // excludes custom TeX constructions rather than attempting macro expansion.
        for (i, name) in NAMES.iter().enumerate() {
            let token = format!("\\{name}");
            mentions[i] += clean.match_indices(&token).filter(|(at, _)|
                !clean[at + token.len()..].chars().next().is_some_and(|c| c.is_ascii_alphabetic())).count();
        }
        let trimmed = clean.trim_start_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
        for (i, name) in NAMES.iter().enumerate() {
            let prefix = if i == 0 { "\\Fakulta{".into() } else { format!("\\newcommand{{\\{name}}}{{") };
            if !trimmed.starts_with(&prefix) { continue; }
            if body || found[i].is_some() { return Err(UNSUPPORTED.into()); }
            let start = clean.len() - trimmed.len() + prefix.len();
            let mut depth = 1;
            let mut escaped = false;
            let mut end = None;
            for (at, c) in clean[start..].char_indices() {
                if escaped { escaped = false; continue; }
                match c {
                    '\\' => escaped = true,
                    '{' => depth += 1,
                    '}' => { depth -= 1; if depth == 0 { end = Some(start + at); break; } },
                    _ => {},
                }
            }
            let end = end.ok_or(UNSUPPORTED)?;
            if !clean[end + 1..].trim().is_empty() { return Err(UNSUPPORTED.into()); }
            found[i] = Some(offset + start..offset + end);
        }
        offset += line.len();
    }
    if !body || mentions != [1; 7] { return Err(UNSUPPORTED.into()); }
    found.into_iter().map(|r| r.ok_or_else(|| UNSUPPORTED.into())).collect()
}

fn decode(value: &str) -> Result<String, String> {
    let tokens = [
        ("\\textbackslash{}", "\\"), ("\\textasciitilde{}", "~"), ("\\textasciicircum{}", "^"),
        ("\\{", "{"), ("\\}", "}"), ("\\$", "$"), ("\\&", "&"), ("\\%", "%"), ("\\#", "#"), ("\\_", "_"),
    ];
    let mut rest = value;
    let mut result = String::new();
    while !rest.is_empty() {
        if let Some((from, to)) = tokens.iter().find(|(from, _)| rest.starts_with(from)) {
            result.push_str(to); rest = &rest[from.len()..];
        } else {
            let c = rest.chars().next().unwrap();
            if "\\{}$&#%_~^".contains(c) || c.is_control() { return Err(UNSUPPORTED.into()); }
            result.push(c); rest = &rest[c.len_utf8()..];
        }
    }
    Ok(result)
}

fn read_source(source: &str) -> Result<SemesterDetails, String> {
    let spans = ranges(source)?;
    let values: Vec<&str> = spans.iter().map(|r| &source[r.clone()]).collect();
    let date = decode(values[4])?;
    let date_parts: Vec<_> = date.split_whitespace().collect();
    if date_parts.len() != 3 { return Err(UNSUPPORTED.into()); }
    let day: u8 = date_parts[0].strip_suffix('.').ok_or(UNSUPPORTED)?.parse().map_err(|_| UNSUPPORTED)?;
    let month = MONTHS.iter().position(|m| *m == date_parts[1]).ok_or(UNSUPPORTED)? + 1;
    let year: u16 = date_parts[2].parse().map_err(|_| UNSUPPORTED)?;
    let details = SemesterDetails {
        faculty: decode(values[0])?, subject: decode(values[1])?, title: decode(values[2])?,
        authors: values[3].split("\\\\ ").map(decode).collect::<Result<Vec<_>, _>>()?,
        date: format!("{year:04}-{month:02}-{day:02}"),
        year: values[5].parse().map_err(|_| UNSUPPORTED)?, assignment_version: decode(values[6])?,
    };
    validate(&details)?;
    Ok(details)
}

fn validate(details: &SemesterDetails) -> Result<(), String> {
    // Reuse the same complete validation as the new-document wizard.
    details.render(&original_source()?).map(|_| ())
}

fn original_source() -> Result<String, String> {
    use std::io::Read;
    let mut zip = zip::ZipArchive::new(std::io::Cursor::new(include_bytes!("../../resources/templates/semester-tul.zip").as_slice())).map_err(|e| e.to_string())?;
    let mut text = String::new();
    zip.by_name(MAIN).map_err(|e| e.to_string())?.read_to_string(&mut text).map_err(|e| e.to_string())?;
    Ok(text)
}

fn patch(source: &str, details: &SemesterDetails) -> Result<String, String> {
    let previous = read_source(source)?;
    validate(details)?;
    let spans = ranges(source)?;
    let values = vec![details.faculty.clone(), tex_text(details.subject.trim()), tex_text(details.title.trim()),
        details.authors.iter().map(|a| tex_text(a.trim())).collect::<Vec<_>>().join("\\\\ "),
        czech_date(&details.date)?, details.year.to_string(), tex_text(details.assignment_version.trim())];
    // Preserve byte-for-byte formatting of unchanged fields, including hand-entered spacing.
    let old = vec![previous.faculty, previous.subject.trim().into(), previous.title.trim().into(), previous.authors.iter().map(|a| a.trim()).collect::<Vec<_>>().join("\n"), previous.date, previous.year.to_string(), previous.assignment_version.trim().into()];
    let new = vec![details.faculty.clone(), details.subject.trim().into(), details.title.trim().into(), details.authors.iter().map(|a| a.trim()).collect::<Vec<_>>().join("\n"), details.date.clone(), details.year.to_string(), details.assignment_version.trim().into()];
    let mut output = source.to_string();
    for i in (0..7).rev() { if old[i] != new[i] { output.replace_range(spans[i].clone(), &values[i]); } }
    Ok(output)
}

fn patch_style(style: &str, count: usize) -> Result<String, String> {
    let one = "\\tul@coverrow{Autor práce}{\\AutorPrace}";
    let many = "\\tul@coverrow{Autoři práce}{\\AutorPrace}";
    if style.matches(one).count() + style.matches(many).count() != 1 { return Err(UNSUPPORTED.into()); }
    Ok(style.replacen(if style.contains(one) { one } else { many }, if count == 1 { one } else { many }, 1))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SemesterSnapshot {
    main: String,
    details: SemesterDetails,
    source_revision: String,
    style_revision: String,
}

fn require_project(root: &str) -> Result<(), String> {
    let build = crate::workspace::project_build(std::path::Path::new(root))?.ok_or("Údaje práce jsou dostupné pro semestrální šablonu TUL vytvořenou v aplikaci.")?;
    if build.template != "tul-semester" || build.main != MAIN { return Err("Údaje práce jsou zatím dostupné jen pro semestrální šablonu TUL.".into()); }
    Ok(())
}

#[tauri::command]
pub(crate) fn read_semester_details(root: String) -> Result<SemesterSnapshot, String> {
    let _guard = crate::documents::WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    require_project(&root)?;
    let source = std::fs::read_to_string(crate::resolve(&root, MAIN)?).map_err(|e| e.to_string())?;
    let style = std::fs::read_to_string(crate::resolve(&root, STYLE)?).map_err(|e| e.to_string())?;
    let details = read_source(&source)?;
    patch_style(&style, details.authors.len())?;
    Ok(SemesterSnapshot { main: MAIN.into(), details, source_revision: crate::documents::revision(source.as_bytes()), style_revision: crate::documents::revision(style.as_bytes()) })
}

#[tauri::command]
pub(crate) fn save_semester_details(root: String, details: SemesterDetails, source_revision: String, style_revision: String) -> Result<(), String> {
    let _guard = crate::documents::WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    require_project(&root)?;
    let source_path = crate::resolve(&root, MAIN)?;
    let style_path = crate::resolve(&root, STYLE)?;
    crate::documents::check_revision(&source_path, &source_revision)?;
    crate::documents::check_revision(&style_path, &style_revision)?;
    let source = std::fs::read_to_string(&source_path).map_err(|e| e.to_string())?;
    let style = std::fs::read_to_string(&style_path).map_err(|e| e.to_string())?;
    // Compare the exact bytes used to compute patches as well as both preconditions.
    if crate::documents::revision(source.as_bytes()) != source_revision || crate::documents::revision(style.as_bytes()) != style_revision { return Err("FILE_CONFLICT: Dokument se během načítání změnil.".into()); }
    let next_source = patch(&source, &details)?;
    let next_style = patch_style(&style, details.authors.len())?;
    // Both inputs must still match before writing either file. Individual writes use the
    // existing atomic replacement/history code and recheck immediately before rename.
    crate::documents::check_revision(&source_path, &source_revision)?;
    crate::documents::check_revision(&style_path, &style_revision)?;
    // Keep an explicit ungrouped checkpoint, including manual changes made outside
    // this app. A later metadata save must never coalesce away that input version.
    let project_path = std::path::Path::new(&root).canonicalize().map_err(|e| e.to_string())?;
    if next_source != source { crate::save_version(&project_path, MAIN, &source, crate::now_secs(), false)?; }
    if next_style != style { crate::save_version(&project_path, STYLE, &style, crate::now_secs(), false)?; }
    write_changes(&source, &style, &next_source, &next_style, &source_revision, &style_revision,
        |rel, content, revision| crate::write_file_checked_mode(&root, rel, content, Some(revision), false))
}

fn write_changes(source: &str, style: &str, next_source: &str, next_style: &str, source_revision: &str, style_revision: &str,
    mut write: impl FnMut(&str, &str, &str) -> Result<(), String>) -> Result<(), String> {
    if next_source != source { write(MAIN, next_source, source_revision)?; }
    if next_style != style {
        if let Err(error) = write(STYLE, next_style, style_revision) {
            if next_source != source {
                if let Err(rollback) = write(MAIN, source, &crate::documents::revision(next_source.as_bytes())) {
                    return Err(format!("Částečné uložení: zdroj byl změněn, styl nikoli. Obnovení zdroje selhalo: {rollback}. Původní zdroj je v historii. Příčina: {error}"));
                }
            }
            return Err(format!("Údaje nebyly uloženy; zdroj byl obnoven. {error}"));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_and_local_edits_preserve_bytes() {
        let original = original_source().unwrap();
        let details = crate::semester::example_details();
        let source = details.render(&original).unwrap();
        for source in [source.clone(), format!("\u{feff}{}", source.replace("\r\n", "\n").replace('\n', "\r\n"))] {
            assert_eq!(read_source(&source).unwrap(), details);
            assert_eq!(patch(&source, &details).unwrap(), source);
            let mut changed = details.clone(); changed.title = "Nový název 50% & test_1".into(); changed.authors = vec!["Alena {A}".into(), "Jiří \\ B".into()];
            let edited = patch(&source, &changed).unwrap();
            assert_eq!(read_source(&edited).unwrap(), changed);
            assert_eq!(&source[source.find("\\begin{document}").unwrap()..], &edited[edited.find("\\begin{document}").unwrap()..]);
            let restored = patch(&edited, &details).unwrap(); assert_eq!(restored, source);
        }
    }

    #[test]
    fn custom_macros_duplicates_and_unknown_syntax_are_rejected() {
        let source = crate::semester::example_details().render(&original_source().unwrap()).unwrap();
        for bad in [source.replace("Zkušební autor", "\\textbf{Autor}"), source.clone() + "\n\\renewcommand{\\AutorPrace}{Other}", source.replace("\\Fakulta{FM}", "\\Fakulta{FM}\n\\Fakulta{FS}"), source.replace("\\newcommand{\\NazevPrace}", "\\newcommand \\NazevPrace"), source.replace("5. listopadu 2026", "31. února 2026")] {
            assert!(read_source(&bad).is_err());
        }
        assert!(patch_style("custom style", 1).is_err());
        assert_eq!(decode(&tex_text("\\{}$&#%_~^ Žluťoučký")).unwrap(), "\\{}$&#%_~^ Žluťoučký");
    }

    #[test]
    fn comments_and_unchanged_spacing_are_preserved() {
        let original = original_source().unwrap();
        let source = original.replace("{Modelování a simulace}", "{ Modelování a simulace } % vlastní komentář");
        let source = format!("% \\AutorPrace a \\begin{{document}} v komentáři\r\n{source}");
        let details = read_source(&source).unwrap();
        assert_eq!(patch(&source, &details).unwrap(), source);
        let mut changed = details.clone(); changed.year = 2027;
        let edited = patch(&source, &changed).unwrap();
        assert_eq!(edited, source.replace("\\newcommand{\\RokPrace}{2026}", "\\newcommand{\\RokPrace}{2027}"));
    }

    #[test]
    fn failed_style_write_restores_source_but_never_overwrites_external_edits() {
        for concurrent in [false, true] {
            let (dir, root) = fixture();
            let snapshot = read_semester_details(root.clone()).unwrap();
            let source = std::fs::read_to_string(dir.path().join(MAIN)).unwrap();
            let style = std::fs::read_to_string(dir.path().join(STYLE)).unwrap();
            let mut changed = snapshot.details; changed.authors.push("Druhý autor".into());
            let next_source = patch(&source, &changed).unwrap();
            let next_style = patch_style(&style, 2).unwrap();
            let _guard = crate::documents::WRITE_LOCK.lock().unwrap();
            let result = write_changes(&source, &style, &next_source, &next_style, &snapshot.source_revision, &snapshot.style_revision, |rel, content, revision| {
                if rel == STYLE {
                    if concurrent { std::fs::write(dir.path().join(MAIN), "external edit during failure").unwrap(); }
                    return Err("simulated style write failure".into());
                }
                crate::write_file_checked(&root, rel, content, Some(revision))
            }).unwrap_err();
            assert_eq!(std::fs::read_to_string(dir.path().join(STYLE)).unwrap(), style);
            if concurrent {
                assert!(result.starts_with("Částečné uložení:"));
                assert_eq!(std::fs::read_to_string(dir.path().join(MAIN)).unwrap(), "external edit during failure");
            } else {
                assert!(result.contains("zdroj byl obnoven"));
                assert_eq!(std::fs::read_to_string(dir.path().join(MAIN)).unwrap(), source);
            }
        }
    }

    #[test]
    #[ignore = "Requires pdfLaTeX, BibTeX and semester packages"]
    fn semester_edit_pdf() {
        let dir = tempfile::tempdir().unwrap();
        let project = crate::workspace::create_starter(dir.path(), "Úprava údajů", "tul-semester").unwrap();
        let root = project.to_string_lossy().into_owned();
        for authors in [vec!["Autorka A".into(), "Autor B".into()], vec!["Jediná autorka".into()]] {
            let snapshot = read_semester_details(root.clone()).unwrap();
            let mut details = snapshot.details; details.title = "Upraveno & ověřeno 50%".into(); details.authors = authors;
            save_semester_details(root.clone(), details.clone(), snapshot.source_revision, snapshot.style_revision).unwrap();
            assert_eq!(read_semester_details(root.clone()).unwrap().details, details);
            let result = crate::compile_blocking(&root, MAIN).unwrap();
            assert!(result.ok, "{}", result.log);
            assert!(std::fs::read(project.join(result.pdf.unwrap())).unwrap().starts_with(b"%PDF-"));
        }
    }

    fn fixture() -> (tempfile::TempDir, String) {
        let dir = tempfile::tempdir().unwrap(); let root = dir.path().to_string_lossy().into_owned();
        std::fs::create_dir(dir.path().join(".tulwriter")).unwrap();
        std::fs::write(dir.path().join(".tulwriter/project.json"), r#"{"main":"semestralni-prace.tex","engine":"pdflatex","bibliography":"bibtex","template":"tul-semester"}"#).unwrap();
        std::fs::write(dir.path().join(MAIN), crate::semester::example_details().render(&original_source().unwrap()).unwrap()).unwrap();
        std::fs::write(dir.path().join(STYLE), "prefix\r\n\\tul@coverrow{Autor práce}{\\AutorPrace}\r\nsuffix").unwrap();
        (dir, root)
    }

    #[test]
    fn edits_check_both_revisions_before_writing_and_allow_repeated_changes() {
        let (dir, root) = fixture();
        let snapshot = read_semester_details(root.clone()).unwrap();
        let original = std::fs::read(dir.path().join(MAIN)).unwrap();
        std::fs::write(dir.path().join(STYLE), "external style edit").unwrap();
        let mut details = snapshot.details.clone(); details.authors.push("Druhý autor".into());
        assert!(save_semester_details(root.clone(), details.clone(), snapshot.source_revision.clone(), snapshot.style_revision.clone()).unwrap_err().starts_with("FILE_CONFLICT:"));
        assert_eq!(std::fs::read(dir.path().join(MAIN)).unwrap(), original);
        std::fs::write(dir.path().join(STYLE), "\\tul@coverrow{Autor práce}{\\AutorPrace}").unwrap();
        let current = read_semester_details(root.clone()).unwrap();
        save_semester_details(root.clone(), details, current.source_revision, current.style_revision).unwrap();
        assert!(std::fs::read_to_string(dir.path().join(STYLE)).unwrap().contains("Autoři práce"));
        assert!(crate::history_ids(dir.path(), MAIN).iter().any(|id|
            std::fs::read(crate::history_dir(dir.path(), MAIN).join(format!("{id}.txt"))).unwrap() == original));
        assert!(save_semester_details(root.clone(), snapshot.details.clone(), snapshot.source_revision, snapshot.style_revision).is_err());
        let current = read_semester_details(root.clone()).unwrap();
        save_semester_details(root.clone(), snapshot.details, current.source_revision, current.style_revision).unwrap();
        assert!(std::fs::read_to_string(dir.path().join(STYLE)).unwrap().contains("{Autor práce}"));
        assert_eq!(std::fs::read(dir.path().join(MAIN)).unwrap(), original);
    }
}
