//! Shared plain-text decoding and dispatch for conservative template metadata forms.
use serde::Serialize;

pub(super) const UNSUPPORTED: &str = "Tento dokument obsahuje nepodporované nebo nejednoznačné údaje. Upravte je ve zdroji LaTeXu; formulář nic nezměnil.";

// Strip only real TeX comments, respecting escaped percent signs.
pub(super) fn active(line: &str) -> &str {
    let mut escaped = false;
    for (i, c) in line.char_indices() {
        if c == '%' && !escaped { return &line[..i]; }
        escaped = c == '\\' && !escaped;
    }
    line
}

pub(super) fn decode(value: &str) -> Result<String, String> {
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

pub(super) fn iso_date(value: &str) -> Result<String, String> {
    const MONTHS: [&str; 12] = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
    let date = decode(value)?;
    let parts: Vec<_> = date.split_whitespace().collect();
    if parts.len() != 3 { return Err(UNSUPPORTED.into()); }
    let day: u8 = parts[0].strip_suffix('.').ok_or(UNSUPPORTED)?.parse().map_err(|_| UNSUPPORTED)?;
    let month = MONTHS.iter().position(|m| *m == parts[1]).ok_or(UNSUPPORTED)? + 1;
    let year: u16 = parts[2].parse().map_err(|_| UNSUPPORTED)?;
    let iso = format!("{year:04}-{month:02}-{day:02}");
    crate::semester::czech_date(&iso).map_err(|_| UNSUPPORTED)?;
    Ok(iso)
}

#[derive(Serialize)]
#[serde(tag = "kind", content = "snapshot", rename_all = "kebab-case")]
pub(crate) enum EditableDetails {
    Semester(crate::semester_edit::SemesterSnapshot),
    Presentation(crate::presentation_edit::PresentationSnapshot),
}

#[tauri::command]
pub(crate) fn read_document_details(root: String) -> Result<EditableDetails, String> {
    let build = crate::workspace::project_build(std::path::Path::new(&root))?
        .ok_or("Údaje práce jsou dostupné pro podporované šablony TUL vytvořené v aplikaci.")?;
    match build.template.as_str() {
        "tul-semester" => crate::semester_edit::read_semester_details(root).map(EditableDetails::Semester),
        "tul-presentation" => crate::presentation_edit::read_presentation_details(root).map(EditableDetails::Presentation),
        _ => Err("Dodatečná úprava údajů je zatím dostupná pro semestrální práci a prezentaci TUL. Ostatní dokumenty upravte ve zdroji.".into()),
    }
}
