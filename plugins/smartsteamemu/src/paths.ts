import { join } from "node:path";

export function getSSESavePaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];
  return [join(appData, "SmartSteamEmu")];
}

export const SSE_BIN_FILE = "stats.bin";
export const SSE_INI_FILE = "achievements.ini";
