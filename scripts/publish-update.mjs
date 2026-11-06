// Runs only in the trusted main-branch Windows workflow. Never publishes to a public repository.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const REPO = "akabrt00/Word-LateX-atd.";
const API = `https://api.github.com/repos/${REPO}/releases/assets/`;

// GitHub normalizes spaces in these ASCII installer filenames to dots on upload.
export function signaturePath(files, assetName) {
  const matches = files.filter(file => path.basename(file).replaceAll(" ", ".") === assetName + ".sig");
  if (matches.length !== 1) throw new Error("Missing or ambiguous installer signature: " + assetName);
  return matches[0];
}
export function isCurrentInstaller(name, version) {
  return name.replaceAll(" ", ".").startsWith(`TUL.Writer_${version}_`) && /\.(exe|msi)(\.sig)?$/.test(name);
}

export function makeManifest(release, version, signatureFor, notes, date = new Date().toISOString()) {
  if (release.tag_name !== `v${version}`) throw new Error("Release version mismatch");
  const platforms = {};
  for (const [suffix, target] of [["-setup.exe", "windows-x86_64-nsis"], [".msi", "windows-x86_64-msi"]]) {
    const candidates = release.assets.filter(a => a.name.endsWith(suffix));
    if (candidates.length !== 1) throw new Error("Expected one installer for " + target);
    const asset = candidates[0];
    if (!Number.isSafeInteger(asset.id) || asset.id <= 0 || asset.size <= 0 || asset.size > 250 * 1024 * 1024)
      throw new Error("Invalid release asset");
    const signature = signatureFor(asset.name).trim();
    if (!signature) throw new Error("Missing installer signature");
    platforms[target] = { url: API + asset.id, signature };
  }
  platforms["windows-x86_64"] = platforms["windows-x86_64-nsis"];
  return { version, notes, pub_date: date, platforms };
}
function github(args) { return execFileSync("gh", args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }).trim(); }
export function publish() {
  if (process.env.GITHUB_REPOSITORY !== REPO || process.env.GITHUB_REF !== "refs/heads/main")
    throw new Error("Updates can only be published from the configured main branch");
  const repository = JSON.parse(github(["api", `repos/${REPO}`]));
  if (repository.private !== true) throw new Error("Public release requires a separate explicit decision");
  const head = github(["api", `repos/${REPO}/branches/main`, "--jq", ".commit.sha"]);
  if (head !== process.env.GITHUB_SHA) { console.log("Newer main commit exists; skip outdated publication."); return; }
  const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
  const tag = `v${version}`;
  const notes = `Automatické soukromé sestavení TUL Writeru.\nZdrojový commit: ${process.env.GITHUB_SHA}\nBalíčky mají podpis TUL Writeru svázaný s verzí.`;
  const existing = JSON.parse(github(["api", `repos/${REPO}/releases`, "--paginate", "--slurp"])).flat().find(r => r.tag_name === tag);
  if (existing && !existing.draft) {
    if (existing.target_commitish !== process.env.GITHUB_SHA) throw new Error("Published version already exists for another commit");
    console.log("This version has already been published; do not replace its artifacts."); return;
  }
  if (!existing) github(["release", "create", tag, "--repo", REPO, "--draft", "--target", process.env.GITHUB_SHA, "--title", `TUL Writer ${version}`, "--notes", notes]);
  const bundle = "src-tauri/target/release/bundle";
  const files = ["nsis", "msi"].flatMap(dir => fs.readdirSync(path.join(bundle, dir)).filter(name => isCurrentInstaller(name, version)).map(name => path.join(bundle, dir, name)));
  if (files.length !== 4) throw new Error("Expected two installers and two signatures");
  github(["release", "upload", tag, ...files, "--repo", REPO, "--clobber"]);
  // Draft tags may not resolve through /releases/tags until publication.
  const draft = JSON.parse(github(["api", `repos/${REPO}/releases`, "--paginate", "--slurp"])).flat().find(r => r.tag_name === tag);
  if (!draft?.draft || draft.target_commitish !== process.env.GITHUB_SHA) throw new Error("Release draft provenance changed");
  const release = JSON.parse(github(["api", `repos/${REPO}/releases/${draft.id}`]));
  const manifest = makeManifest(release, version, name => fs.readFileSync(signaturePath(files, name), "utf8"), notes);
  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync("output/latest.json", JSON.stringify(manifest, null, 2) + "\n");
  github(["release", "upload", tag, "output/latest.json", "--repo", REPO, "--clobber"]);
  github(["release", "edit", tag, "--repo", REPO, "--draft=false", "--latest"]);
  console.log(`Private update ${tag} published with signed installers and latest.json.`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) publish();
