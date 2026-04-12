import { join } from "node:path";
import { existsSync } from "node:fs";

export function getSteamInstallPath(): string | null {
  const candidates = [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
    join(process.env.LOCALAPPDATA ?? "", "Steam"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}
