import { $, current, setCurrent, setMainFile } from "../../src/core";

export const projectMock = { restore: null as string | null, main: "main.tex", sideError: "" };
export function createEditorState(content: string) { return { doc: { toString: () => content, length: content.length } }; }
export const view = {
  state: createEditorState(""),
  setState(state: ReturnType<typeof createEditorState>) { this.state = state; },
  dispatch() {}, focus() {}, scrollDOM: { scrollTop: 0 },
};
export const EditorView = { scrollIntoView: () => ({}) };
export const getDocument = () => { throw Error("Unexpected PDF renderer in source-opening test"); };
export const DATA_FILE = /\.(csv|tsv)$/i;
export const showData = () => {};
export const clearProblems = () => {};
export const markProblemsInEditor = () => {};
export const prefEffects = () => [];
export const isNotebook = () => false;
export const leaveNotebook = () => {};
export const notebookContent = () => view.state.doc.toString();
export const stopKernel = async () => {};
export const updateNotebookView = async () => { $("editor").hidden = false; };
export const resetPdf = () => {};
export const setPaperless = () => {};
export const closeReader = () => {};
export const isPaper = () => false;
export const openReader = async () => {};
export const closeTour = () => {};
export const tourOnFirstProject = () => {};
export const restoreCursor = () => {};
export async function restoreSession() {
  if (!projectMock.restore) return false;
  const { openFile } = await import("/src/project.ts");
  await openFile(projectMock.restore);
  return true;
}
export const saveSession = () => {};
export const loadSettings = async () => { setMainFile(projectMock.main); };
export const resetSettings = () => {};
export const toggleSettings = () => {};
export const closeSide = async () => { if (projectMock.sideError) throw Error(projectMock.sideError); };
export const sideFile = null;
export const renderFileInfo = () => {};
export const refreshFiles = async () => {};
export const dropTabs = async (gone: (file: string) => boolean) => { if (current && gone(current)) setCurrent(null); };
export const noteOpened = () => {};
export const resetTabs = () => {};
export const showNoFile = () => { setCurrent(null); };
export const stashEditor = () => {};
export const takeStashed = () => null;
export const canRunFile = () => false;
export const resetTerminal = async () => {};
export const refreshIndex = async () => {};
export const refreshIndexSoon = () => {};
export const VALUES_TEX = "generated-values.tex";
export const getRecent = () => [];
export const renderRecent = () => {};
export const setRecent = () => {};
export const showWelcome = (visible: boolean) => { $("welcome").classList.toggle("hidden", !visible); $("app").classList.toggle("hidden", visible); };
