import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // App
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  platform: process.platform,

  // Games
  getGames: () => ipcRenderer.invoke("games:getAll"),
  getGameDetails: (id: string) => ipcRenderer.invoke("games:getDetails", id),
  rescanGames: () => ipcRenderer.invoke("games:rescan"),

  // Achievements
  getAchievements: (gameId: string) => ipcRenderer.invoke("achievements:getByGame", gameId),
  getRecentUnlocks: (limit: number) => ipcRenderer.invoke("achievements:getRecent", limit),

  // Settings
  getSettings: () => ipcRenderer.invoke("settings:getAll"),
  updateSettings: (patch: Record<string, unknown>) => ipcRenderer.invoke("settings:update", patch),

  // Plugins
  getPlugins: () => ipcRenderer.invoke("plugins:getAll"),
  togglePlugin: (id: string, enabled: boolean) => ipcRenderer.invoke("plugins:toggle", id, enabled),

  // Events
  onAchievementUnlocked: (callback: (...args: unknown[]) => void) => {
    ipcRenderer.on("achievement:unlocked", (_event, data) => {
      callback(data);
    });
  },
  onScanComplete: (callback: (...args: unknown[]) => void) => {
    ipcRenderer.on("scan:complete", (_event, data) => {
      callback(data);
    });
  },
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
