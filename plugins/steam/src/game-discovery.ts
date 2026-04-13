import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getSteamInstallPath } from "./paths.js";

export interface SteamApp {
  appId: string;
  name: string;
  installDir: string;
}

/**
 * Scan Steam's steamapps directory for appmanifest_*.acf files.
 * Each manifest represents an installed game with its appId, name, and install directory.
 */
export function getInstalledSteamGames(): SteamApp[] {
  const steamPath = getSteamInstallPath();
  if (!steamPath) return [];

  const steamAppsDir = join(steamPath, "steamapps");
  return scanSteamAppsDir(steamAppsDir);
}

/**
 * Scan a specific steamapps directory for appmanifest files.
 * Exported separately for testability.
 */
export function scanSteamAppsDir(steamAppsDir: string): SteamApp[] {
  const games: SteamApp[] = [];

  try {
    const files = readdirSync(steamAppsDir);
    for (const file of files) {
      if (!file.startsWith("appmanifest_") || !file.endsWith(".acf")) continue;

      try {
        const content = readFileSync(join(steamAppsDir, file), "utf-8");
        const appId = extractVdfValue(content, "appid");
        const name = extractVdfValue(content, "name");
        const installDir = extractVdfValue(content, "installdir");

        if (appId && name) {
          games.push({ appId, name, installDir: installDir ?? "" });
        }
      } catch {
        // Skip unreadable manifest files
        continue;
      }
    }
  } catch {
    // steamapps directory doesn't exist or can't be read
  }

  return games;
}

/**
 * Extract a value from Valve's VDF/ACF key-value format.
 * Format: "key"		"value"  (with variable whitespace between)
 */
export function extractVdfValue(content: string, key: string): string | null {
  const regex = new RegExp(`"${key}"\\s+"([^"]*)"`, "i");
  const match = content.match(regex);
  return match?.[1] ?? null;
}
