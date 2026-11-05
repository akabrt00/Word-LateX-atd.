/** Preserve author order and repeated names, accepting pasted Windows/macOS line endings. */
export function authorsFromLines(value: string): string[] {
  return value.split(/\r\n|\r|\n/).map(name => name.trim()).filter(Boolean);
}
