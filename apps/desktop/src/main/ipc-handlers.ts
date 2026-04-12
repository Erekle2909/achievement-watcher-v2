import { ipcMain, app } from "electron";

// These will import from the engine when it's wired up in main process
// For now, return mock/placeholder data

export function registerIpcHandlers() {
  ipcMain.handle("app:version", () => app.getVersion());

  ipcMain.handle("games:getAll", () => {
    // TODO: Wire to engine.getGames() when engine is initialized in main
    return [];
  });

  ipcMain.handle("games:getDetails", (_event, _id: string) => {
    return null;
  });

  ipcMain.handle("games:rescan", () => {
    // TODO: Wire to engine.rescan()
  });

  ipcMain.handle("achievements:getByGame", (_event, _gameId: string) => {
    return [];
  });

  ipcMain.handle("achievements:getRecent", (_event, _limit: number) => {
    return [];
  });

  ipcMain.handle("settings:getAll", () => {
    // TODO: Wire to settingsQueries
    return {};
  });

  ipcMain.handle("settings:update", (_event, _patch: Record<string, unknown>) => {
    // TODO: Wire to settingsQueries
  });

  ipcMain.handle("plugins:getAll", () => {
    return [];
  });

  ipcMain.handle("plugins:toggle", (_event, _id: string, _enabled: boolean) => {
    // TODO: Wire to plugin registry
  });
}
