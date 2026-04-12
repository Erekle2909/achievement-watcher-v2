import { join } from "node:path";
import { existsSync } from "node:fs";

export function getUplayR2SavePaths(): string[] {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return [];

  const basePath = join(localAppData, "Ubisoft Game Launcher", "savegames");
  return existsSync(basePath) ? [basePath] : [];
}
