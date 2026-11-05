/** UTF-16 offsets match CodeMirror. Transaction experiment, not a LaTeX parser. */
export interface SourceEdit { from: number; to: number; expected: string; insert: string; }
export interface SourceTransaction { base: string; edits: readonly SourceEdit[]; }
export function applyTransaction(source: string, transaction: SourceTransaction): string {
  if (source !== transaction.base) throw new Error("Source changed; regenerate the proposal");
  const edits = [...transaction.edits].sort((a, b) => a.from - b.from);
  let end = -1;
  for (const edit of edits) {
    if (!Number.isInteger(edit.from) || !Number.isInteger(edit.to) || edit.from < 0
      || edit.to < edit.from || edit.to > source.length || edit.from <= end)
      throw new Error("Invalid or overlapping source range");
    for (const offset of [edit.from, edit.to]) {
      if (offset > 0 && offset < source.length
        && /[\uD800-\uDBFF]/.test(source[offset - 1])
        && /[\uDC00-\uDFFF]/.test(source[offset])) throw new Error("Split Unicode character");
    }
    if (source.slice(edit.from, edit.to) !== edit.expected) throw new Error("Source range mismatch");
    end = edit.to - 1;
  }
  let result = source;
  for (const edit of edits.reverse()) result = result.slice(0, edit.from) + edit.insert + result.slice(edit.to);
  return result;
}
/** Opt-in plain text spans only. Complex LaTeX remains opaque. */
export function plainTextEdit(source: string, from: number, to: number, text: string): SourceTransaction {
  const original = source.slice(from, to);
  const special = /[\\{}%$&#_^~\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
  if (!original.trim() || special.test(original) || special.test(text))
    throw new Error("Unsupported visual content; use the LaTeX editor");
  return { base: source, edits: [{ from, to, expected: original, insert: text }] };
}
