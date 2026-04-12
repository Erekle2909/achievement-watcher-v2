export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  platform: string;

  getGames: () => Promise<unknown[]>;
  getGameDetails: (id: string) => Promise<unknown>;
  rescanGames: () => Promise<void>;

  getAchievements: (gameId: string) => Promise<unknown[]>;
  getRecentUnlocks: (limit: number) => Promise<unknown[]>;

  getSettings: () => Promise<Record<string, unknown>>;
  updateSettings: (patch: Record<string, unknown>) => Promise<void>;

  getPlugins: () => Promise<unknown[]>;
  togglePlugin: (id: string, enabled: boolean) => Promise<void>;

  onAchievementUnlocked: (callback: (data: unknown) => void) => void;
  onScanComplete: (callback: (data: unknown) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export function getElectronAPI(): ElectronAPI | null {
  return window.electronAPI ?? null;
}
