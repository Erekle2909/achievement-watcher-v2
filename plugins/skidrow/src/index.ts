import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseSkidrowSave } from "./parser.js";
import { getSkidrowSavePaths, SKIDROW_SAVE_FILE } from "./paths.js";

export const skidrowPlugin: AchievementPlugin = {
  id: "skidrow",
  name: "SKIDROW",
  source: "steam-emu",

  detectPaths() {
    return getSkidrowSavePaths();
  },

  detectGame(dirPath: string) {
    const dirName = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(dirName)) return Promise.resolve(false);
    return Promise.resolve(existsSync(join(dirPath, SKIDROW_SAVE_FILE)));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const result = await parseSkidrowSave(join(gamePath, SKIDROW_SAVE_FILE));
    if (!result.ok) return result as ParseResult<ParsedGame>;

    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, SKIDROW_SAVE_FILE)];
  },
};

export default skidrowPlugin;
