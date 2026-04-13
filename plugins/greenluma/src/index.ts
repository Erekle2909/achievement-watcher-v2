import type {
  AchievementPlugin,
  ParseResult,
  ParsedGame,
  Achievement,
} from "@achievement-watcher/shared";
import { readRegistryValues } from "./registry.js";
import { GL_REGISTRY_PATHS } from "./paths.js";

export const greenlumaPlugin: AchievementPlugin = {
  id: "greenluma",
  name: "GreenLuma",
  source: "steam-emu",

  detectPaths() {
    // Return the HKCU-relative base paths for both GL variants
    return GL_REGISTRY_PATHS.map((p) => `HKCU\\${p}`);
  },

  async detectGame(dirPath: string) {
    // dirPath is a registry path like "HKCU\SOFTWARE\GLR\AppID\570"
    // Strip the HKCU\ prefix to pass to readRegistryValues
    const hkcuRelative = dirPath.replace(/^HKCU\\/i, "");
    const values = await readRegistryValues(`${hkcuRelative}\\Achievements`);
    return Object.keys(values).length > 0;
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const hkcuRelative = gamePath.replace(/^HKCU\\/i, "");
    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    const values = await readRegistryValues(`${hkcuRelative}\\Achievements`);

    const achievements: Achievement[] = [];
    for (const [key, val] of Object.entries(values)) {
      // Skip time entries — they are handled alongside their achievement
      if (key.endsWith("_Time")) continue;

      achievements.push({
        id: key,
        name: key,
        description: "",
        icon: "",
        unlocked: val === "1",
        unlockTime:
          val === "1" && values[`${key}_Time`]
            ? parseInt(values[`${key}_Time`] ?? "0", 10)
            : undefined,
      });
    }

    return { ok: true, data: { appId, name: appId, achievements } };
  },

  // Registry changes cannot be watched via file patterns
  watchPatterns() {
    return [];
  },
};

export default greenlumaPlugin;
