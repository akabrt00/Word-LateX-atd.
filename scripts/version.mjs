#!/usr/bin/env node
// Sets the app's version everywhere it is written: package.json, tauri.conf.json, Cargo.toml and
// Cargo.lock. Then add the version's section to CHANGELOG.md, commit, and tag it vX.Y.Z.
//
//   node scripts/version.mjs 0.2.0
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function ciVersion(base, runNumber) {
  const parts = /^(\d+)\.(\d+)\.\d+$/.exec(base);
  if (!parts || !/^[1-9]\d*$/.test(String(runNumber)) || Number(runNumber) > 65535)
    throw new Error("Invalid CI version or Windows MSI run number");
  return `${parts[1]}.${parts[2]}.${runNumber}`;
}
export function setVersion(root, version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error("Invalid version");
  const read = name => fs.readFileSync(path.join(root, name), "utf8");
  const writes = new Map();
  for (const name of ["package.json", "package-lock.json", "src-tauri/tauri.conf.json"]) {
    const value = JSON.parse(read(name)); value.version = version;
    if (name === "package-lock.json") value.packages[""].version = version;
    writes.set(name, JSON.stringify(value, null, 2) + "\n");
  }
  writes.set("src-tauri/Cargo.toml", read("src-tauri/Cargo.toml").replace(/^version = "[^"]+"/m, `version = "${version}"`));
  const cargo = read("src-tauri/Cargo.lock");
  const app = /(\[\[package\]\]\r?\nname = "tul-writer"\r?\nversion = )"[^"]+"/;
  if (!app.test(cargo)) throw new Error("TUL Writer package missing from Cargo.lock");
  writes.set("src-tauri/Cargo.lock", cargo.replace(app, `$1"${version}"`));
  for (const [name, value] of writes) fs.writeFileSync(path.join(root, name), value);
  return version;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const version = process.argv[2] === "--ci"
    ? ciVersion(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version, process.argv[3])
    : process.argv[2];
  setVersion(root, version);
  console.log(`Version ${version} set in all package files.`);
}
