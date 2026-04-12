import { join } from "node:path";

export function getCreamApiSavePaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];
  return [join(appData, "CreamAPI")];
}

export const CREAMAPI_SAVE_FILE = "achievements.ini";
