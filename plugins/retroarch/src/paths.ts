import { join } from "node:path";
import { existsSync } from "node:fs";

export function getRetroArchCheevosPaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];

  const cheevosPath = join(appData, "RetroArch", "cheevos");
  return existsSync(cheevosPath) ? [cheevosPath] : [];
}
