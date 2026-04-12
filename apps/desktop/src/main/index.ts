import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { registerIpcHandlers } from "./ipc-handlers.js";

let mainWindow: BrowserWindow | null = null;

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
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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

registerIpcHandlers();

void app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
