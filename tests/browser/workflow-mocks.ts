export const workflow = {
  calls: [] as string[], problems: [] as { severity: string }[],
  saveError: "", sideError: "", onSave: null as null | (() => Promise<void> | void),
};
export const view = { state: { doc: { toString: () => "\\documentclass{article}\n" } } };
export async function save() {
  workflow.calls.push("save");
  if (workflow.saveError) throw Error(workflow.saveError);
  await workflow.onSave?.();
}
export async function saveSide() { workflow.calls.push("saveSide"); if (workflow.sideError) throw Error(workflow.sideError); }
export const sideFocused = () => false;
export const listFiles = async () => [];
export const settings = { compileOnSave: false, compileOnType: false };
export const installLatex = async () => { workflow.calls.push("installLatex"); };
export function setProblems(problems: { severity: string }[]) { workflow.problems = problems; }
export const problemSummary = () => workflow.problems.some(p => p.severity === "error") ? "1 chyba" : "";
export const refreshIndexSoon = () => {};
export const refreshFiles = async () => {};
export const appearance = { pdfDark: false };
export const sizes = { hidePdf: false };
export const togglePane = () => {};
export const revealLine = async () => {};
export const picturesLayer = async () => null;
