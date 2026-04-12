import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // Placeholder methods - will be filled in as features are built
  getAppVersion: () => ipcRenderer.invoke("app:version"),

  // Navigation
  platform: process.platform,
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
