// Running notebooks and compiling the paper.
import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { $, changeListeners, current, mainFile, NOTEBOOK_SOURCE, root, setStatus, showLog } from "./core";
import { explain, parseLog, Problem } from "./diagnostics";
import { view } from "./editor";
import { renderPdf, setPdfBuildBusy } from "./preview";
import { installLatex } from "./welcome";
import { problemSummary, setProblems } from "./problems";
import { listFiles, save } from "./project";
import { settings } from "./settings";
import { saveSide, sideFile } from "./split";
import { refreshIndexSoon } from "./texindex";
import { refreshFiles } from "./sidebar";
import { CompileResult, NotebookInfo, RunResult } from "./types";
import { documentProgress } from "./document-progress";

// ---------- notebooks ----------
export let running = false;

export async function runStaleNotebooks(): Promise<boolean> {
  if (!root) return true;
  const files = await listFiles();
  const pyFiles = files.filter((f) => NOTEBOOK_SOURCE.test(f));

  for (const py of pyFiles) {
    try {
      const info = await invoke<NotebookInfo>("parse_notebook", { root, rel: py });
      if (info.stale.length === 0) continue;

      setStatus(`Running ${py}…`, "busy");
      const res = await invoke<RunResult>("run_notebook", { root, rel: py });
      if (!res.ok) {
        showLog(`Notebook log: ${py}`, res.log);
        setStatus(`${py} failed`, "err");
        return false;
      }
    } catch (e) {
      showLog(`Notebook log: ${py}`, String(e));
      setStatus(`Couldn't run ${py}`, "err");
      return false;
    }
  }

  // ensure scribe-figures.sty exists
  try { await invoke("generate_style", { root }); } catch (_) { /* ok if exists */ }
  return true;
}

export async function runNotebook() {
  if (!root || running) return;
  running = true;
  $<HTMLButtonElement>("btn-run").disabled = true;
  try {
    await save();
    setStatus("Running notebooks…", "busy");

    const files = await listFiles();
    const pyFiles = files.filter((f) => NOTEBOOK_SOURCE.test(f));

    for (const py of pyFiles) {
      try {
        const info = await invoke<NotebookInfo>("parse_notebook", { root, rel: py });
        if (info.figure_ids.length === 0 && info.value_names.length === 0) continue; // produces nothing for the paper

        setStatus(`Running ${py}…`, "busy");
        const res = await invoke<RunResult>("run_notebook", { root, rel: py });
        showLog(`Notebook log: ${py}`, res.log, !res.ok);
        if (!res.ok) {
          setStatus(`${py} failed`, "err");
          return;
        }
      } catch (e) {
        showLog(`Notebook log: ${py}`, String(e));
        setStatus(`Couldn't run ${py}`, "err");
        return;
      }
    }

    try { await invoke("generate_style", { root }); } catch (_) {}
    setStatus("Notebooks ran", "ok");
    refreshIndexSoon();
    await refreshFiles();
  } finally {
    running = false;
    $<HTMLButtonElement>("btn-run").disabled = false;
  }
}

// ---------- compile + preview ----------
export let compiling = false;

/** Problems from a log, with plain-words hints; brace errors also say where the open { is. */
async function problemsFrom(log: string, project: string, main: string): Promise<Problem[]> {
  const found = parseLog(log, main);
  const texts = new Map<string, string>();
  for (const file of new Set(found.map((p) => p.file))) {
    const text = root === project && file === current && !$("editor").hidden ? view.state.doc.toString() : await invoke<string>("read_file", { root: project, rel: file }).catch(() => "");
    texts.set(file, text);
  }
  return explain(found, (file) => texts.get(file) ?? null);
}

let typingTimer: number | null = null;

/** Compile as you type: after a pause in typing in a .tex file, save and compile quietly. */
export function compileSoon() {
  if (!settings.compileOnType || !root || !current?.endsWith(".tex")) return;
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = window.setTimeout(function again() {
    if (compiling) {
      typingTimer = window.setTimeout(again, 800); // wait for the compile in progress
      return;
    }
    typingTimer = null;
    compile({ quiet: true });
  }, 1500);
}

/** `quiet`: a compile nobody asked for (while typing) doesn't open the log on failure. */
export async function compile({ quiet = false } = {}) {
  if (!root || compiling) return;
  const project = root, main = mainFile;
  compiling = true;
  setPdfBuildBusy(true);
  for (const button of document.querySelectorAll<HTMLButtonElement>("#btn-compile, [data-create-pdf]")) button.disabled = true;
  $("pdf-pane").classList.add("busy"); // the preview shows that it is about to be replaced
  $("pdf-pane").setAttribute("aria-busy", "true");
  try {
    setStatus("Ukládám změny před kompilací…", "busy");
    await save();
    if (root !== project || mainFile !== main) return;
    await saveSide(); // the side pane may hold part of the paper
    if (root !== project || mainFile !== main) return;

    // auto-run stale notebooks before compiling
    // Notebook execution is an explicit user action in TUL Writer.

    setStatus("Kompiluji dokument…", "busy");
    const sourceRevision = documentProgress.revision;
    const res = await invoke<CompileResult>("compile", { root: project, main });
    if (root !== project || mainFile !== main) return;
    // The parsed problems lead; the raw log stays one tab away.
    const problems = await problemsFrom(res.log, project, main);
    if (root !== project || mainFile !== main) return;
    setProblems(problems, res.log, !res.ok && !quiet);
    const summary = problemSummary();
    if (res.ok && res.pdf) {
      await renderPdf(res.pdf, () => root === project && mainFile === main, sourceRevision);
      if (root !== project || mainFile !== main) return;
      setStatus(documentProgress.pdfState === "current" ? `Náhled je aktualizovaný${summary ? ` · ${summary}` : ""}` : "Kompilace dokončena, ale text se mezitím změnil. Překompilujte dokument znovu.", documentProgress.pdfState === "current" ? "ok" : "");
      refreshFiles();
    } else {
      setStatus(summary ? `Kompilace se nezdařila: ${summary}` : "Kompilace se nezdařila. Podrobnosti najdete dole v panelu.", "err");
    }
  } catch (e) {
    if (root !== project || mainFile !== main) return;
    showLog("Kompilace — podrobnosti", String(e));
    setStatus(`Kompilace se nezdařila: ${String(e)}`, "err");
    // No TeX at all: offer to install it rather than leave the user with an error.
    if (String(e).includes("No TeX engine")) {
      const yes = await ask("Ke kompilaci dokumentu potřebujete překladač LaTeXu. Na tomto počítači nebyl nalezen.\n\nChcete nainstalovat Tectonic? Při prvním použití stáhne potřebné balíčky.", {
        title: "Chybí překladač LaTeXu",
        okLabel: "Nainstalovat",
      });
      if (yes) await installLatex();
    }
  } finally {
    refreshIndexSoon(); // notebooks may have produced new figures or values
    $("pdf-pane").classList.remove("busy");
    $("pdf-pane").setAttribute("aria-busy", "false");
    compiling = false;
    setPdfBuildBusy(false);
    for (const button of document.querySelectorAll<HTMLButtonElement>("#btn-compile, [data-create-pdf]")) button.disabled = false;
  }
}

export let saving = false;
export const canSave = () => !!root && !saving;
function updateSaveButton() {
  $<HTMLButtonElement>("btn-save").disabled = !canSave();
  $("btn-save").setAttribute("aria-busy", String(saving));
}
changeListeners.push(updateSaveButton);

/** Toolbar, menu and either editor's shortcut all save the open source buffers. */
export async function saveFile() {
  if (!root || saving) return;
  const project = root, file = current, side = sideFile;
  const sameContext = () => root === project && current === file && sideFile === side;
  let compileAfter = false;
  saving = true;
  updateSaveButton();
  try {
    setStatus("Ukládám otevřené změny…", "busy");
    await save();
    if (!sameContext()) return;
    await saveSide();
    if (!sameContext()) return;
    if (documentProgress.unsaved.size) throw new Error("Během ukládání přibyly další úpravy. Zvolte Uložit znovu.");
    setStatus("Otevřené změny jsou uložené", "ok");
    compileAfter = settings.compileOnSave;
  } catch (error) {
    if (sameContext()) setStatus(`Uložení nebylo dokončeno: ${String(error)}`, "err");
  } finally {
    saving = false;
    updateSaveButton();
  }
  if (compileAfter && sameContext()) await compile();
}
