import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { authorsFromLines } from "./semester-authors";
import { faculties, semesterFields } from "./semester-form";
import { readTemplateDetails, templateFields, templateHeadings } from "./template-form";

interface WorkspaceSettings { documentsDir: string; defaultTemplate: string; }
const starters = [
  { id: "tul-semester", name: "TUL · Semestrální práce", detail: "Verze 1.3 · pdfLaTeX + BibTeX. V dalším kroku vyberete fakultu a vyplníte údaje titulní strany." },
  { id: "tul-thesis", name: "TUL · Závěrečná práce", detail: "Komunitní uspořádání 0.8 · bakalářská nebo diplomová práce. V dalším kroku vyplníte titulní údaje a studijní program." },
  { id: "tul-presentation", name: "TUL · Prezentace", detail: "TULpresentation · univerzitní varianta 16:9. V dalším kroku vyplníte název, autory, pracoviště a datum." },
  { id: "tul-poster", name: "TUL · Akademický poster", detail: "TULposter · návrh ve vývoji · A1 na výšku. V dalším kroku vyplníte název, autory, pracoviště a případně kontakt." },
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
      <div class="workspace-project-step">
      <label class="workspace-name-label">Název složky dokumentu<input id="workspace-name" name="name" type="text" placeholder="Například Semestrální práce – modelování" maxlength="100" required autocomplete="off" /></label>
      <div class="workspace-folder"><span>Složka pro nové dokumenty</span><div><output id="workspace-directory"></output><button type="button" class="btn" id="workspace-choose">Změnit…</button></div><small>Každý dokument vznikne ve vlastní podsložce. Toto nastavení platí pro celý počítač.</small></div>
      <label>Výchozí šablona<select id="workspace-template"></select></label>
      <p id="workspace-template-detail" class="workspace-detail"></p>
      <p id="workspace-destination" class="workspace-destination"></p>
      <div class="workspace-links"><button type="button" class="workspace-link" id="workspace-source">Prohlédnout TUL šablony ↗</button><button type="button" class="workspace-link" id="workspace-legacy">Další šablony…</button></div>
      </div>
      <fieldset id="semester-details" class="semester-fields" hidden disabled>
${semesterFields}
      </fieldset>
      <div id="template-details" hidden></div>
      <p class="workspace-error" role="alert" hidden></p>
      <div class="workspace-actions"><button type="button" class="btn workspace-back" hidden>Zpět</button><button type="button" class="btn workspace-cancel">Zrušit</button><button type="submit" class="btn btn-primary" id="workspace-submit"></button></div>
    </form>`;
  const field = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const form = field<HTMLFormElement>("form");
  const name = field<HTMLInputElement>("#workspace-name");
  const select = field<HTMLSelectElement>("#workspace-template");
  const error = field<HTMLParagraphElement>(".workspace-error");
  const submit = field<HTMLButtonElement>("#workspace-submit");
  const metadata = field<HTMLFieldSetElement>("#semester-details");
  const title = field<HTMLInputElement>("#semester-title");
  const faculty = field<HTMLSelectElement>("#semester-faculty");
  for (const [id, label] of faculties) faculty.add(new Option(label, id));
  const today = new Date();
  field<HTMLInputElement>("#semester-year").value = String(today.getFullYear());
  field<HTMLInputElement>("#semester-date").value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  let settings: WorkspaceSettings;
  let busy = false;
  let detailsStep = false;
  let titleEdited = false;
  title.oninput = () => { titleEdited = true; };
  const otherForms = new Map<string, HTMLFieldSetElement>();
  const otherTitlesEdited = new Set<string>();
  let otherForm: HTMLFieldSetElement | null = null;
  const todayIso = field<HTMLInputElement>("#semester-date").value;
  const loadOtherForm = () => {
    const kind = select.value;
    otherForm = null;
    const holder = field("#template-details");
    holder.replaceChildren();
    if (!templateFields[kind]) return;
    if (!otherForms.has(kind)) {
      const formFields = document.createElement("fieldset");
      formFields.className = "semester-fields";
      formFields.setAttribute("aria-label", templateHeadings[kind]);
      formFields.innerHTML = templateFields[kind];
      const formTitle = formFields.querySelector<HTMLInputElement>("#template-title")!;
      formTitle.oninput = () => { otherTitlesEdited.add(kind); };
      const year = formFields.querySelector<HTMLInputElement>("#thesis-year");
      if (year) year.value = String(today.getFullYear());
      const date = formFields.querySelector<HTMLInputElement>("#presentation-date");
      if (date) date.value = todayIso;
      otherForms.set(kind, formFields);
    }
    otherForm = otherForms.get(kind)!;
    otherForm.disabled = true;
    holder.append(otherForm);
  };
  field("#workspace-title").textContent = create ? "Nový dokument" : "Nastavení pracovního prostoru";
  field(".workspace-intro").textContent = create ? "Vyberte název a šablonu. Nový projekt bude připravený pro psaní i lokální překlad." : "Vyberte, kde se budou zakládat nové dokumenty a kterou šablonu nabídneme jako první.";
  field(".workspace-name-label").hidden = !create;
  name.required = create;
  submit.textContent = create ? "Vytvořit dokument" : "Uložit nastavení";
  for (const starter of starters) select.add(new Option(starter.name, starter.id));
  field("#workspace-legacy").hidden = !legacy || !create;
  const update = () => {
    loadOtherForm();
    const semester = select.value === "tul-semester";
    const hasWizard = semester || !!templateFields[select.value];
    field("#workspace-directory").textContent = settings.documentsDir;
    field("#workspace-template-detail").textContent = starters.find(s => s.id === select.value)?.detail ?? "";
    field("#workspace-destination").textContent = create ? `Vznikne: ${settings.documentsDir.replace(/[\\/]+$/, "")} / ${name.value || "název dokumentu"}` : "";
    field(".workspace-project-step").hidden = detailsStep;
    metadata.hidden = !detailsStep || !semester;
    metadata.disabled = !detailsStep || !semester;
    field("#template-details").hidden = !detailsStep || semester;
    if (otherForm) otherForm.disabled = !detailsStep;
    field(".workspace-back").hidden = !detailsStep;
    field("#workspace-title").textContent = detailsStep ? semester ? "Údaje semestrální práce" : templateHeadings[select.value] : create ? "Nový dokument" : "Nastavení pracovního prostoru";
    field(".workspace-heading .tul-eyebrow").textContent = detailsStep ? "Nový dokument · krok 2 ze 2" : create && hasWizard ? "Nový dokument · krok 1 ze 2" : "Pracovní prostor";
    field(".workspace-intro").textContent = detailsStep ? "Údaje předvyplníme na titulní straně. Později je můžete upravit v dokumentu." : create ? "Vyberte název složky a šablonu nového dokumentu." : "Vyberte, kde se budou zakládat nové dokumenty a kterou šablonu nabídneme jako první.";
    submit.textContent = create ? hasWizard && !detailsStep ? "Pokračovat" : "Vytvořit dokument" : "Uložit nastavení";
  };
  const close = () => { if (!busy) dialog.close(); };
  field(".workspace-close").onclick = close;
  field(".workspace-cancel").onclick = close;
  field(".workspace-back").onclick = () => { detailsStep = false; error.hidden = true; update(); name.focus(); };
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  dialog.addEventListener("keydown", event => { event.stopPropagation(); });
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
    if (create && (select.value === "tul-semester" || templateFields[select.value]) && !detailsStep) {
      if (select.value === "tul-semester") { if (!titleEdited) title.value = name.value.trim(); }
      else if (otherForm && !otherTitlesEdited.has(select.value)) otherForm.querySelector<HTMLInputElement>("#template-title")!.value = name.value.trim();
      detailsStep = true;
      error.hidden = true;
      update();
      (select.value === "tul-semester" ? faculty : otherForm?.querySelector<HTMLSelectElement>("#template-faculty"))?.focus();
      return;
    }
    const semesterDetails = detailsStep && select.value === "tul-semester" ? {
      faculty: faculty.value, title: title.value, authors: authorsFromLines(field<HTMLTextAreaElement>("#semester-authors").value),
      subject: field<HTMLInputElement>("#semester-subject").value, year: field<HTMLInputElement>("#semester-year").valueAsNumber,
      date: field<HTMLInputElement>("#semester-date").value, assignmentVersion: field<HTMLInputElement>("#semester-version").value,
    } : null;
    const templateDetails = detailsStep && otherForm ? readTemplateDetails(otherForm, select.value) : null;
    busy = true;
    error.hidden = true;
    // Freeze settings while creating the project; the name is passed as one folder name.
    for (const control of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | HTMLSelectElement>("input,textarea,button,select")) control.disabled = true;
    submit.textContent = create ? "Vytvářím…" : "Ukládám…";
    try {
      settings.defaultTemplate = select.value;
      await invoke("write_workspace_settings", { settings });
      await refreshWorkspaceLabel();
      const path = create ? await invoke<string>("create_template_project", { name: name.value, templateId: select.value, semesterDetails, templateDetails }) : null;
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
      for (const control of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | HTMLSelectElement>("input,textarea,button,select")) control.disabled = false;
      update();
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
