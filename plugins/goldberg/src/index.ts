import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseGoldbergSave } from "./parser.js";
import { getGoldbergSavePaths, GOLDBERG_SAVE_FILE } from "./paths.js";

export const goldbergPlugin: AchievementPlugin = {
  id: "goldberg",
  name: "Goldberg SteamEmu",
  source: "steam-emu",

  detectPaths() {
    return getGoldbergSavePaths();
  },

  detectGame(dirPath: string) {
    // The directory name must be a numeric Steam appId.
    // Non-numeric names (e.g. "CJSteam") are user-level directories
    // from some Goldberg builds and should not be treated as games.
    const dirName = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(dirName)) return Promise.resolve(false);
    return Promise.resolve(existsSync(join(dirPath, GOLDBERG_SAVE_FILE)));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const result = await parseGoldbergSave(join(gamePath, GOLDBERG_SAVE_FILE));
    if (!result.ok) return result as ParseResult<ParsedGame>;

    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, GOLDBERG_SAVE_FILE)];
  },
};

export default goldbergPlugin;
