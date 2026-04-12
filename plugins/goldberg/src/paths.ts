import { join } from "node:path";

export function getGoldbergSavePaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];
  return [join(appData, "Goldberg SteamEmu Saves"), join(appData, "GSE Saves")];
}

export const GOLDBERG_SAVE_FILE = "achievements.json";
