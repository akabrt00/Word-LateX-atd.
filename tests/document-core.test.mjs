import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyTransaction, plainTextEdit } from "../src/document-core.ts";
const fixture = readFileSync(new URL("./fixtures/opaque.tex", import.meta.url), "utf8");
test("no-op preserves complete source, BOM and CRLF byte for byte", () => {
  for (const source of [fixture, "\uFEFF" + fixture.replaceAll("\n", "\r\n")])
    assert.deepEqual(Buffer.from(applyTransaction(source, {base: source, edits: []})), Buffer.from(source));
});
test("edit preserves unknown macros, environments, comments, citations and TikZ", () => {
  const original = "An ordinary paragraph with measured value 42.";
  const from = fixture.indexOf(original);
  const tx = plainTextEdit(fixture, from, from + original.length, "An improved paragraph with measured value 42.");
  const result = applyTransaction(fixture, tx);
  assert.equal(result.slice(0, from), fixture.slice(0, from));
  assert.equal(result.slice(from + tx.edits[0].insert.length), fixture.slice(from + original.length));
  assert.equal(result.replace(tx.edits[0].insert, original), fixture);
});
test("rejects stale proposals even when the selected range is unchanged", () => {
  assert.throws(() => applyTransaction("hello world!", plainTextEdit("hello world", 0, 5, "goodbye")), /Source changed/);
});
test("validates ranges, expected content, overlaps and Unicode boundaries", () => {
  const source = "a😀bc";
  for (const edits of [
    [{from: -1, to: 2, expected: "", insert: ""}],
    [{from: 0, to: 99, expected: source, insert: ""}],
    [{from: 0.5, to: 1, expected: "", insert: ""}],
    [{from: 1, to: 2, expected: source.slice(1,2), insert: ""}],
    [{from: 0, to: 1, expected: "wrong", insert: ""}],
    [{from: 0, to: 3, expected: "a😀", insert: ""}, {from: 1, to: 3, expected: "😀", insert: ""}],
  ]) assert.throws(() => applyTransaction(source, {base: source, edits}));
});
test("multiple edits use original positions and support inverse transaction", () => {
  const source = "one two three";
  const result = applyTransaction(source, {base: source, edits: [
    {from: 8, to: 13, expected: "three", insert: "3"},
    {from: 0, to: 3, expected: "one", insert: "1"}
  ]});
  assert.equal(result, "1 two 3");
  assert.equal(applyTransaction(result, {base: result, edits: [
    {from: 0, to: 1, expected: "1", insert: "one"},
    {from: 6, to: 7, expected: "3", insert: "three"}
  ]}), source);
});
test("visual helper refuses TeX and injection instead of serializing it", () => {
  for (const text of ["\\mystery{x}", "$x$", "a%b", "{x}", "a&b", "x_y", "x^2"])
    assert.throws(() => plainTextEdit(text, 0, text.length, "replacement"));
  assert.throws(() => plainTextEdit("hello", 0, 5, "\\input{secret}"));
});
test("length-changing edits preserve line endings and Unicode outside the range", () => {
  const source = "\uFEFF% Žluťoučký 😀\r\nhello\r\n% konec\r\n";
  const from = source.indexOf("hello");
  assert.equal(applyTransaction(source, plainTextEdit(source, from, from+5, "Dobrý den")), source.replace("hello", "Dobrý den"));
});
