import { invoke } from "@tauri-apps/api/core";
import { root, dirty, setStatus } from "./core";
import { openFile, save } from "./project";
import { closeSide } from "./split";
import { authorsFromLines } from "./semester-authors";
import { faculties, semesterFields } from "./semester-form";

interface SemesterDetails {
  faculty: string; title: string; authors: string[]; subject: string;
  year: number; date: string; assignmentVersion: string;
}
interface SemesterSnapshot {
  main: string; details: SemesterDetails; sourceRevision: string; styleRevision: string;
}
let activeDialog: HTMLDialogElement | null = null;

export async function editSemesterDetails() {
  if (!root) return;
  if (activeDialog) { activeDialog.focus(); return; }
  const project = root;
  const dialog = document.createElement("dialog");
  activeDialog = dialog;
  dialog.className = "workspace-dialog";
  dialog.setAttribute("aria-labelledby", "semester-edit-title");
  dialog.innerHTML = `<form>
    <div class="workspace-heading"><div><p class="tul-eyebrow">Titulní strana</p><h2 id="semester-edit-title">Údaje práce</h2></div><button type="button" class="icon-btn workspace-close" aria-label="Zavřít">×</button></div>
    <p class="workspace-intro">Upravte údaje semestrální práce. Ostatní obsah dokumentu zůstane zachovaný.</p>
    <fieldset class="semester-fields" disabled>${semesterFields}</fieldset>
    <p class="workspace-error" role="alert" hidden></p>
    <div class="workspace-actions"><button type="button" class="btn workspace-cancel">Zrušit</button><button type="submit" class="btn btn-primary" disabled>Načítám…</button></div>
  </form>`;
  const field = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
  const form = field<HTMLFormElement>("form");
  const inputs = field<HTMLFieldSetElement>("fieldset");
  const submit = field<HTMLButtonElement>('button[type="submit"]');
  const error = field<HTMLParagraphElement>(".workspace-error");
  const faculty = field<HTMLSelectElement>("#semester-faculty");
  for (const [id, label] of faculties) faculty.add(new Option(label, id));
  let busy = true;
  let snapshot: SemesterSnapshot | null = null;
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
    snapshot = await invoke<SemesterSnapshot>("read_semester_details", { root: project });
    const d = snapshot.details;
    faculty.value = d.faculty;
    field<HTMLInputElement>("#semester-title").value = d.title;
    field<HTMLTextAreaElement>("#semester-authors").value = d.authors.join("\n");
    field<HTMLInputElement>("#semester-subject").value = d.subject;
    field<HTMLInputElement>("#semester-year").value = String(d.year);
    field<HTMLInputElement>("#semester-date").value = d.date;
    field<HTMLInputElement>("#semester-version").value = d.assignmentVersion;
    inputs.disabled = false;
    submit.disabled = false;
    submit.textContent = "Uložit údaje";
    field<HTMLInputElement>("#semester-title").focus();
  } catch (e) { showError(e); submit.textContent = "Údaje nelze upravit"; }
  finally { busy = false; }
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !snapshot || !form.reportValidity()) return;
    if (root !== project || dirty) { showError("Projekt nebo editor se změnil. Zavřete formulář a otevřete jej znovu."); return; }
    const details: SemesterDetails = {
      faculty: faculty.value, title: field<HTMLInputElement>("#semester-title").value,
      authors: authorsFromLines(field<HTMLTextAreaElement>("#semester-authors").value),
      subject: field<HTMLInputElement>("#semester-subject").value,
      year: field<HTMLInputElement>("#semester-year").valueAsNumber,
      date: field<HTMLInputElement>("#semester-date").value,
      assignmentVersion: field<HTMLInputElement>("#semester-version").value,
    };
    busy = true; error.hidden = true; inputs.disabled = true; submit.disabled = true;
    submit.textContent = "Ukládám…";
    try {
      await invoke("save_semester_details", { root: project, details, sourceRevision: snapshot.sourceRevision, styleRevision: snapshot.styleRevision });
      // Load the new acknowledged disk revision; old cached editor states cannot match
      // different text. Existing saves continue to use revision-checked sessions.
      if (root === project) {
        await openFile(snapshot.main);
        setStatus("Údaje práce uloženy. Pro aktualizaci PDF spusťte kompilaci.", "ok");
      }
      dialog.close();
    } catch (e) {
      showError(e);
      inputs.disabled = false; submit.disabled = false; submit.textContent = "Uložit údaje";
    } finally { busy = false; }
  };
}
