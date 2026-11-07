export const opening = { fail: false, calls: [] as { path: string; requireMain: boolean }[] };
export async function openProject(path: string, options: { requireMain: boolean }) {
  opening.calls.push({ path, requireMain: options.requireMain });
  if (opening.fail) throw new Error("Test: hlavní soubor není přístupný");
}
