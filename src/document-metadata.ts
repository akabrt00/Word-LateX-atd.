import { invoke } from "@tauri-apps/api/core";
import { root, dirty, setStatus } from "./core";
import { openFile, save } from "./project";
import { documentProgress } from "./document-progress";
import { closeSide } from "./split";
import { authorsFromLines } from "./semester-authors";
import { faculties, semesterFields } from "./semester-form";
import { readTemplateDetails, templateFields } from "./template-form";

interface SemesterDetails {
  faculty: string; title: string; authors: string[]; subject: string;
  year: number; date: string; assignmentVersion: string;
}
interface SemesterSnapshot {
  main: string; details: SemesterDetails; sourceRevision: string; styleRevision: string;
}
interface PresentationDetails {
  faculty: string; title: string; authors: string[]; institute: string;
  date: string; email: string; phone: string;
}
interface PresentationSnapshot {
  main: string; details: PresentationDetails; sourceRevision: string;
}
type EditableDetails = { kind: "semester"; snapshot: SemesterSnapshot }
  | { kind: "presentation"; snapshot: PresentationSnapshot };
let activeDialog: HTMLDialogElement | null = null;

export async function editDocumentDetails() {
  if (!root) return;
  if (activeDialog) { activeDialog.focus(); return; }
  const project = root;
  const dialog = document.createElement("dialog");
  activeDialog = dialog;
  dialog.className = "workspace-dialog";
  dialog.setAttribute("aria-labelledby", "document-details-title");
  dialog.innerHTML = `<form>
    <div class="workspace-heading"><div><p class="tul-eyebrow">Titulní strana</p><h2 id="document-details-title">Údaje práce</h2></div><button type="button" class="icon-btn workspace-close" aria-label="Zavřít">×</button></div>
    <p class="workspace-intro">Načítám údaje z dokumentu…</p>
    <fieldset class="semester-fields" disabled></fieldset>
    <p class="workspace-error" role="alert" hidden></p>
    <div class="workspace-actions"><button type="button" class="btn workspace-cancel">Zrušit</button><button type="submit" class="btn btn-primary" disabled>Načítám…</button></div>
  </form>`;
  const field = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const form = field<HTMLFormElement>("form");
  const inputs = field<HTMLFieldSetElement>("fieldset");
  const submit = field<HTMLButtonElement>('button[type="submit"]');
  const error = field<HTMLParagraphElement>(".workspace-error");
  let busy = true;
  let metadata: EditableDetails | null = null;
  const close = () => { if (!busy) dialog.close(); };
  field(".workspace-close").onclick = close;
  field(".workspace-cancel").onclick = close;
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  dialog.addEventListener("keydown", event => { event.stopPropagation(); });
  dialog.addEventListener("close", () => { activeDialog = null; dialog.remove(); });
  const showError = (e: unknown) => {
    const message = String(e);
    error.textContent = message.startsWith("FILE_CONFLICT:")
      ? "Dokument nebo jeho styl se mezitím změnil. Nic nebylo přepsáno. Zavřete formulář a otevřete jej znovu, aby načetl aktuální údaje."
      : message;
    error.hidden = false;
  };
  document.body.append(dialog);
  dialog.showModal();
  try {
    // Save acknowledged editor revisions before taking a disk snapshot. Closing the side
    // pane prevents a stale second editor from remaining over the changed style/source.
    await save();
    await closeSide();
    if (root !== project || dirty) throw new Error("Projekt se změnil. Otevřete údaje práce znovu.");
    metadata = await invoke<EditableDetails>("read_document_details", { root: project });
    if (root !== project || dirty) throw new Error("Projekt se změnil. Otevřete údaje práce znovu.");
    if (metadata.kind === "semester") {
      inputs.innerHTML = semesterFields;
      const faculty = field<HTMLSelectElement>("#semester-faculty");
      for (const [id, label] of faculties) faculty.add(new Option(label, id));
      const d = metadata.snapshot.details;
      faculty.value = d.faculty;
      field<HTMLInputElement>("#semester-title").value = d.title;
      field<HTMLTextAreaElement>("#semester-authors").value = d.authors.join("\n");
      field<HTMLInputElement>("#semester-subject").value = d.subject;
      field<HTMLInputElement>("#semester-year").value = String(d.year);
      field<HTMLInputElement>("#semester-date").value = d.date;
      field<HTMLInputElement>("#semester-version").value = d.assignmentVersion;
    } else {
      inputs.innerHTML = templateFields["tul-presentation"];
      const d = metadata.snapshot.details;
      field<HTMLSelectElement>("#template-faculty").value = d.faculty;
      field<HTMLInputElement>("#template-title").value = d.title;
      field<HTMLTextAreaElement>("#template-authors").value = d.authors.join("\n");
      field<HTMLInputElement>("#presentation-institute").value = d.institute;
      field<HTMLInputElement>("#presentation-date").value = d.date;
      field<HTMLInputElement>("#presentation-email").value = d.email;
      field<HTMLInputElement>("#presentation-phone").value = d.phone;
    }
    field("#document-details-title").textContent = metadata.kind === "semester" ? "Údaje semestrální práce" : "Údaje prezentace";
    field(".workspace-intro").textContent = "Upravte údaje titulní strany. Ostatní obsah dokumentu zůstane zachovaný.";
    inputs.disabled = false;
    submit.disabled = false;
    submit.textContent = "Uložit údaje";
    field<HTMLInputElement>(metadata.kind === "semester" ? "#semester-title" : "#template-title").focus();
  } catch (e) { metadata = null; showError(e); submit.textContent = "Údaje nelze upravit"; }
  finally { busy = false; }
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !metadata || !form.reportValidity()) return;
    if (root !== project || dirty) { showError("Projekt nebo editor se změnil. Zavřete formulář a otevřete jej znovu."); return; }
    const details = metadata.kind === "semester" ? {
      faculty: field<HTMLSelectElement>("#semester-faculty").value, title: field<HTMLInputElement>("#semester-title").value,
      authors: authorsFromLines(field<HTMLTextAreaElement>("#semester-authors").value),
      subject: field<HTMLInputElement>("#semester-subject").value,
      year: field<HTMLInputElement>("#semester-year").valueAsNumber,
      date: field<HTMLInputElement>("#semester-date").value,
      assignmentVersion: field<HTMLInputElement>("#semester-version").value,
    } : readTemplateDetails(inputs, "tul-presentation");
    busy = true; error.hidden = true; inputs.disabled = true; submit.disabled = true;
    submit.textContent = "Ukládám…";
    let written = false;
    try {
      const snapshot = metadata.snapshot;
      if (metadata.kind === "semester") {
        await invoke("save_semester_details", { root: project, details, sourceRevision: snapshot.sourceRevision, styleRevision: metadata.snapshot.styleRevision });
      } else {
        // The tag belongs to the creation IPC; editing takes PresentationDetails directly.
        const { kind: _kind, ...presentation } = details as ReturnType<typeof readTemplateDetails>;
        await invoke("save_presentation_details", { root: project, details: presentation, sourceRevision: snapshot.sourceRevision });
      }
      written = true;
      // Load the new acknowledged disk revision; old cached editor states cannot match
      // different text. Existing saves continue to use revision-checked sessions.
      if (root === project) {
        documentProgress.invalidate();
        await openFile(snapshot.main);
        setStatus("Údaje práce uloženy. Pro aktualizaci zvolte Vytvořit PDF.", "ok");
      }
      dialog.close();
    } catch (e) {
      if (written) {
        // A successful disk save must not leave a retry button with an obsolete revision.
        dialog.close();
        if (root === project) setStatus(`Údaje jsou uložené, ale editor se nepodařilo znovu načíst: ${String(e)}`, "err");
      } else {
        showError(e);
        inputs.disabled = false; submit.disabled = false; submit.textContent = "Uložit údaje";
      }
    } finally { busy = false; }
  };
}
