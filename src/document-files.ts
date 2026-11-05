import { invoke } from "@tauri-apps/api/core";
import { ask } from "@tauri-apps/plugin-dialog";
import { DocumentSession, type DocumentSnapshot } from "./document-session";

export async function readDocument(root: string, rel: string) {
  const snapshot = await invoke<DocumentSnapshot>("read_document", { root, rel });
  const session = new DocumentSession(snapshot, (content, expectedRevision) =>
    invoke<string>("save_document", { root, rel, content, expectedRevision }));
  return { ...snapshot, session };
}

// Never offer an unchecked overwrite. Leaving this dialog keeps the local buffer intact.
export async function resolveFileConflict(error: unknown, rel: string, reload: () => Promise<void>) {
  if (!String(error).startsWith("FILE_CONFLICT:")) return;
  const yes = await ask(
    `${rel} byl změněn nebo odstraněn mimo tento editor. Uložení bylo zastaveno a vaše úpravy zůstávají v editoru.\n\nChcete načíst aktuální soubor z disku? Tím zahodíte své neuložené úpravy. Pokud je chcete zachovat, zvolte Ponechat moje úpravy a zkopírujte je před načtením.`,
    { title: "Soubor se změnil na disku", kind: "warning", okLabel: "Načíst z disku", cancelLabel: "Ponechat moje úpravy" });
  if (yes) await reload();
}
