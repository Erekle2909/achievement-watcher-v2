import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { createDatabase, initializeDatabase, settingsQueries } from "@achievement-watcher/db";
import { createPluginRegistry, createAchievementEngine } from "@achievement-watcher/core";
import { DEFAULT_SETTINGS } from "@achievement-watcher/shared";
import { goldbergPlugin } from "@achievement-watcher/plugin-goldberg";
import { codexPlugin } from "@achievement-watcher/plugin-codex";
import { empressPlugin } from "@achievement-watcher/plugin-empress";
import { skidrowPlugin } from "@achievement-watcher/plugin-skidrow";
import { ali213Plugin } from "@achievement-watcher/plugin-ali213";
import { creamApiPlugin } from "@achievement-watcher/plugin-creamapi";
import { steamPlugin } from "@achievement-watcher/plugin-steam";
import { retroArchPlugin } from "@achievement-watcher/plugin-retroarch";
import { rpcs3Plugin } from "@achievement-watcher/plugin-rpcs3";
import { uplayR1Plugin } from "@achievement-watcher/plugin-uplay-r1";
import { uplayR2Plugin } from "@achievement-watcher/plugin-uplay-r2";
import { registerIpcHandlers } from "./ipc-handlers.js";
import { showOverlay } from "./overlay.js";

let mainWindow: BrowserWindow | null = null;

// ── Database ──────────────────────────────────────────────────────
const dbPath = join(app.getPath("userData"), "achievements.db");
const db = createDatabase(dbPath);

// Create tables on first run (idempotent)
initializeDatabase(db.raw);

// ── Settings queries ──────────────────────────────────────────────
const sq = settingsQueries(db.drizzle);

// ── Plugin registry ───────────────────────────────────────────────
const registry = createPluginRegistry();
registry.register(goldbergPlugin);
registry.register(codexPlugin);
registry.register(empressPlugin);
registry.register(skidrowPlugin);
registry.register(ali213Plugin);
registry.register(creamApiPlugin);
registry.register(steamPlugin);
registry.register(retroArchPlugin);
registry.register(rpcs3Plugin);
registry.register(uplayR1Plugin);
registry.register(uplayR2Plugin);

// ── Engine ────────────────────────────────────────────────────────
const engine = createAchievementEngine({ registry, db });

// ── IPC handlers (use real DB + engine) ───────────────────────────
registerIpcHandlers(db, engine, registry);

// ── Window creation ───────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Achievement Watcher",
    backgroundColor: "#0f0f0f",
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // sandbox must be off for native modules (better-sqlite3)
    },
  });

  // In dev, load from Vite dev server
  if (process.env["VITE_DEV_SERVER_URL"]) {
    void mainWindow.loadURL(process.env["VITE_DEV_SERVER_URL"]);
  } else {
    // In production, load the built files
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── Forward engine events to renderer ─────────────────────────────
engine.eventBus.on("achievement:unlocked", (data) => {
  mainWindow?.webContents.send("achievement:unlocked", data);

  // Read overlay settings from DB; fall back to defaults
  const overlayEnabledRaw = sq.get("notifications.overlay");
  const overlayEnabled =
    overlayEnabledRaw !== undefined
      ? overlayEnabledRaw === "true"
      : DEFAULT_SETTINGS.notifications.enabled.overlay;

  if (overlayEnabled) {
    const durationRaw = sq.get("notifications.overlayDuration");
    const duration =
      durationRaw !== undefined
        ? Number(durationRaw)
        : DEFAULT_SETTINGS.notifications.overlayDuration;

    showOverlay({
      achievementName: data.achievement.name,
      gameName: data.game.name,
      duration,
    });
  }
});

engine.eventBus.on("scan:completed", (data) => {
  mainWindow?.webContents.send("scan:complete", data);
});

// ── App lifecycle ─────────────────────────────────────────────────
void app.whenReady().then(async () => {
  createWindow();

  try {
    await engine.start();
  } catch (err) {
    console.error("[engine] Failed to start:", err);
  }
});

app.on("window-all-closed", () => {
  engine.stop();
  app.quit();
});
