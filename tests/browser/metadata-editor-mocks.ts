// Only the headless test Vite server aliases the editor dependencies to this module.
export let root: string | null = "C:\\Metadata-test";
export let dirty = false;
export const editor = { calls: [] as unknown[], saveError: "", sideError: "", reloadError: "" };
export const setRoot = (value: string | null) => { root = value; };
export const setDirty = (value: boolean) => { dirty = value; };
export function resetEditor() {
  root = "C:\\Metadata-test"; dirty = false;
  editor.calls.length = 0; editor.saveError = ""; editor.sideError = ""; editor.reloadError = "";
}
export async function save() {
  editor.calls.push("save");
  if (editor.saveError) throw Error(editor.saveError);
}
export async function closeSide() {
  editor.calls.push("closeSide");
  if (editor.sideError) throw Error(editor.sideError);
}
export async function openFile(path: string) {
  editor.calls.push(["openFile", path]);
  if (editor.reloadError) throw Error(editor.reloadError);
}
export function setStatus(message: string, kind: string) { editor.calls.push(["status", message, kind]); }
