import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";

interface WorkspaceSettings { documentsDir: string; defaultTemplate: string; }
const starters = [
  { id: "tul-semester", name: "TUL · Semestrální práce", detail: "Verze 1.3 · univerzitní varianta · pdfLaTeX + BibTeX. Vlastní údaje vyplníte v semestralni-prace.tex." },
  { id: "tul-thesis", name: "TUL · Závěrečná práce", detail: "Komunitní uspořádání 0.8 · univerzitní varianta BP · XeLaTeX + Biber. Začněte START.md a vyplňte nastaveni/udaje.tex." },
  { id: "tul-presentation", name: "TUL · Prezentace", detail: "TULpresentation · univerzitní varianta 16:9 · XeLaTeX. Vlastní obsah v main.tex, písma jsou součástí projektu." },
  { id: "tul-poster", name: "TUL · Akademický poster", detail: "TULposter · návrh ve vývoji · A1 na výšku · LuaLaTeX. Údaje v nastaveni.tex, vlastní obsah v obsah.tex." },
  { id: "blank", name: "Prázdný LaTeX dokument", detail: "Jednoduchý main.tex bez univerzitní šablony · pdfLaTeX." },
];

export async function refreshWorkspaceLabel() {
  const label = document.getElementById("welcome-workspace-path");
  if (!label) return;
  try {
    const settings = await invoke<WorkspaceSettings>("read_workspace_settings");
    label.textContent = settings.documentsDir;
    label.title = settings.documentsDir;
  } catch (error) { label.textContent = `Složku nelze načíst: ${String(error)}`; }
}

let activeDialog: HTMLDialogElement | null = null;

export async function showWorkspace(create: boolean, legacy?: () => Promise<void>) {
  if (activeDialog) { activeDialog.focus(); return; }
  const dialog = document.createElement("dialog");
  activeDialog = dialog;
  dialog.className = "workspace-dialog";
  dialog.setAttribute("aria-labelledby", "workspace-title");
  dialog.innerHTML = `
    <form>
      <div class="workspace-heading"><div><p class="tul-eyebrow">Pracovní prostor</p><h2 id="workspace-title"></h2></div><button type="button" class="icon-btn workspace-close" aria-label="Zavřít">×</button></div>
      <p class="workspace-intro"></p>
      <label class="workspace-name-label">Název dokumentu<input id="workspace-name" name="name" type="text" placeholder="Například Semestrální práce – modelování" maxlength="100" required autocomplete="off" /></label>
      <div class="workspace-folder"><span>Složka pro nové dokumenty</span><div><output id="workspace-directory"></output><button type="button" class="btn" id="workspace-choose">Změnit…</button></div><small>Každý dokument vznikne ve vlastní podsložce. Toto nastavení platí pro celý počítač.</small></div>
      <label>Výchozí šablona<select id="workspace-template"></select></label>
      <p id="workspace-template-detail" class="workspace-detail"></p>
      <p id="workspace-destination" class="workspace-destination"></p>
      <p class="workspace-error" role="alert" hidden></p>
      <div class="workspace-links"><button type="button" class="workspace-link" id="workspace-source">Prohlédnout TUL šablony ↗</button><button type="button" class="workspace-link" id="workspace-legacy">Další šablony…</button></div>
      <div class="workspace-actions"><button type="button" class="btn workspace-cancel">Zrušit</button><button type="submit" class="btn btn-primary" id="workspace-submit"></button></div>
    </form>`;
  const field = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const form = field<HTMLFormElement>("form");
  const name = field<HTMLInputElement>("#workspace-name");
  const select = field<HTMLSelectElement>("#workspace-template");
  const error = field<HTMLParagraphElement>(".workspace-error");
  const submit = field<HTMLButtonElement>("#workspace-submit");
  let settings: WorkspaceSettings;
  let busy = false;
  field("#workspace-title").textContent = create ? "Nový dokument" : "Nastavení pracovního prostoru";
  field(".workspace-intro").textContent = create ? "Vyberte název a šablonu. Nový projekt bude připravený pro psaní i lokální překlad." : "Vyberte, kde se budou zakládat nové dokumenty a kterou šablonu nabídneme jako první.";
  field(".workspace-name-label").hidden = !create;
  name.required = create;
  submit.textContent = create ? "Vytvořit dokument" : "Uložit nastavení";
  for (const starter of starters) select.add(new Option(starter.name, starter.id));
  field("#workspace-legacy").hidden = !legacy || !create;
  const update = () => {
    field("#workspace-directory").textContent = settings.documentsDir;
    field("#workspace-template-detail").textContent = starters.find(s => s.id === select.value)?.detail ?? "";
    field("#workspace-destination").textContent = create ? `Vznikne: ${settings.documentsDir.replace(/[\\/]+$/, "")} / ${name.value || "název dokumentu"}` : "";
  };
  const close = () => { if (!busy) dialog.close(); };
  field(".workspace-close").onclick = close;
  field(".workspace-cancel").onclick = close;
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  dialog.addEventListener("close", () => { activeDialog = null; dialog.remove(); });
  field("#workspace-source").onclick = () => { void openUrl("https://latex-tul.adamkabrt.chatgpt.site/templates"); };
  field("#workspace-legacy").onclick = () => { close(); void legacy?.(); };
  select.onchange = update;
  name.oninput = update;
  field("#workspace-choose").onclick = async () => {
    try {
      const picked = await open({ directory: true, multiple: false, title: "Složka pro nové dokumenty", defaultPath: settings.documentsDir });
      if (typeof picked === "string") { settings.documentsDir = picked; update(); }
    } catch (e) { error.textContent = String(e); error.hidden = false; }
  };
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;
    error.hidden = true;
    // Freeze settings while creating the project; the name is passed as one folder name.
    for (const control of form.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("input,button,select")) control.disabled = true;
    submit.textContent = create ? "Vytvářím…" : "Ukládám…";
    try {
      settings.defaultTemplate = select.value;
      await invoke("write_workspace_settings", { settings });
      await refreshWorkspaceLabel();
      const path = create ? await invoke<string>("create_template_project", { name: name.value, templateId: select.value }) : null;
      busy = false;
      dialog.close();
      if (path) {
        try {
          const { openProject } = await import("./project");
          await openProject(path);
        } catch (openError) {
          const { setStatus } = await import("./core");
          setStatus(`Dokument byl vytvořen v ${path}. Otevření se nepodařilo: ${String(openError)}`, "err");
        }
      }
    } catch (e) {
      busy = false;
      error.textContent = String(e);
      error.hidden = false;
      for (const control of form.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("input,button,select")) control.disabled = false;
      submit.textContent = create ? "Vytvořit dokument" : "Uložit nastavení";
    }
  };
  try {
    settings = await invoke<WorkspaceSettings>("read_workspace_settings");
    select.value = settings.defaultTemplate;
    update();
    document.body.append(dialog);
    dialog.showModal();
    (create ? name : field<HTMLButtonElement>("#workspace-choose")).focus();
  } catch (e) {
    activeDialog = null;
    dialog.remove();
    const label = document.getElementById("welcome-error");
    if (label) { label.textContent = String(e); label.hidden = false; }
  }
}
