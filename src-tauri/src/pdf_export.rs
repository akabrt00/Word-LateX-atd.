//! Export the exact displayed PDF bytes to the destination chosen by the user.
use std::io::Write;
use std::path::Path;

fn write_pdf(bytes: &[u8], destination: &Path) -> Result<(), String> {
    if !bytes.starts_with(b"%PDF-") { return Err("Zobrazený dokument nemá platnou hlavičku PDF. Vytvořte PDF znovu.".into()); }
    if !destination.is_absolute() || !destination.extension().and_then(|extension| extension.to_str()).is_some_and(|extension| extension.eq_ignore_ascii_case("pdf")) {
        return Err("Vyberte úplnou cestu k souboru s příponou .pdf.".into());
    }
    let parent = destination.parent().ok_or("Vyberte složku pro uložení PDF.")?;
    let mut temporary = tempfile::NamedTempFile::new_in(parent).map_err(|e| format!("Do zvolené složky nelze uložit PDF: {e}"))?;
    temporary.write_all(bytes).map_err(|e| format!("PDF se nepodařilo zapsat: {e}"))?;
    temporary.as_file().sync_all().map_err(|e| format!("PDF se nepodařilo dokončit: {e}"))?;
    temporary.persist(destination).map_err(|e| format!("PDF se nepodařilo uložit. Původní soubor zůstal zachovaný: {e}"))?;
    Ok(())
}

#[tauri::command]
pub(crate) fn export_pdf(request: tauri::ipc::Request<'_>) -> Result<(), String> {
    let destination = request.headers().get("x-dest").ok_or("Chybí vybrané umístění PDF.")?;
    let destination = crate::percent_decode(destination.to_str().map_err(|_| "Neplatné umístění PDF.")?)?;
    let tauri::ipc::InvokeBody::Raw(bytes) = request.body() else { return Err("Chybí data zobrazeného PDF.".into()); };
    write_pdf(bytes, Path::new(&destination))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exports_exact_snapshot_and_replaces_only_the_selected_pdf() {
        let dir = tempfile::tempdir().unwrap();
        let destination = dir.path().join("Moje práce.PDF");
        let bytes = b"%PDF-1.7\nexact displayed snapshot\n%%EOF";
        write_pdf(bytes, &destination).unwrap();
        assert_eq!(std::fs::read(&destination).unwrap(), bytes);
        let next = b"%PDF-1.7\nnext selected snapshot\n%%EOF";
        write_pdf(next, &destination).unwrap();
        assert_eq!(std::fs::read(&destination).unwrap(), next);
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
    }

    #[test]
    fn rejects_invalid_data_paths_and_missing_folders_without_touching_files() {
        let dir = tempfile::tempdir().unwrap();
        for name in ["existing.pdf", "main.tex"] {
            let path = dir.path().join(name);
            std::fs::write(&path, "original user work").unwrap();
            assert!(write_pdf(b"not a PDF", &path).is_err());
            if name.ends_with("tex") { assert!(write_pdf(b"%PDF-1.7\n", &path).is_err()); }
            assert_eq!(std::fs::read_to_string(path).unwrap(), "original user work");
        }
        assert!(write_pdf(b"%PDF-1.7\n", Path::new("relative.pdf")).is_err());
        assert!(write_pdf(b"%PDF-1.7\n", &dir.path().join("missing/export.pdf")).is_err());
        assert!(!dir.path().join("missing").exists());
    }

    #[test]
    #[ignore = "Requires installed pdfLaTeX"]
    fn compiled_document_exports_byte_for_byte() {
        let dir = tempfile::tempdir().unwrap();
        let project = crate::workspace::create_starter(dir.path(), "Workflow", "blank").unwrap();
        let result = crate::compile_blocking(&project.to_string_lossy(), "main.tex").unwrap();
        assert!(result.ok, "{}", result.log);
        let displayed = std::fs::read(project.join(result.pdf.unwrap())).unwrap();
        let destination = dir.path().join("Vybrané PDF.pdf");
        write_pdf(&displayed, &destination).unwrap();
        assert_eq!(std::fs::read(destination).unwrap(), displayed);
        assert!(project.join("main.tex").is_file());
    }
}
