// Real DOM regression without opening a desktop window or touching app settings.
import { createServer } from "vite";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const browser = process.env.TUL_WRITER_TEST_BROWSER || [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].find(existsSync);
if (!browser) throw new Error("Set TUL_WRITER_TEST_BROWSER to a Chromium browser executable.");
const scenario = process.argv[2] || "workspace-wizard";
if (!["workspace-wizard", "document-metadata", "document-workflow", "project-opening"].includes(scenario)) throw Error("Unknown browser scenario.");
const profile = await mkdtemp(join(tmpdir(), "tul-wizard-test-"));
const server = await createServer({
  configFile: false,
  cacheDir: join(profile, "vite-cache"),
  optimizeDeps: { noDiscovery: true, include: ["@tauri-apps/api/core", "@tauri-apps/plugin-dialog", "@tauri-apps/plugin-opener"] },
  server: { host: "127.0.0.1", port: 0, open: false },
  plugins: [{
    name: "metadata-editor-test-adapters",
    enforce: "pre",
    resolveId(source, importer) {
      const file = importer?.split("?")[0].replaceAll("\\", "/");
      if (scenario === "project-opening" && file?.endsWith("/src/project.ts") && !["@tauri-apps/api/core", "@tauri-apps/plugin-dialog", "./core", "./document-files", "./document-progress"].includes(source)) return resolve("tests/browser/project-opening-mocks.ts");
      if (file?.endsWith("/src/workspace.ts") && source === "./project") return resolve("tests/browser/workspace-opening-mocks.ts");
      if (file?.endsWith("/src/build.ts") && ["./editor", "./welcome", "./problems", "./project", "./settings", "./split", "./texindex", "./sidebar"].includes(source)) return resolve("tests/browser/workflow-mocks.ts");
      if (file?.endsWith("/src/preview.ts") && ["./appearance", "./darkpdf", "./editor", "./layout", "./project"].includes(source)) return resolve("tests/browser/workflow-mocks.ts");
      if (importer?.split("?")[0].replaceAll("\\", "/").endsWith("/src/document-metadata.ts") && ["./core", "./project", "./split"].includes(source)) {
        return resolve("tests/browser/metadata-editor-mocks.ts");
      }
    },
  }],
});
let child, socket, browserSocket;
let browserLog = "";
const connect = async url => {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(Error("Browser connection timed out.")); }, 5000);
    socket.onopen = () => { clearTimeout(timer); resolve(); };
    socket.onerror = error => { clearTimeout(timer); reject(Error(`Browser connection failed: ${url}: ${error.message || "WebSocket error"}`)); };
  });
  return socket;
};
try {
  await server.listen();
  const address = server.httpServer.address();
  const url = `http://127.0.0.1:${address.port}/tests/browser/${scenario}.html`;
  // Finish Vite's first HTML/inline-module transform before Chromium navigation.
  // On a busy Windows machine this cold transform can exceed the CDP command timeout.
  const warmed = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!warmed.ok) throw Error(`Test page could not be prepared: ${warmed.status}`);
  await warmed.text();
  child = spawn(browser, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--disable-background-networking",
    `--user-data-dir=${profile}`, "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1", "about:blank",
  ], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  child.stderr.on("data", chunk => { browserLog = (browserLog + chunk).slice(-4000); });
  child.on("error", error => { browserLog += String(error); });
  const deadline = Date.now() + 90000;
  let port, browserEndpoint;
  while (Date.now() < deadline) {
    try {
      const lines = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/);
      if (lines.length < 2) { await delay(100); continue; }
      [port, browserEndpoint] = lines;
      break;
    }
    catch { await delay(100); }
  }
  if (!port) throw Error(`Headless browser did not start: ${browserLog}`);
  const connectReady = async url => {
    let lastError;
    while (Date.now() < deadline) {
      try { return await connect(url); } catch (error) { lastError = error; await delay(100); }
    }
    throw lastError || Error("Browser protocol endpoint was not ready.");
  };
  browserSocket = await connectReady(`ws://127.0.0.1:${port}${browserEndpoint}`);
  let page;
  while (Date.now() < deadline) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) }).then(r => r.json());
      page = pages.find(page => page.type === "page" && page.url === "about:blank");
      if (page) break;
    } catch { /* The debugging endpoint can precede its initial page during startup. */ }
    await delay(100);
  }
  if (!page) throw Error("Headless test page was not found.");
  socket = await connectReady(page.webSocketDebuggerUrl);
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message); pending.delete(message.id);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(Error(`Browser command timed out: ${method}`)); }, 20000);
    pending.set(id, message => { clearTimeout(timer); resolve(message); });
    socket.send(JSON.stringify({ id, method, params }));
  });
  // Establish the protocol before navigation, so Chromium startup cannot race
  // the module loader and the first Runtime.evaluate command.
  await send("Page.enable");
  await send("Runtime.enable");
  const navigation = await send("Page.navigate", { url });
  if (navigation.error || navigation.result?.errorText) throw Error(JSON.stringify(navigation));
  let result;
  while (Date.now() < deadline) {
    const response = await send("Runtime.evaluate", { expression: 'document.getElementById("workspace-test-result")?.textContent', returnByValue: true });
    const value = response.result?.result?.value;
    if (value && value !== "pending") { result = JSON.parse(value); break; }
    await delay(100);
  }
  if (!result) throw Error(`Browser did not report a result: ${browserLog}`);
  if (!result.ok) throw new Error(result.error);
  console.log(`${scenario}: ${result.checks} browser checks passed.`);
  if (process.env.TUL_WRITER_TEST_SCREENSHOT === "1" && ["workspace-wizard", "document-workflow"].includes(scenario)) {
    await mkdir(resolve("output"), { recursive: true });
    await send("Emulation.setDeviceMetricsOverride", { width: 820, height: 620, deviceScaleFactor: 1, mobile: false });
    const prepared = await send("Runtime.evaluate", { awaitPromise: true, expression: `(async () => {
      const font = document.createElement("link"); font.rel="stylesheet"; font.href="/node_modules/@fontsource-variable/inter/index.css"; document.head.append(font);
      if (${JSON.stringify(scenario)} === "workspace-wizard") {
        await (await import("/src/workspace.ts")).showWorkspace(true);
        const name=document.getElementById("workspace-name"); name.value="Semestrální práce"; name.dispatchEvent(new Event("input"));
        document.getElementById("workspace-test-result").hidden=true;
      } else {
        (await import("/src/core.ts")).showLog("", "", false);
        document.getElementById("app").style.width="";
        const {createMenubar}=await import("/src/menubar.ts");
        createMenubar(document.getElementById("menubar"), ["Soubor","Edit","Insert","View","Kompilace","Review","Notes","Nápověda"].map(title=>({title,entries:[]})));
      }
      await document.fonts.ready;
    })()` });
    if (prepared.result?.exceptionDetails) throw Error(JSON.stringify(prepared.result.exceptionDetails));
    for (const mode of ["light", "dark"]) {
      const themed = await send("Runtime.evaluate", { awaitPromise: true, expression: `(async () => {
        const {applyTheme,BUILT_IN}=await import("/src/themes.ts"); applyTheme(BUILT_IN.find(theme=>theme.id==="tul-${mode}"));
        await new Promise(resolve=>setTimeout(resolve,500));
      })()` });
      if (themed.result?.exceptionDetails) throw Error(JSON.stringify(themed.result.exceptionDetails));
      const capture = await send("Page.captureScreenshot", { format: "png" });
      if (!capture.result?.data) throw Error("Browser screenshot was not captured.");
      await writeFile(resolve("output", `${scenario}-${mode}.png`), Buffer.from(capture.result.data, "base64"));
    }
  }
} catch (error) {
  throw new Error(`${error.stack || error}\nIsolated browser log:\n${browserLog}`);
} finally {
  socket?.close();
  // Close only the isolated test browser, including when navigation fails.
  if (browserSocket?.readyState === WebSocket.OPEN) {
    browserSocket.send(JSON.stringify({ id: 1, method: "Browser.close" }));
    await Promise.race([new Promise(resolve => browserSocket.onclose = resolve), delay(3000)]);
    browserSocket.close();
  }
  if (child && child.exitCode === null) { child.kill(); await delay(500); }
  await server.close();
  if (dirname(resolve(profile)) !== resolve(tmpdir()) || !basename(profile).startsWith("tul-wizard-test-")) {
    throw Error("Refusing to remove a path outside the temporary browser profile.");
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
