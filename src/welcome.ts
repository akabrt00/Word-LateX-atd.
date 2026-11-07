// Welcome screen: document actions, recent projects and optional setup details.
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { formatKeys, getCommand } from "./commands";
import { ICONS } from "./icons";
import { $, appEl, baseName, setStatus, welcomeEl } from "./core";
import { openPalette, promptInput } from "./palette";
import { profile } from "./profile";
import { openProject } from "./project";
import { TEMPLATES } from "./templates";
import { refreshWorkspaceLabel, showWorkspace } from "./workspace";

export function showWelcome(show: boolean) {
  welcomeEl.classList.toggle("hidden", !show);
  appEl.classList.toggle("hidden", show);
  if (show) void refreshWorkspaceLabel();
}

// ---------- recent projects ----------
export const RECENT_KEY = "scribe.recent";

export function getRecent(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(list) ? list.filter((p) => typeof p === "string") : [];
  } catch { return []; }
}

export function setRecent(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5))); } catch {}
}

export function renderRecent() {
  const recent = getRecent();
  $("recent").hidden = recent.length === 0;
  const list = $("recent-list");
  list.replaceChildren();
  for (const path of recent) {
    const name = baseName(path);
    const openBtn = document.createElement("button");
    openBtn.className = "recent-open";
    openBtn.title = path;
    openBtn.innerHTML = ICONS.folder;
    const nameEl = document.createElement("span");
    nameEl.className = "recent-name";
    nameEl.textContent = name;
    const pathEl = document.createElement("span");
    pathEl.className = "recent-path";
    pathEl.textContent = path.slice(0, path.length - name.length).replace(/[\\/]+$/, "");
    openBtn.append(nameEl, pathEl);
    openBtn.onclick = () => openProject(path);

    const remove = document.createElement("button");
    remove.className = "icon-btn";
    remove.innerHTML = ICONS.close;
    remove.title = "Remove from this list";
    remove.setAttribute("aria-label", `Remove ${name} from recent projects`);
    remove.onclick = () => {
      setRecent(getRecent().filter((p) => p !== path));
      renderRecent();
    };

    const li = document.createElement("li");
    li.append(openBtn, remove);
    list.appendChild(li);
  }
}

// ---------- welcome: setup check, shortcuts, new project ----------
export interface Tools { tex: string | null; python: string | null; }

export function setupRow(ok: boolean, name: string, detail: string): HTMLElement {
  const li = document.createElement("li");
  li.className = ok ? "ok" : "missing";
  const icon = document.createElement("span");
  icon.className = "row-icon";
  icon.innerHTML = ok ? ICONS.check : ICONS.warn;
  const title = document.createElement("span");
  title.className = "setup-name";
  title.textContent = name;
  const sub = document.createElement("span");
  sub.className = "setup-detail";
  sub.textContent = detail;
  li.append(icon, title, sub);
  return li;
}

// No LaTeX: one click installs Tectonic, instead of a page of instructions.
function installRow(): HTMLElement {
  const li = setupRow(false, "Chybí překladač LaTeXu", "Nainstalujte Tectonic tímto tlačítkem, nebo použijte MiKTeX či TeX Live.");
  const button = document.createElement("button");
  button.className = "btn btn-outline setup-install";
  button.textContent = "Nainstalovat překladač";
  button.onclick = () => installLatex();
  li.appendChild(button);
  return li;
}

let installing = false;

/** Download Tectonic into Scribe's own folder; afterwards papers compile with no TeX installed. */
export async function installLatex() {
  if (installing) return;
  installing = true;
  setStatus("Stahuji překladač Tectonic…", "busy");
  for (const b of document.querySelectorAll<HTMLButtonElement>(".setup-install")) {
    b.disabled = true;
    b.textContent = "Instaluji…";
  }
  try {
    const version = await invoke<string>("install_tectonic");
    setStatus(`Nainstalováno: ${version}. První překlad může trvat déle kvůli stažení balíčků dokumentu.`, "ok");
  } catch (e) {
    setStatus(String(e), "err");
  } finally {
    installing = false;
    renderSetup();
  }
}

// Says up front whether compiling and notebooks will work on this machine.
export async function renderSetup() {
  const list = $("setup-list");
  let tools: Tools;
  try {
    tools = await invoke<Tools>("check_tools");
  } catch {
    list.closest("section")!.hidden = true;
    return;
  }
  list.closest("section")!.hidden = false;
  // Missing TeX blocks the main document flow; optional Python never does.
  if (!tools.tex) $<HTMLDetailsElement>("welcome-options").open = true;
  list.replaceChildren(
    tools.tex
      ? setupRow(true, "LaTeX", tools.tex)
      : installRow(),
    tools.python
      ? setupRow(true, "Python", tools.python)
      : setupRow(false, "Python — volitelné", "Potřebný pouze pro spouštění notebooků a tvorbu grafů."),
  );
}

/** Bring in a project from elsewhere: an Overleaf download (zip) or a git link. */
export function importProject() {
  openPalette({
    placeholder: "Import a project from…",
    empty: "",
    items: [
      { label: "A .zip file", detail: "From Overleaf: Menu > Download > Source", run: importZip },
      { label: "A git link", detail: "Overleaf's Git link, GitHub, GitLab…", run: importGit },
    ],
  });
}

// Shown on the welcome screen when that's where the import started, and in the status line.
function importFailed(e: unknown) {
  const errEl = $("welcome-error");
  errEl.textContent = `Couldn't import the project: ${e}`;
  errEl.hidden = false;
  setStatus(String(e), "err");
}

async function chooseParent(): Promise<string | null> {
  const parent = await open({ directory: true, title: "Choose where to put the project" });
  return typeof parent === "string" ? parent : null;
}

async function importZip() {
  const zip = await open({ title: "Choose the project's .zip", filters: [{ name: "Zip", extensions: ["zip"] }] });
  if (typeof zip !== "string") return;
  const parent = await chooseParent();
  if (!parent) return;
  setStatus("Unpacking the project…", "busy");
  try {
    const path = await invoke<string>("import_zip", { zip, parent });
    setStatus("");
    await openProject(path);
  } catch (e) {
    importFailed(e);
  }
}

function importGit() {
  promptInput({
    placeholder: "Git link",
    hint: "Overleaf: Menu > Git, with a token in the link: https://git:<token>@git.overleaf.com/<id>",
    submit: async (url) => {
      const parent = await chooseParent();
      if (!parent) return;
      setStatus("Cloning the project…", "busy");
      try {
        const path = await invoke<string>("clone_project", { url, parent });
        setStatus("");
        await openProject(path);
      } catch (e) {
        importFailed(e);
      }
    },
  });
}

export function renderShortcuts() {
  const list = $("shortcut-list");
  const labels: Record<string, string> = {
    "build.compile": "Kompilovat", "build.runNotebooks": "Spustit notebooky", "view.palette": "Příkazy",
    "view.quickOpen": "Přejít na soubor", "edit.findInProject": "Hledat v projektu",
  };
  list.replaceChildren();
  for (const id of Object.keys(labels)) {
    const command = getCommand(id);
    if (!command?.keys) continue;
    const li = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "row-icon";
    icon.innerHTML = command.icon ?? "";
    const keys = document.createElement("span");
    keys.className = "shortcut-keys";
    keys.textContent = formatKeys(command.keys);
    li.append(icon, labels[id], keys);
    list.appendChild(li);
  }
}

// Templates leave the author blank or as a placeholder; fill in the profile when there is one.
function signed(content: string): string {
  if (!profile.name) return content;
  return content
    .replace("\\author{}", () => `\\author{${profile.name}}`)
    .replace(/\\author\{(Your Name|First Author)\}/, () => `\\author{${profile.name}}`)
    .replace("\\IEEEauthorblockN{First Author}", () => `\\IEEEauthorblockN{${profile.name}}`)
    .replace("email@example.org", () => profile.email || "email@example.org")
    .replace(/\\institution\{University\}/, () => `\\institution{${profile.affiliation || "University"}}`);
}

// Pick (or create) a folder. A folder that already has a paper just opens; an empty one is
// started from a template.
export async function newProject() {
  await showWorkspace(true, legacyNewProject);
}

async function legacyNewProject() {
  const picked = await open({ directory: true, multiple: false, title: "Choose or create a folder for the project" });
  if (typeof picked !== "string") return;
  const fail = (e: unknown) => {
    const errEl = $("welcome-error");
    errEl.textContent = `Couldn't set up the project: ${e}`;
    errEl.hidden = false;
  };

  let files: string[];
  try {
    files = await invoke<string[]>("list_files", { root: picked });
  } catch (e) {
    fail(e);
    return;
  }
  // Already a paper or a set of notes (a lone readme doesn't count): open it as it is.
  if (files.some((f) => f.endsWith(".tex") || (/\.md$/i.test(f) && !/(^|\/)readme\.md$/i.test(f)))) {
    await openProject(picked);
    return;
  }

  openPalette({
    placeholder: `Start ${baseName(picked)} from…`,
    empty: "No templates.",
    items: TEMPLATES.map((template) => ({
      label: template.name,
      detail: template.detail,
      run: async () => {
        try {
          for (const [rel, content] of Object.entries(template.files)) {
            if (!files.includes(rel)) await invoke("write_file", { root: picked, rel, content: signed(content) }); // never overwrite
          }
        } catch (e) {
          fail(e);
          return;
        }
        await openProject(picked);
      },
    })),
  });
}
