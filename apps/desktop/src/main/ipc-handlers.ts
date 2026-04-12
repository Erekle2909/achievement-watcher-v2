import { ipcMain, app } from "electron";

export function registerIpcHandlers() {
  ipcMain.handle("app:version", () => app.getVersion());
}
