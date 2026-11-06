import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ciVersion, setVersion } from "../scripts/version.mjs";
import { makeManifest } from "../scripts/publish-update.mjs";
test("CI builds get monotonically increasing MSI-compatible versions", () => {
  assert.equal(ciVersion("0.2.0", 1), "0.2.1"); assert.equal(ciVersion("0.2.0", 2), "0.2.2");
  for (const value of [0, -1, "x", 65536]) assert.throws(() => ciVersion("0.2.0", value));
});
test("version changes update TUL Writer in both lockfiles without touching dependencies", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tul-writer-version-"));
  try {
    fs.mkdirSync(path.join(root, "src-tauri"));
    const files = {"package.json": {name:"tul-writer",version:"0.1.0"}, "package-lock.json": {version:"0.1.0",packages:{"":{version:"0.1.0"},"node_modules/other":{version:"9.9.9"}}},"src-tauri/tauri.conf.json":{version:"0.1.0"}};
    for (const [name,data] of Object.entries(files)) fs.writeFileSync(path.join(root,name),JSON.stringify(data));
    fs.writeFileSync(path.join(root,"src-tauri/Cargo.toml"),'[package]\nname = "tul-writer"\nversion = "0.1.0"\n');
    fs.writeFileSync(path.join(root,"src-tauri/Cargo.lock"),'[[package]]\nname = "other"\nversion = "9.9.9"\n[[package]]\nname = "tul-writer"\nversion = "0.1.0"\n');
    setVersion(root,"0.2.5");
    const lock=JSON.parse(fs.readFileSync(path.join(root,"package-lock.json")));
    assert.equal(lock.version,"0.2.5");assert.equal(lock.packages[""].version,"0.2.5");assert.equal(lock.packages["node_modules/other"].version,"9.9.9");
    const cargo=fs.readFileSync(path.join(root,"src-tauri/Cargo.lock"),"utf8");assert.match(cargo,/tul-writer"\nversion = "0.2.5"/);assert.match(cargo,/other"\nversion = "9.9.9"/);
  } finally {
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("tul-writer-version-"));
    fs.rmSync(root,{recursive:true,force:true});
  }
});
test("private manifests use authenticated API asset URLs for both installer types", () => {
  const release={tag_name:"v0.2.1",assets:[{id:1,name:"TUL Writer_0.2.1_x64-setup.exe",size:123},{id:2,name:"TUL Writer_0.2.1_x64.msi",size:456}]};
  const manifest=makeManifest(release,"0.2.1",()=>"signature","notes");
  assert.equal(manifest.platforms["windows-x86_64-nsis"].url,"https://api.github.com/repos/akabrt00/Word-LateX-atd./releases/assets/1");
  assert.equal(manifest.platforms["windows-x86_64-msi"].url.endsWith("/2"),true);
  assert.throws(()=>makeManifest(release,"0.2.2",()=>"signature","notes"));
  assert.throws(()=>makeManifest(release,"0.2.1",()=>"","notes"));
});
