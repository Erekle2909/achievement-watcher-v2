interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function getElectronAPI(): ElectronAPI | null {
  return window.electronAPI ?? null;
}
