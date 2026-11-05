import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLog } from "../src/diagnostics.ts";

test("multi-pass compilation reports unresolved problems from the final pass", () => {
  const earlier = "LaTeX Warning: Citation `example' on page 1 undefined on input line 8.\n";
  const marker = "\n--- TUL Writer TeX pass ---\n";
  assert.equal(parseLog(earlier, "main.tex").length, 1);
  assert.deepEqual(parseLog(earlier + marker + "Output written on main.pdf", "main.tex"), []);
  const final = parseLog(earlier + marker + earlier + "main.tex:12: Undefined control sequence.\n", "main.tex");
  assert.equal(final.length, 2);
  assert.equal(final.find(p => p.severity === "error")?.line, 12);
});
