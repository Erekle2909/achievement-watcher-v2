import { join } from "node:path";

export function getAli213SavePaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];
  return [join(appData, "ALI213")];
}

export const ALI213_SAVE_FILE = "achievements.ini";
