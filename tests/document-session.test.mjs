import { test } from "node:test";
import assert from "node:assert/strict";
import { DocumentSession } from "../src/document-session.ts";

test("overlapping saves use the revision returned by the previous completed save", async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const calls = [];
  const session = new DocumentSession({ content: "base", revision: "r0" }, async (content, expected) => {
    calls.push([content, expected]);
    if (content === "first") await gate;
    return content;
  });
  const first = session.save("first");
  const second = session.save("second");
  await Promise.resolve();
  assert.deepEqual(calls, [["first", "r0"]]);
  release();
  await Promise.all([first, second]);
  assert.deepEqual(calls, [["first", "r0"], ["second", "first"]]);
  assert.equal(session.revision, "second");
});

test("conflict never acknowledges the external version or disables subsequent saves", async () => {
  const calls = [];
  const session = new DocumentSession({ content: "base", revision: "r0" }, async (content, expected) => {
    calls.push([content, expected]);
    throw new Error("FILE_CONFLICT: external content");
  });
  await assert.rejects(session.save("local edits"), /FILE_CONFLICT/);
  await assert.rejects(session.save("more local edits"), /FILE_CONFLICT/);
  assert.equal(session.revision, "r0");
  assert.deepEqual(calls, [["local edits", "r0"], ["more local edits", "r0"]]);
});
