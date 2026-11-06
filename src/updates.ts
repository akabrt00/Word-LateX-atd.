import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { setStatus } from "./core";
import { UpdateFlow, type UpdateInfo } from "./update-flow";

async function preflight() {
  const [build, terminal] = await Promise.all([import("./build"), import("./terminal")]);
  if (build.compiling || build.running || terminal.shellAlive || document.querySelector(".nb-out-running")) {
    throw new Error("Před instalací dokončete kompilaci a běžící úlohy a zavřete projektový terminál.");
  }
}
const flow = new UpdateFlow({
  check: () => invoke<UpdateInfo>("check_app_update"), preflight,
  download: version => invoke("download_app_update", { version }),
  save: async () => {
    // Lazy imports preserve the original startup order of the editor's cyclic modules.
    const [project, split, session] = await Promise.all([import("./project"), import("./split"), import("./session")]);
    await project.save(); await split.saveSide(); session.saveSession();
  },
  install: version => invoke("install_app_update", { version }),
});
let card: HTMLElement | null = null;

function offer(info: UpdateInfo) {
  card?.remove();
  const box = document.createElement("section");
  box.className = "update-card"; box.setAttribute("aria-label", "Aktualizace TUL Writeru");
  const text = document.createElement("p");
  text.textContent = `Je dostupný TUL Writer ${info.version}. Instalace ověří podpis, uloží dokumenty a restartuje aplikaci.`;
  const notes = document.createElement("p"); notes.className = "update-notes";
  notes.textContent = info.notes?.slice(0, 600) ?? "Nová verze aplikace.";
  const actions = document.createElement("div"); actions.className = "update-actions";
  const later = document.createElement("button"); later.className = "btn"; later.textContent = "Později";
  later.onclick = () => { box.remove(); card = null; };
  const install = document.createElement("button"); install.className = "btn btn-primary";
  install.textContent = "Aktualizovat a restartovat";
  install.onclick = async () => {
    if (!info.version || install.disabled) return;
    install.disabled = true;
    const progress = document.createElement("dialog"); progress.className = "update-progress";
    progress.setAttribute("aria-label", "Instalace aktualizace");
    const message = document.createElement("p"); message.setAttribute("role", "status");
    message.textContent = "Stahuji a ověřuji aktualizaci. Před instalací se uloží vaše dokumenty…";
    progress.append(message); progress.addEventListener("cancel", event => event.preventDefault());
    document.body.append(progress); progress.showModal();
    try { await flow.install(info.version); }
    catch (error) { setStatus(`Aktualizace nebyla nainstalována: ${String(error)}`, "err"); notes.textContent = String(error); }
    finally { progress.close(); progress.remove(); install.disabled = false; }
  };
  actions.append(later, install); box.append(text, notes, actions); document.body.append(box); card = box;
}

export async function checkForUpdates(quiet = false) {
  try {
    if (!quiet) setStatus("Kontroluji aktualizace TUL Writeru…", "busy");
    const info = await flow.check();
    if (info.available) { offer(info); if (!quiet) setStatus(`Je dostupný TUL Writer ${info.version}.`, "ok"); }
    else if (!quiet) setStatus(info.version ? `TUL Writer ${await getVersion()} je aktuální.` : "Zatím není dostupné žádné vydání TUL Writeru.", "ok");
  } catch (error) { if (!quiet) setStatus(`Kontrola aktualizace selhala: ${String(error)}`, "err"); }
}
export function checkForUpdatesLater() {
  if (!import.meta.env.DEV) window.setTimeout(() => { void checkForUpdates(true); }, 15000);
}
