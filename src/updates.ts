// A fork must never install upstream Scribe binaries.
import { setStatus } from "./core";
export async function checkForUpdates(_quiet = false) {
  setStatus("Aktualizace TUL Writeru zatím nejsou nakonfigurovány.");
}
export function checkForUpdatesLater() { /* disabled until our own signed releases exist */ }
