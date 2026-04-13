/**
 * Dev script: starts Vite dev server, builds main process with tsup, launches Electron.
 * Kills all children on exit.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const require_ = createRequire(resolve(root, "package.json"));

function bin(name) {
  const pkgPath = require_.resolve(`${name}/package.json`);
  const pkg = require_(pkgPath);
  const binEntry =
    typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.[name] ?? pkg.bin?.[Object.keys(pkg.bin)[0]];
  return resolve(dirname(pkgPath), binEntry);
}

const children = [];

function cleanup() {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  process.exit();
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// 1. Start Vite dev server
console.log("[dev] Starting Vite dev server...");
const vite = spawn("node", [bin("vite")], {
  cwd: root,
  stdio: "pipe",
  env: { ...process.env },
  shell: false,
});
children.push(vite);

vite.stderr.on("data", (data) => process.stderr.write(`[vite] ${data}`));

// 2. Wait for Vite to be ready, then build main + launch Electron
let viteReady = false;
let viteUrl = null;

vite.stdout.on("data", (data) => {
  process.stdout.write(`[vite] ${data}`);

  if (viteReady) return;

  // Strip ANSI escape codes for reliable parsing
  const text = data.toString().replace(/\x1B\[[0-9;]*m/g, "");

  // Extract the actual URL Vite is serving on (e.g. "Local:   http://localhost:5175/")
  const urlMatch = text.match(/Local:\s+(https?:\/\/[^\s/]+)/);
  if (urlMatch) {
    viteUrl = urlMatch[1].trim();
    viteReady = true;
    // Small delay to let Vite finish printing
    setTimeout(() => buildAndLaunch(), 300);
  }
});

function buildAndLaunch() {
  console.log(`[dev] Vite ready at ${viteUrl}. Building main process with tsup...`);

  const tsup = spawn("node", [bin("tsup")], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env },
    shell: false,
  });
  children.push(tsup);

  tsup.stdout.on("data", (data) => process.stdout.write(`[tsup] ${data}`));
  tsup.stderr.on("data", (data) => process.stderr.write(`[tsup] ${data}`));

  tsup.on("close", (code) => {
    if (code !== 0) {
      console.error(`[dev] tsup exited with code ${code}`);
      cleanup();
      return;
    }
    console.log("[dev] Main process built. Launching Electron...");
    launchElectron();
  });
}

function launchElectron() {
  const electronBin = require_("electron");

  const electron = spawn(electronBin, [root], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: viteUrl,
    },
    shell: false,
  });
  children.push(electron);

  electron.on("close", () => {
    console.log("[dev] Electron closed.");
    cleanup();
  });
}
