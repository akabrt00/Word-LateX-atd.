//! Revision-checked saves for open editors. Other reads must not advance their revision.
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path;
use std::sync::Mutex;

// Serializes saves made by this application, including legacy write_file callers.
pub(crate) static WRITE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Serialize)]
pub(crate) struct DocumentSnapshot {
    content: String,
    revision: String,
}

fn revision(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

pub(crate) fn check_revision(path: &Path, expected: &str) -> Result<(), String> {
    match std::fs::read(path) {
        Ok(bytes) if revision(&bytes) == expected => Ok(()),
        Ok(_) => Err("FILE_CONFLICT: Soubor byl změněn mimo tento editor.".into()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound =>
            Err("FILE_CONFLICT: Soubor byl odstraněn nebo přesunut.".into()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub(crate) fn read_document(root: String, rel: String) -> Result<DocumentSnapshot, String> {
    let bytes = std::fs::read(crate::resolve(&root, &rel)?).map_err(|e| e.to_string())?;
    let revision = revision(&bytes);
    let content = String::from_utf8(bytes).map_err(|e| e.to_string())?;
    Ok(DocumentSnapshot { content, revision })
}

#[tauri::command]
pub(crate) fn save_document(root: String, rel: String, content: String, expected_revision: String) -> Result<String, String> {
    let _guard = WRITE_LOCK.lock().map_err(|e| e.to_string())?;
    crate::write_file_checked(&root, &rel, &content, Some(&expected_revision))?;
    Ok(revision(content.as_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn external_change_and_deletion_preserve_both_versions() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_string_lossy().into_owned();
        let path = dir.path().join("main.tex");
        let original = "\u{feff}old\r\n";
        std::fs::write(&path, original).unwrap();
        let snapshot = read_document(root.clone(), "main.tex".into()).unwrap();
        assert_eq!(snapshot.content, original);
        // Same length: metadata/size alone would not detect this change.
        std::fs::write(&path, "\u{feff}new\r\n").unwrap();
        // Background reads must not acknowledge the newer version for this editor.
        let _ = crate::read_file(root.clone(), "main.tex".into()).unwrap();
        let error = save_document(root.clone(), "main.tex".into(), "my edits".into(), snapshot.revision.clone()).unwrap_err();
        assert!(error.starts_with("FILE_CONFLICT:"));
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "\u{feff}new\r\n");
        assert!(!dir.path().join(".scribe/history/main.tex").exists());
        std::fs::remove_file(&path).unwrap();
        assert!(save_document(root, "main.tex".into(), "my edits".into(), snapshot.revision).unwrap_err().starts_with("FILE_CONFLICT:"));
        assert!(!path.exists());
    }

    #[test]
    fn saves_advance_revision_and_stale_editor_cannot_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_string_lossy().into_owned();
        std::fs::write(dir.path().join("main.tex"), "old").unwrap();
        std::fs::write(dir.path().join("main.scribe-tmp"), "unrelated file").unwrap();
        let snapshot = read_document(root.clone(), "main.tex".into()).unwrap();
        let next = save_document(root.clone(), "main.tex".into(), "first".into(), snapshot.revision.clone()).unwrap();
        assert!(save_document(root.clone(), "main.tex".into(), "stale".into(), snapshot.revision).is_err());
        save_document(root.clone(), "main.tex".into(), "second".into(), next).unwrap();
        assert_eq!(std::fs::read_to_string(dir.path().join("main.tex")).unwrap(), "second");
        assert_eq!(std::fs::read_to_string(dir.path().join("main.scribe-tmp")).unwrap(), "unrelated file");
        assert!(!crate::history_ids(dir.path(), "main.tex").is_empty());
        assert!(read_document(root, "../outside.tex".into()).is_err());
    }

    #[test]
    fn concurrent_editors_cannot_both_save_the_same_revision() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_string_lossy().into_owned();
        std::fs::write(dir.path().join("main.tex"), "base").unwrap();
        let snapshot = read_document(root.clone(), "main.tex".into()).unwrap();
        let barrier = std::sync::Arc::new(std::sync::Barrier::new(2));
        let jobs: Vec<_> = ["first editor", "second editor"].into_iter().map(|content| {
            let root = root.clone();
            let expected = snapshot.revision.clone();
            let barrier = barrier.clone();
            std::thread::spawn(move || {
                barrier.wait();
                save_document(root, "main.tex".into(), content.into(), expected)
            })
        }).collect();
        let results: Vec<_> = jobs.into_iter().map(|job| job.join().unwrap()).collect();
        assert_eq!(results.iter().filter(|r| r.is_ok()).count(), 1);
        assert_eq!(results.iter().filter(|r| r.as_ref().is_err_and(|e| e.starts_with("FILE_CONFLICT:"))).count(), 1);
        let saved = std::fs::read_to_string(dir.path().join("main.tex")).unwrap();
        assert!(saved == "first editor" || saved == "second editor");
    }
}
