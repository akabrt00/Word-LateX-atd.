//! Local patches for the fixed TUL presentation declarations, never a TeX serializer.
use crate::document_metadata::{active, decode, iso_date, UNSUPPORTED};
use crate::semester::{czech_date, tex_text};
use crate::template_details::{PresentationDetails, TemplateDetails};
use serde::Serialize;
use std::ops::Range;

const MAIN: &str = "main.tex";
const ARCHIVE: &[u8] = include_bytes!("../../resources/templates/presentation-tul.zip");
const NAMES: [&str; 7] = ["documentclass", "title", "author", "institute", "authorMail", "authorPhone", "date"];
const PREFIXES: [&str; 7] = ["\\documentclass[", "\\title{", "\\author{", "\\institute{", "\\newcommand{\\authorMail}{", "\\newcommand{\\authorPhone}{", "\\date{"];
const DATE_SUFFIX: &str = "\\\\ \\insertdate";

fn ranges(source: &str) -> Result<Vec<Range<usize>>, String> {
    let mut found: Vec<Option<Range<usize>>> = vec![None; NAMES.len()];
    let mut mentions = [0; NAMES.len()];
    let mut offset = 0;
    let mut body = false;
    let mut depth = 0usize;
    for line in source.split_inclusive('\n') {
        let clean = active(line);
        let trimmed = clean.trim_start_matches(|c: char| c.is_whitespace() || c == '\u{feff}');
        if !body && ["\\catcode", "\\csname", "\\begingroup", "\\endgroup", "\\bgroup", "\\egroup"].iter().any(|token| clean.contains(token)) { return Err(UNSUPPORTED.into()); }
        if clean.contains("\\begin{document}") {
            if trimmed.trim_end() != "\\begin{document}" || body || depth != 0 { return Err(UNSUPPORTED.into()); }
            body = true;
        }
        for (i, name) in NAMES.iter().enumerate() {
            let token = format!("\\{name}");
            mentions[i] += clean.match_indices(&token).filter(|(at, _)|
                !clean[at + token.len()..].chars().next().is_some_and(|c| c.is_ascii_alphabetic())).count();
            if !trimmed.starts_with(PREFIXES[i]) { continue; }
            if body || depth != 0 || found[i].is_some() { return Err(UNSUPPORTED.into()); }
            let start = clean.len() - trimmed.len() + PREFIXES[i].len();
            let (end, tail) = if i == 0 {
                let end = start + clean[start..].find(']').ok_or(UNSUPPORTED)?;
                (end, end + "]{tulpresentation}".len())
            } else {
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
                (end, end + 1)
            };
            if i == 0 && !clean[end..].starts_with("]{tulpresentation}") { return Err(UNSUPPORTED.into()); }
            if tail > clean.len() || !clean[tail..].trim().is_empty() { return Err(UNSUPPORTED.into()); }
            found[i] = Some(offset + start..offset + end);
        }
        if !body {
            let mut escaped = false;
            for c in clean.chars() {
                if escaped { escaped = false; continue; }
                match c {
                    '\\' => escaped = true,
                    '{' => depth += 1,
                    '}' => { depth = depth.checked_sub(1).ok_or(UNSUPPORTED)?; },
                    _ => {},
                }
            }
        }
        offset += line.len();
    }
    if !body || mentions != [1; NAMES.len()] { return Err(UNSUPPORTED.into()); }
    found.into_iter().map(|range| range.ok_or_else(|| UNSUPPORTED.into())).collect()
}

fn validate(details: &PresentationDetails) -> Result<(), String> {
    crate::template_details::prepare("tul-presentation", ARCHIVE, &TemplateDetails::Presentation(details.clone())).map(|_| ())
}

fn read_source(source: &str) -> Result<PresentationDetails, String> {
    let spans = ranges(source)?;
    let value = |i: usize| &source[spans[i].clone()];
    let options: Vec<_> = value(0).split(',').map(str::trim).collect();
    if options.is_empty() || options[0] != "aspect169" || options.len() > 2 { return Err(UNSUPPORTED.into()); }
    let faculty = match options.get(1).copied() {
        None => "TUL", Some("FA") => "FUA", Some(unit) if ["FS", "FT", "FP", "EF", "FUA", "FM", "FZS", "CXI"].contains(&unit) => unit,
        _ => return Err(UNSUPPORTED.into()),
    };
    let details = PresentationDetails {
        faculty: faculty.into(), title: decode(value(1))?,
        // The bundled writer stores a comma-separated display list in \author.
        authors: decode(value(2))?.split(", ").map(str::to_owned).collect(),
        institute: decode(value(3).strip_suffix(DATE_SUFFIX).ok_or(UNSUPPORTED)?)?,
        email: decode(value(4))?, phone: decode(value(5))?, date: iso_date(value(6))?,
    };
    validate(&details)?;
    Ok(details)
}

fn values(details: &PresentationDetails) -> Result<Vec<String>, String> {
    validate(details)?;
    let options = match details.faculty.as_str() {
        "TUL" => "aspect169".into(), "FUA" => "aspect169,FA".into(), unit => format!("aspect169,{unit}"),
    };
    Ok(vec![options, tex_text(details.title.trim()), details.authors.iter().map(|a| tex_text(a.trim())).collect::<Vec<_>>().join(", "),
        format!("{}{DATE_SUFFIX}", tex_text(details.institute.trim())), tex_text(details.email.trim()), tex_text(details.phone.trim()), czech_date(&details.date)?])
}

fn patch(source: &str, details: &PresentationDetails) -> Result<String, String> {
    let old = values(&read_source(source)?)?;
    let new = values(details)?;
    let spans = ranges(source)?;
    let mut output = source.to_owned();
    // Ranges follow declaration kind, not physical order in a user's source.
    let mut edits: Vec<_> = spans.into_iter().enumerate().filter(|(i, _)| old[*i] != new[*i]).collect();
    edits.sort_by_key(|(_, range)| std::cmp::Reverse(range.start));
    for (i, range) in edits { output.replace_range(range, &new[i]); }
    Ok(output)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PresentationSnapshot {
    main: String,
    details: PresentationDetails,
    source_revision: String,
}

fn require_project(root: &str) -> Result<(), String> {
    let build = crate::workspace::project_build(std::path::Path::new(root))?.ok_or(UNSUPPORTED)?;
    if build.template != "tul-presentation" || build.main != MAIN { return Err(UNSUPPORTED.into()); }
    Ok(())
}

pub(crate) fn read_presentation_details(root: String) -> Result<PresentationSnapshot, String> {
    let _guard = crate::documents::WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    require_project(&root)?;
    let source = std::fs::read_to_string(crate::resolve(&root, MAIN)?).map_err(|e| e.to_string())?;
    Ok(PresentationSnapshot { main: MAIN.into(), details: read_source(&source)?, source_revision: crate::documents::revision(source.as_bytes()) })
}

#[tauri::command]
pub(crate) fn save_presentation_details(root: String, details: PresentationDetails, source_revision: String) -> Result<(), String> {
    let _guard = crate::documents::WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    require_project(&root)?;
    let path = crate::resolve(&root, MAIN)?;
    crate::documents::check_revision(&path, &source_revision)?;
    let source = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    if crate::documents::revision(source.as_bytes()) != source_revision { return Err("FILE_CONFLICT: Prezentace se během načítání změnila.".into()); }
    let next = patch(&source, &details)?;
    crate::documents::check_revision(&path, &source_revision)?;
    if next != source {
        let project = std::path::Path::new(&root).canonicalize().map_err(|e| e.to_string())?;
        crate::save_version(&project, MAIN, &source, crate::now_secs(), false)?;
        crate::write_file_checked_mode(&root, MAIN, &next, Some(&source_revision), false)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn example() -> PresentationDetails {
        match crate::template_details::example("tul-presentation") { TemplateDetails::Presentation(details) => details, _ => unreachable!() }
    }

    fn source() -> String {
        crate::template_details::prepare("tul-presentation", ARCHIVE, &TemplateDetails::Presentation(example())).unwrap().remove(0).1
    }

    #[test]
    fn patches_preserve_unknown_body_comments_bom_crlf_and_unchanged_spacing() {
        let source = format!("\u{feff}% \\title{{comment}}\r\n{}", source().replace("\r\n", "\n").replace('\n', "\r\n"))
            .replace("\\title{Prezentace", "\\title{  Prezentace");
        assert_eq!(patch(&source, &read_source(&source).unwrap()).unwrap(), source);
        let mut details = read_source(&source).unwrap();
        details.phone = "+420 123 456 789".into();
        let edited = patch(&source, &details).unwrap();
        assert_eq!(edited, source.replace("\\newcommand{\\authorPhone}{}", "\\newcommand{\\authorPhone}{+420 123 456 789}"));
        details.title = "Výsledky 50% & model_{A} \\ test".into();
        details.faculty = "FM".into(); details.date = "2027-02-28".into();
        let edited = patch(&source, &details).unwrap();
        assert_eq!(read_source(&edited).unwrap(), details);
        assert_eq!(&source[source.find("\\begin{document}").unwrap()..], &edited[edited.find("\\begin{document}").unwrap()..]);
    }

    #[test]
    fn reordered_declarations_are_patched_by_original_offsets() {
        let source = source();
        let mut lines: Vec<_> = source.lines().collect();
        let title = lines.iter().position(|line| line.starts_with("\\title{")).unwrap();
        let date = lines.iter().position(|line| line.starts_with("\\date{")).unwrap();
        lines.swap(title, date);
        let source = lines.join("\n");
        let mut details = read_source(&source).unwrap(); details.title = "A much longer title".into(); details.date = "2028-02-29".into();
        assert_eq!(read_source(&patch(&source, &details).unwrap()).unwrap(), details);
    }

    #[test]
    fn custom_commands_duplicates_invalid_dates_and_options_are_rejected() {
        let source = source();
        for bad in [
            source.replace("\\title{Prezentace", "\\title{\\textbf{X} Prezentace"),
            source.clone() + "\n\\renewcommand{\\title}{Other}",
            source.replace("\\author{", "\\author[Short]{"),
            source.replace("aspect169,FA", "aspect169,FM,FS"),
            source.replace("6. listopadu 2026", "31. února 2026"),
            source.replace("\\\\ \\insertdate", "\\\\ \\today"),
            source.replace("\\documentclass[", "\\documentclass ["),
            source.replace("\\title{", "\\newcommand{\\hidden}{\n\\title{").replace("\\author{", "}\n\\author{"),
            format!("\\begingroup\n{source}\\endgroup\n"),
        ] { assert!(read_source(&bad).is_err(), "{bad}"); }
    }

    fn fixture() -> (tempfile::TempDir, String) {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir(dir.path().join(".tulwriter")).unwrap();
        std::fs::write(dir.path().join(".tulwriter/project.json"), r#"{"main":"main.tex","engine":"xelatex","bibliography":null,"template":"tul-presentation"}"#).unwrap();
        std::fs::write(dir.path().join(MAIN), source()).unwrap();
        let root = dir.path().to_string_lossy().into_owned();
        (dir, root)
    }

    #[test]
    fn disk_conflicts_noop_and_history_preserve_user_work() {
        let (dir, root) = fixture();
        let payload = serde_json::to_value(crate::document_metadata::read_document_details(root.clone()).unwrap()).unwrap();
        assert_eq!(payload["kind"], "presentation");
        assert!(payload["snapshot"]["sourceRevision"].is_string());
        assert_eq!(payload["snapshot"]["details"]["institute"], example().institute);
        let initial = read_presentation_details(root.clone()).unwrap();
        let original = std::fs::read(dir.path().join(MAIN)).unwrap();
        save_presentation_details(root.clone(), initial.details.clone(), initial.source_revision.clone()).unwrap();
        assert!(crate::history_ids(dir.path(), MAIN).is_empty());
        std::fs::write(dir.path().join(MAIN), "external work").unwrap();
        assert!(save_presentation_details(root.clone(), initial.details.clone(), initial.source_revision.clone()).unwrap_err().starts_with("FILE_CONFLICT:"));
        assert_eq!(std::fs::read_to_string(dir.path().join(MAIN)).unwrap(), "external work");
        std::fs::write(dir.path().join(MAIN), &original).unwrap();
        let mut changed = initial.details.clone(); changed.title = "Nový název".into();
        save_presentation_details(root.clone(), changed.clone(), initial.source_revision.clone()).unwrap();
        assert!(crate::history_ids(dir.path(), MAIN).iter().any(|id| std::fs::read(crate::history_dir(dir.path(), MAIN).join(format!("{id}.txt"))).unwrap() == original));
        assert!(save_presentation_details(root.clone(), initial.details.clone(), initial.source_revision).is_err());
        let current = read_presentation_details(root.clone()).unwrap();
        assert_eq!(current.details, changed);
        save_presentation_details(root.clone(), initial.details, current.source_revision).unwrap();
        assert_eq!(std::fs::read(dir.path().join(MAIN)).unwrap(), original);
        let current = read_presentation_details(root.clone()).unwrap();
        std::fs::remove_file(dir.path().join(MAIN)).unwrap();
        assert!(save_presentation_details(root.clone(), current.details, current.source_revision).unwrap_err().starts_with("FILE_CONFLICT:"));
        std::fs::write(dir.path().join(".tulwriter/project.json"), r#"{"main":"main.tex","engine":"pdflatex","bibliography":null,"template":"blank"}"#).unwrap();
        assert!(crate::document_metadata::read_document_details(root).is_err());
    }

    #[test]
    #[ignore = "Requires XeLaTeX, pdftotext and presentation packages"]
    fn edited_presentation_pdf() {
        let dir = tempfile::tempdir().unwrap();
        let project = crate::workspace::create_starter(dir.path(), "Edited presentation", "tul-presentation").unwrap();
        std::fs::write(project.join(MAIN), source()).unwrap();
        let root = project.to_string_lossy().into_owned();
        let snapshot = read_presentation_details(root.clone()).unwrap();
        let mut changed = snapshot.details;
        changed.title = "Nové výsledky".into(); changed.authors = vec!["Ověřená autorka".into()];
        changed.faculty = "EF".into(); changed.date = "2027-01-09".into();
        save_presentation_details(root.clone(), changed, snapshot.source_revision).unwrap();
        let compiled = crate::compile_blocking(&root, MAIN).unwrap();
        assert!(compiled.ok, "{}", compiled.log);
        assert_eq!(compiled.engine, "xelatex");
        let pdf = project.join(compiled.pdf.unwrap());
        assert!(std::fs::read(&pdf).unwrap().starts_with(b"%PDF-"));
        let text_path = project.join("metadata-result.txt");
        let extracted = std::process::Command::new("pdftotext").arg("-layout").arg(pdf).arg(&text_path).output().unwrap();
        assert!(extracted.status.success());
        let text = std::fs::read_to_string(text_path).unwrap();
        for expected in ["Nové výsledky", "Ověřená autorka", "9. ledna 2027"] { assert!(text.contains(expected), "Missing {expected}: {text}"); }
    }
}
