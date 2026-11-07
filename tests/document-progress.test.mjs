import { test } from "node:test";
import assert from "node:assert/strict";
import { DocumentProgress } from "../src/document-progress.ts";

test("saving both editors does not turn an older PDF into a current PDF", () => {
  const progress = new DocumentProgress();
  progress.published(progress.revision);
  progress.changed("main.tex"); progress.changed("chapter.tex");
  progress.saved("main.tex");
  assert.deepEqual([...progress.unsaved], ["chapter.tex"]);
  progress.saved("chapter.tex");
  assert.equal(progress.unsaved.size, 0);
  assert.equal(progress.pdfState, "stale");
});

test("edits during compilation remain newer than the completed PDF", () => {
  const progress = new DocumentProgress();
  const compiled = progress.revision;
  progress.changed("main.tex"); progress.changed("main.tex");
  progress.published(compiled);
  assert.equal(progress.pdfState, "stale");
  progress.saved("main.tex");
  progress.published(progress.revision);
  assert.equal(progress.pdfState, "current");
});

test("opening a different project or an unverified PDF never inherits freshness", () => {
  const progress = new DocumentProgress();
  progress.changed("old.tex"); progress.published(progress.revision);
  progress.reset();
  assert.equal(progress.unsaved.size, 0);
  assert.equal(progress.pdfState, "unknown");
  progress.published(progress.revision); progress.invalidate();
  assert.equal(progress.pdfState, "stale");
  progress.published(null);
  assert.equal(progress.pdfState, "unknown");
});

test("renaming an unsaved side file keeps its pending save associated with the new path", () => {
  const progress = new DocumentProgress();
  progress.changed("old.tex"); progress.moved("old.tex", "chapter.tex");
  assert.deepEqual([...progress.unsaved], ["chapter.tex"]);
  progress.saved("chapter.tex");
  assert.equal(progress.unsaved.size, 0);
});
