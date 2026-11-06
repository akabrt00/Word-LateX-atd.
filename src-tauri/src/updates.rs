//! Private GitHub releases. Credentials stay in Rust; installers require a version-bound signature.
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::{atomic::{AtomicBool, Ordering}, Mutex};
use std::time::Duration;
use tauri::{AppHandle, State};
use tauri_plugin_updater::{Update, UpdaterExt};

const API: &str = "https://api.github.com/repos/akabrt00/Word-LateX-atd.";
const WEB: &str = "https://github.com/akabrt00/Word-LateX-atd.";
const MAX_PACKAGE: u64 = 250 * 1024 * 1024;

struct Pending { update: Update, bytes: Option<Vec<u8>> }
#[derive(Default)]
pub struct UpdateState { pending: Mutex<Option<Pending>>, busy: AtomicBool }
struct Busy<'a>(&'a AtomicBool);
impl Drop for Busy<'_> { fn drop(&mut self) { self.0.store(false, Ordering::Release); } }
impl UpdateState {
    fn begin(&self) -> Result<Busy<'_>, String> {
        self.busy.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .map_err(|_| "Právě probíhá jiná operace aktualizace.".to_string())?;
        Ok(Busy(&self.busy))
    }
}

#[derive(Deserialize)]
struct Asset { id: u64, name: String, size: u64 }
#[derive(Deserialize)]
struct Release { tag_name: String, draft: bool, prerelease: bool, assets: Vec<Asset> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo { available: bool, version: Option<String>, notes: Option<String>, release_url: String }

fn github_headers(token: &str, binary: bool) -> Result<HeaderMap, String> {
    let mut headers = HeaderMap::new();
    let mut auth = HeaderValue::from_str(&format!("Bearer {}", token.trim()))
        .map_err(|_| "Neplatné přihlášení GitHub.".to_string())?;
    auth.set_sensitive(true);
    headers.insert(AUTHORIZATION, auth);
    headers.insert(ACCEPT, HeaderValue::from_static(if binary { "application/octet-stream" } else { "application/vnd.github+json" }));
    Ok(headers)
}

fn github_token() -> Result<String, String> {
    let mut cmd = crate::tool_command("gh");
    cmd.args(["auth", "token", "--hostname", "github.com"]).env_remove("GH_DEBUG");
    #[cfg(windows)] {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }
    let out = cmd.output().map_err(|_| "UPDATE_AUTH_REQUIRED: Pro soukromé aktualizace nainstalujte GitHub CLI a přihlaste se příkazem gh auth login --hostname github.com.".to_string())?;
    let token = String::from_utf8_lossy(&out.stdout).trim().to_owned();
    if !out.status.success() || token.is_empty() {
        return Err("UPDATE_AUTH_REQUIRED: Přihlaste GitHub CLI příkazem gh auth login --hostname github.com k účtu s přístupem k TUL Writeru.".into());
    }
    Ok(token)
}

async fn json_response(mut res: reqwest::Response, limit: usize) -> Result<Value, String> {
    let mut bytes = Vec::new();
    while let Some(chunk) = res.chunk().await.map_err(|_| "Stažení informací o aktualizaci selhalo.".to_string())? {
        if bytes.len() + chunk.len() > limit { return Err("Metadata aktualizace jsou příliš velká.".into()); }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| "Neplatná metadata aktualizace.".into())
}

fn asset_url(id: u64) -> String { format!("{API}/releases/assets/{id}") }
fn github_client() -> Result<reqwest::Client, String> {
    // Both reqwest and the updater use rustls-no-provider. Initialize before either client.
    let _ = rustls::crypto::ring::default_provider().install_default();
    reqwest::Client::builder().user_agent("TUL-Writer-updater")
        .timeout(Duration::from_secs(30)).build().map_err(|_| "Nelze otevřít spojení GitHub.".into())
}
fn validate_manifest(release: &Release, manifest: &Value) -> Result<(), String> {
    let version = manifest["version"].as_str().ok_or("Aktualizace nemá verzi.")?;
    if release.draft || release.prerelease || release.tag_name != format!("v{version}")
        || semver::Version::parse(version).is_err() {
        return Err("Verze aktualizace neodpovídá vydání.".into());
    }
    let platforms = manifest["platforms"].as_object().ok_or("Aktualizace nemá platformy.")?;
    if platforms.is_empty() { return Err("Aktualizace nemá instalační balíček.".into()); }
    for package in platforms.values() {
        let url = package["url"].as_str().ok_or("Aktualizace nemá adresu balíčku.")?;
        let asset = release.assets.iter().find(|a| a.id > 0 && asset_url(a.id) == url)
            .ok_or("Adresa aktualizace nesměřuje na soubor tohoto vydání.")?;
        if asset.size == 0 || asset.size > MAX_PACKAGE
            || !(asset.name.ends_with("-setup.exe") || asset.name.ends_with(".msi"))
            || package["signature"].as_str().is_none_or(|s| s.trim().is_empty()) {
            return Err("Aktualizace nemá platný podepsaný instalační balíček.".into());
        }
    }
    Ok(())
}

pub async fn check(app: &AppHandle, state: &UpdateState) -> Result<UpdateInfo, String> {
    let _busy = state.begin()?;
    state.pending.lock().map_err(|_| "Nelze načíst aktualizaci.")?.take();
    if !cfg!(all(target_os = "windows", target_arch = "x86_64")) {
        return Err("Aktualizační kanál je zatím určen pro Windows x64.".into());
    }
    let token = tauri::async_runtime::spawn_blocking(github_token).await.map_err(|_| "Nelze načíst přihlášení GitHub.")??;
    let client = github_client()?;
    let res = client.get(format!("{API}/releases/latest")).headers(github_headers(&token, false)?)
        .send().await.map_err(|_| "GitHub není dostupný. Zkuste kontrolu později; dokumenty zůstávají beze změny.".to_string())?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        let repo = client.get(API).headers(github_headers(&token, false)?).send().await
            .map_err(|_| "GitHub není dostupný.")?;
        if repo.status().is_success() {
            return Ok(UpdateInfo { available: false, version: None, notes: None, release_url: format!("{WEB}/releases") });
        }
        return Err("UPDATE_AUTH_REQUIRED: Přihlášený účet nemá přístup k soukromému repozitáři TUL Writeru.".into());
    }
    if !res.status().is_success() { return Err(format!("GitHub odmítl kontrolu aktualizace (HTTP {}).", res.status().as_u16())); }
    let release: Release = serde_json::from_value(json_response(res, 512 * 1024).await?)
        .map_err(|_| "Neplatné vydání TUL Writeru.")?;
    let manifest_asset = release.assets.iter().find(|a| a.id > 0 && a.name == "latest.json" && a.size <= 128 * 1024)
        .ok_or("Nejnovější vydání neobsahuje aktualizační manifest latest.json.")?;
    let res = client.get(asset_url(manifest_asset.id)).headers(github_headers(&token, true)?)
        .send().await.map_err(|_| "Nelze stáhnout manifest aktualizace.")?;
    if !res.status().is_success() { return Err("GitHub odmítl stažení manifestu aktualizace.".into()); }
    let manifest = json_response(res, 128 * 1024).await?;
    validate_manifest(&release, &manifest)?;
    // Restore validated metadata locally. The plugin requires a signed version and rejects downgrades.
    let endpoint = reqwest::Url::parse(&asset_url(manifest_asset.id)).map_err(|_| "Neplatná adresa manifestu.")?;
    let updater = app.updater_builder().endpoints(vec![endpoint]).map_err(|_| "Neplatná adresa manifestu.")?
        .headers(github_headers(&token, true)?).build()
        .map_err(|_| "Nelze inicializovat ověřování aktualizací.")?;
    let mut update = updater.restore_update(manifest).map_err(|_| "Aktualizace není platná pro tuto aplikaci nebo platformu.")?;
    if let Some(update) = &mut update { update.timeout = Some(Duration::from_secs(120)); }
    let info = UpdateInfo { available: update.is_some(), version: Some(release.tag_name.trim_start_matches('v').into()),
        notes: update.as_ref().and_then(|u| u.body.clone()), release_url: format!("{WEB}/releases/tag/{}", release.tag_name) };
    if let Some(update) = update {
        *state.pending.lock().map_err(|_| "Nelze uchovat aktualizaci.")? = Some(Pending { update, bytes: None });
    }
    Ok(info)
}

pub async fn download(state: &UpdateState, version: &str) -> Result<(), String> {
    let _busy = state.begin()?;
    let update = state.pending.lock().map_err(|_| "Nelze načíst aktualizaci.")?.as_ref()
        .filter(|p| p.update.version == version).map(|p| p.update.clone())
        .ok_or("Změnila se nabízená aktualizace. Zopakujte kontrolu.")?;
    let bytes = update.download(|_, _| {}, || {}).await
        .map_err(|_| "Stažení nebo ověření podpisu aktualizace selhalo. Nic nebylo instalováno.".to_string())?;
    let mut pending = state.pending.lock().map_err(|_| "Nelze uchovat aktualizaci.")?;
    let pending = pending.as_mut().filter(|p| p.update.version == version).ok_or("Změnila se nabízená aktualizace.")?;
    pending.bytes = Some(bytes);
    Ok(())
}

#[tauri::command]
pub async fn check_app_update(app: AppHandle, state: State<'_, UpdateState>) -> Result<UpdateInfo, String> { check(&app, &state).await }
#[tauri::command]
pub async fn download_app_update(version: String, state: State<'_, UpdateState>) -> Result<(), String> { download(&state, &version).await }
#[tauri::command]
pub async fn install_app_update(version: String, state: State<'_, UpdateState>) -> Result<(), String> {
    let _busy = state.begin()?;
    let pending = state.pending.lock().map_err(|_| "Nelze načíst aktualizaci.")?.take()
        .filter(|p| p.update.version == version).ok_or("Zopakujte kontrolu a stažení aktualizace.")?;
    let bytes = pending.bytes.ok_or("Aktualizace ještě nebyla stažena a ověřena.")?;
    pending.update.install(bytes).map_err(|_| "Instalaci aktualizace se nepodařilo spustit.".into())
}

/// Diagnostics exercise the real authenticated download and signature verifier, never installation.
pub fn diagnostics(app: &mut tauri::App) {
    use tauri::Manager;
    let verify = std::env::args().any(|a| a == "--verify-update-download");
    if !verify && !std::env::args().any(|a| a == "--check-updates") { return; }
    if let Some(window) = app.get_webview_window("main") { let _ = window.hide(); }
    let handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        let state = handle.state::<UpdateState>();
        let result: Result<Value, String> = async {
            let info = check(&handle, &state).await?;
            if verify && info.available {
                let version = info.version.as_deref().ok_or("Chybí verze.")?;
                download(&state, version).await?;
                let pending = state.pending.lock().map_err(|_| "Chybí stažená aktualizace.")?;
                let pending = pending.as_ref().ok_or("Chybí stažená aktualizace.")?;
                let bytes = pending.bytes.as_ref().ok_or("Chybí balíček.")?;
                pending.update.verify(bytes).map_err(|_| "Podpis nelze ověřit.")?;
                let mut tampered = bytes.clone();
                if let Some(byte) = tampered.first_mut() { *byte ^= 1; }
                let mut wrong_version = pending.update.clone(); wrong_version.version = "99.99.99".into();
                let tamper_rejected = pending.update.verify(&tampered).is_err();
                let version_rejected = wrong_version.verify(bytes).is_err();
                if !tamper_rejected || !version_rejected { return Err("Kontrola podvržené aktualizace selhala.".into()); }
                return Ok(serde_json::json!({"available":true,"version":version,"signatureVerified":true,
                    "tamperRejected":tamper_rejected,"versionMismatchRejected":version_rejected,"installerStarted":false}));
            }
            Ok(serde_json::json!({"available":info.available,"version":info.version,"installerStarted":false}))
        }.await;
        match result {
            Ok(value) => { println!("{value}"); handle.exit(0); }
            Err(error) => { println!("{}",serde_json::json!({"error":error,"installerStarted":false})); handle.exit(1); }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn release() -> Release { Release { tag_name: "v0.2.1".into(), draft: false, prerelease: false,
        assets: vec![Asset { id: 42, name: "TUL Writer_0.2.1_x64-setup.exe".into(), size: 2048 }] } }
    fn manifest() -> Value { json!({"version":"0.2.1", "platforms":{"windows-x86_64":{
        "url":asset_url(42), "signature":"test-signature"}}}) }
    #[test]
    fn restricts_packages_to_assets_of_the_same_private_release() {
        assert!(validate_manifest(&release(), &manifest()).is_ok());
        for url in ["https://attacker.example/app.exe".to_string(), asset_url(43), format!("{}?token=x",asset_url(42)),
            asset_url(42).replace("https:","http:")] {
            let mut value=manifest(); value["platforms"]["windows-x86_64"]["url"]=json!(url);
            assert!(validate_manifest(&release(), &value).is_err());
        }
    }
    #[test]
    fn rejects_version_mismatch_unsigned_and_oversized_packages() {
        let mut value=manifest();value["version"]=json!("9.9.9"); assert!(validate_manifest(&release(),&value).is_err());
        let mut value=manifest();value["platforms"]["windows-x86_64"]["signature"]=json!(""); assert!(validate_manifest(&release(),&value).is_err());
        let mut r=release();r.assets[0].size=MAX_PACKAGE+1;assert!(validate_manifest(&r,&manifest()).is_err());
        let mut r=release();r.prerelease=true;assert!(validate_manifest(&r,&manifest()).is_err());
    }
    #[test]
    fn authorization_is_marked_sensitive_and_operations_do_not_overlap() {
        assert!(github_client().is_ok());
        assert!(github_headers("test",true).unwrap()[AUTHORIZATION].is_sensitive());
        let state=UpdateState::default();let guard=state.begin().unwrap();assert!(state.begin().is_err());
        drop(guard);assert!(state.begin().is_ok());
    }
}
