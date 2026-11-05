import { test } from "node:test";
import assert from "node:assert/strict";
import { authorsFromLines } from "../src/semester-authors.ts";

test("pasted author lists preserve order, accents and duplicate names across line endings", () => {
  assert.deepEqual(authorsFromLines("  Jana Nová  \r\nPetr Dvořák\r\n\r\nJana Nová\nJiří_1 & 50%\rTereza Černá\n"), ["Jana Nová", "Petr Dvořák", "Jana Nová", "Jiří_1 & 50%", "Tereza Černá"]);
  assert.deepEqual(authorsFromLines("  Zkušební autor  "), ["Zkušební autor"]);
  assert.deepEqual(authorsFromLines(" \r\n \n "), []);
});
