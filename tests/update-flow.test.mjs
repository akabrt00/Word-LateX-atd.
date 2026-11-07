import { test } from "node:test";
import assert from "node:assert/strict";
import { UpdateFlow } from "../src/update-flow.ts";
function setup(overrides = {}) {
  const calls = [];
  const operations = Object.fromEntries(["check", "preflight", "download", "save", "install"].map(name => [name, async version => {
    calls.push([name, version]); if (overrides[name]) return overrides[name](version);
    if (name === "check") return { available: true, version: "0.2.1" };
  }]));
  return { flow: new UpdateFlow(operations), calls };
}
test("startup check never downloads, saves or installs", async () => {
  const { flow, calls } = setup(); assert.equal((await flow.check()).version, "0.2.1");
  assert.deepEqual(calls.map(c => c[0]), ["check"]);
});
test("installation verifies download, rechecks tasks, saves, then installs the same version", async () => {
  const { flow, calls } = setup(); await flow.install("0.2.1");
  assert.deepEqual(calls.map(c => c[0]), ["preflight", "download", "preflight", "save", "install"]);
  assert.equal(calls[1][1], "0.2.1"); assert.equal(calls[4][1], "0.2.1");
});
test("failed signature or download never launches an installer", async () => {
  const { flow, calls } = setup({ download: () => { throw Error("invalid signature"); } });
  await assert.rejects(flow.install("0.2.1"), /signature/);
  assert.deepEqual(calls.map(c => c[0]), ["preflight", "download"]);
});
test("external file conflict aborts installation and allows a retry", async () => {
  let fail = true; const { flow, calls } = setup({ save: () => { if (fail) throw Error("FILE_CONFLICT"); } });
  await assert.rejects(flow.install("0.2.1"), /FILE_CONFLICT/);
  assert.equal(calls.some(c => c[0] === "install"), false);
  fail = false; await flow.install("0.2.1"); assert.equal(calls.filter(c => c[0] === "install").length, 1);
});
test("concurrent check cannot replace an update being downloaded", async () => {
  let release; const gate = new Promise(resolve => { release = resolve; });
  const { flow } = setup({ download: () => gate });
  const pending = flow.install("0.2.1"); await Promise.resolve();
  await assert.rejects(flow.check(), /probíhá/); await assert.rejects(flow.install("0.2.2"), /probíhá/);
  release(); await pending;
});
