import { test } from "node:test";
import assert from "node:assert/strict";
import { PdfExportFlow } from "../src/pdf-export-flow.ts";

function setup() {
  const state = { displayed: { name: "Práce A.pdf", bytes: new Uint8Array([37, 80, 68, 70, 45, 65]) }, destination: "chosen.pdf", writes: [], busy: [], choose: null, fail: false };
  const flow = new PdfExportFlow({
    capture: async () => state.displayed,
    choose: async name => state.choose ? state.choose(name) : state.destination,
    write: async (bytes, destination) => { if (state.fail) throw Error("Disk is full"); state.writes.push({ bytes: [...bytes], destination }); },
    busy: value => state.busy.push(value),
  });
  return { state, flow };
}

test("PDF export keeps the displayed snapshot while the native dialog is open", async () => {
  const { state, flow } = setup();
  state.choose = name => {
    assert.equal(name, "Práce A.pdf");
    state.displayed = { name: "Project B.pdf", bytes: new Uint8Array([66]) };
    return "A.pdf";
  };
  assert.equal(await flow.save(), "A.pdf");
  assert.deepEqual(state.writes, [{ bytes: [37, 80, 68, 70, 45, 65], destination: "A.pdf" }]);
  assert.deepEqual(state.busy, [true, false]);
});

test("cancelled or absent PDF never writes a destination", async () => {
  const { state, flow } = setup();
  state.destination = null;
  assert.equal(await flow.save(), null);
  state.displayed = null;
  state.choose = () => { throw Error("No dialog without a displayed PDF"); };
  assert.equal(await flow.save(), null);
  assert.deepEqual(state.writes, []);
});

test("one pending export blocks duplicate dialogs and failures allow retry", async () => {
  const { state, flow } = setup();
  let release;
  state.choose = () => new Promise(resolve => { release = resolve; });
  const pending = flow.save();
  await Promise.resolve();
  assert.equal(await flow.save(), null);
  release("first.pdf"); await pending;
  state.choose = null; state.fail = true;
  await assert.rejects(flow.save(), /Disk is full/);
  assert.equal(state.busy.at(-1), false);
  state.fail = false;
  assert.equal(await flow.save(), "chosen.pdf");
  assert.equal(state.writes.length, 2);
});
