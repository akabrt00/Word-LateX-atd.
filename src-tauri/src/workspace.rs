//! Machine-wide document location and offline starter projects.
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Write};
use std::path::{Component, Path, PathBuf};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorkspaceSettings {
    pub documents_dir: String,
    pub default_template: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ProjectBuild {
    pub main: String,
    pub engine: String,
    pub bibliography: Option<String>,
    pub template: String,
}

struct Starter {
    id: &'static str,
    main: &'static str,
    engine: &'static str,
    bibliography: Option<&'static str>,
    archive: Option<&'static [u8]>,
}

const STARTERS: &[Starter] = &[
    Starter { id: "tul-semester", main: "semestralni-prace.tex", engine: "pdflatex", bibliography: Some("bibtex"), archive: Some(include_bytes!("../../resources/templates/semester-tul.zip")) },
    Starter { id: "tul-thesis", main: "main.tex", engine: "xelatex", bibliography: Some("biber"), archive: Some(include_bytes!("../../resources/templates/thesis-tul.zip")) },
    Starter { id: "tul-presentation", main: "main.tex", engine: "xelatex", bibliography: None, archive: Some(include_bytes!("../../resources/templates/presentation-tul.zip")) },
    Starter { id: "tul-poster", main: "main.tex", engine: "lualatex", bibliography: None, archive: Some(include_bytes!("../../resources/templates/poster-tul.zip")) },
    Starter { id: "blank", main: "main.tex", engine: "pdflatex", bibliography: None, archive: None },
];

pub(crate) fn validate_name(name: &str) -> Result<(), String> {
    let reserved = name.split('.').next().unwrap_or("").to_ascii_uppercase();
    if name.is_empty() || name.chars().count() > 100 || name.trim() != name || name.ends_with('.')
        || name.chars().any(|c| c.is_control() || "<>:\"/\\|?*".contains(c))
        || ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"].contains(&reserved.as_str())
    { return Err("Použijte název do 100 znaků bez lomítek, koncové tečky a znaků <>:\"|?*.".into()); }
    Ok(())
}

fn validate_settings(settings: &WorkspaceSettings) -> Result<(), String> {
    if !Path::new(&settings.documents_dir).is_absolute() { return Err("Vyberte úplnou cestu ke složce dokumentů.".into()); }
    if !STARTERS.iter().any(|t| t.id == settings.default_template) { return Err("Neznámá výchozí šablona.".into()); }
    Ok(())
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().app_config_dir().map_err(|e| e.to_string())?.join("workspace.json"))
}

#[tauri::command]
pub(crate) fn read_workspace_settings(app: tauri::AppHandle) -> Result<WorkspaceSettings, String> {
    let path = settings_path(&app)?;
    match std::fs::read(&path) {
        Ok(bytes) => {
            let settings = serde_json::from_slice(&bytes).map_err(|e| format!("Nastavení pracovního prostoru: {e}"))?;
            validate_settings(&settings)?;
            Ok(settings)
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(WorkspaceSettings {
            documents_dir: app.path().document_dir().map_err(|e| e.to_string())?.join("TUL Writer").to_string_lossy().into_owned(),
            default_template: "tul-semester".into(),
        }),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub(crate) fn write_workspace_settings(app: tauri::AppHandle, settings: WorkspaceSettings) -> Result<(), String> {
    validate_settings(&settings)?;
    let path = settings_path(&app)?;
    let parent = path.parent().ok_or("Chybí adresář nastavení")?;
    std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let mut file = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    file.write_all(&serde_json::to_vec_pretty(&settings).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    file.as_file().sync_all().map_err(|e| e.to_string())?;
    file.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

pub(crate) fn project_build(root: &Path) -> Result<Option<ProjectBuild>, String> {
    let path = root.join(".tulwriter/project.json");
    match std::fs::read(path) {
        Ok(bytes) => {
            let build: ProjectBuild = serde_json::from_slice(&bytes).map_err(|e| format!("Nastavení překladu: {e}"))?;
            if !["pdflatex", "xelatex", "lualatex"].contains(&build.engine.as_str())
                || build.bibliography.as_deref().is_some_and(|b| b != "bibtex" && b != "biber")
            { return Err("Nepodporovaný překladač nebo bibliografický nástroj.".into()); }
            crate::resolve(&root.to_string_lossy(), &build.main)?;
            Ok(Some(build))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

fn archive_path(name: &str) -> Result<PathBuf, String> {
    let path = Path::new(name);
    if name.contains('\\') || name.contains(':') || path.is_absolute()
        || path.components().any(|c| !matches!(c, Component::Normal(_)))
    { return Err(format!("Neplatná cesta v šabloně: {name}")); }
    Ok(path.to_owned())
}

fn unpack(bytes: &[u8], target: &Path) -> Result<(), String> {
    let mut zip = zip::ZipArchive::new(Cursor::new(bytes)).map_err(|e| e.to_string())?;
    if zip.len() > 5000 { return Err("Šablona obsahuje příliš mnoho souborů.".into()); }
    let mut total = 0u64;
    for i in 0..zip.len() {
        let mut entry = zip.by_index(i).map_err(|e| e.to_string())?;
        let rel = archive_path(entry.name().map_err(|e| e.to_string())?.trim_end_matches('/'))?;
        if entry.unix_mode().is_some_and(|mode| mode & 0o170000 == 0o120000) { return Err("Odkazy v šablonách nejsou podporované.".into()); }
        total = total.checked_add(entry.size()).ok_or("Příliš velká šablona")?;
        if total > 256 * 1024 * 1024 { return Err("Příliš velká šablona.".into()); }
        let path = target.join(rel);
        if entry.is_dir() { std::fs::create_dir_all(&path).map_err(|e| e.to_string())?; continue; }
        std::fs::create_dir_all(path.parent().ok_or("Chybí adresář")?).map_err(|e| e.to_string())?;
        let mut file = std::fs::OpenOptions::new().write(true).create_new(true).open(&path).map_err(|e| e.to_string())?;
        std::io::copy(&mut entry, &mut file).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub(crate) fn create_starter(parent: &Path, name: &str, template_id: &str) -> Result<PathBuf, String> {
    validate_name(name)?;
    if !parent.is_absolute() { return Err("Složka dokumentů musí mít úplnou cestu.".into()); }
    let starter = STARTERS.iter().find(|t| t.id == template_id).ok_or("Neznámá šablona")?;
    std::fs::create_dir_all(parent).map_err(|e| format!("Nelze vytvořit složku dokumentů: {e}"))?;
    let parent = parent.canonicalize().map_err(|e| e.to_string())?;
    let target = parent.join(name);
    // Exclusive creation: an existing project is never opened or merged accidentally.
    std::fs::create_dir(&target).map_err(|e| format!("Nelze založit {name}. Složka už existuje nebo není zapisovatelná: {e}"))?;
    let result = (|| {
        if let Some(bytes) = starter.archive { unpack(bytes, &target)?; }
        else { std::fs::write(target.join("main.tex"), "\\documentclass{article}\n\\begin{document}\nMuj novy dokument.\n\\end{document}\n").map_err(|e| e.to_string())?; }
        let build = ProjectBuild { main: starter.main.into(), engine: starter.engine.into(), bibliography: starter.bibliography.map(String::from), template: starter.id.into() };
        std::fs::create_dir(target.join(".tulwriter")).map_err(|e| e.to_string())?;
        std::fs::write(target.join(".tulwriter/project.json"), serde_json::to_vec_pretty(&build).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
        Ok::<_, String>(())
    })();
    result.map_err(|e| format!("Vytvoření nebylo dokončeno. Částečný projekt zůstal v {}: {e}", target.display()))?;
    Ok(target)
}

#[tauri::command]
pub(crate) async fn create_template_project(app: tauri::AppHandle, name: String, template_id: String) -> Result<String, String> {
    let settings = read_workspace_settings(app)?;
    tauri::async_runtime::spawn_blocking(move || create_starter(Path::new(&settings.documents_dir), &name, &template_id).map(|p| {
        let text = p.to_string_lossy();
        // Keep Windows' canonical long-path prefix out of recent-project labels.
        if cfg!(windows) {
            if let Some(unc) = text.strip_prefix("\\\\?\\UNC\\") { return format!("\\\\{unc}"); }
            if let Some(path) = text.strip_prefix("\\\\?\\") { return path.to_owned(); }
        }
        text.into_owned()
    }))
        .await.map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_projects_never_merge_or_escape_the_workspace() {
        let dir = tempfile::tempdir().unwrap();
        let parent = dir.path().join("Documents");
        for name in ["", "..", "../outside", "x/y", "x\\y", "CON", "aux.txt", "name.", "name ", "x:y"] {
            assert!(create_starter(&parent, name, "blank").is_err(), "{name}");
        }
        assert!(!parent.exists());
        let project = create_starter(&parent, "Moje práce", "blank").unwrap();
        std::fs::write(project.join("main.tex"), "user work").unwrap();
        assert!(create_starter(&parent, "Moje práce", "tul-semester").is_err());
        assert_eq!(std::fs::read_to_string(project.join("main.tex")).unwrap(), "user work");
        assert_eq!(project_build(&project).unwrap().unwrap().engine, "pdflatex");
        assert!(archive_path("../outside").is_err());
        assert!(archive_path("C:/outside").is_err());
    }

    #[test]
    fn all_bundled_tul_templates_are_complete_independent_copies() {
        let dir = tempfile::tempdir().unwrap();
        for starter in STARTERS.iter().filter(|t| t.archive.is_some()) {
            let project = create_starter(dir.path(), starter.id, starter.id).unwrap();
            assert!(project.join(starter.main).is_file());
            let build = project_build(&project).unwrap().unwrap();
            assert_eq!(build.engine, starter.engine);
            assert_eq!(build.bibliography.as_deref(), starter.bibliography);
            // Archive sources remain unchanged; every project is its own writable copy.
            let before = std::fs::read(project.join(starter.main)).unwrap();
            std::fs::write(project.join(starter.main), "edited by user").unwrap();
            let second = create_starter(dir.path(), &format!("{}-copy", starter.id), starter.id).unwrap();
            assert_eq!(std::fs::read(second.join(starter.main)).unwrap(), before);
        }
    }

    #[test]
    fn project_configuration_cannot_select_an_arbitrary_program() {
        let dir = tempfile::tempdir().unwrap();
        let project = create_starter(dir.path(), "settings", "blank").unwrap();
        let path = project.join(".tulwriter/project.json");
        for json in [
            r#"{"main":"main.tex","engine":"powershell","bibliography":null,"template":"blank"}"#,
            r#"{"main":"main.tex","engine":"pdflatex","bibliography":"cmd","template":"blank"}"#,
            r#"{"main":"../outside.tex","engine":"pdflatex","bibliography":null,"template":"blank"}"#,
        ] {
            std::fs::write(&path, json).unwrap();
            assert!(project_build(&project).is_err());
        }
    }

    fn verify_pdf(template: &str) {
        let dir = tempfile::tempdir().unwrap();
        let project = create_starter(dir.path(), template, template).unwrap();
        let build = project_build(&project).unwrap().unwrap();
        let result = crate::compile_blocking(&project.to_string_lossy(), &build.main).unwrap();
        assert!(result.ok, "{}: {}", template, result.log);
        let pdf = std::fs::read(project.join(result.pdf.unwrap())).unwrap();
        assert!(pdf.starts_with(b"%PDF-"));
        assert_eq!(result.engine, build.engine);
    }

    #[test]
    #[ignore = "Requires installed TeX engines and template packages"]
    fn template_pdf_semester() { verify_pdf("tul-semester"); }
    #[test]
    #[ignore = "Requires installed TeX engines and template packages"]
    fn template_pdf_thesis() { verify_pdf("tul-thesis"); }
    #[test]
    #[ignore = "Requires installed TeX engines and template packages"]
    fn template_pdf_presentation() { verify_pdf("tul-presentation"); }
    #[test]
    #[ignore = "Requires installed TeX engines and template packages"]
    fn template_pdf_poster() { verify_pdf("tul-poster"); }
}
