import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseAli213Save } from "./parser.js";
import { getAli213SavePaths, ALI213_SAVE_FILE } from "./paths.js";

export const ali213Plugin: AchievementPlugin = {
  id: "ali213",
  name: "ALI213",
  source: "steam-emu",

  detectPaths() {
    return getAli213SavePaths();
  },

  detectGame(dirPath: string) {
    return Promise.resolve(existsSync(join(dirPath, ALI213_SAVE_FILE)));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const result = await parseAli213Save(join(gamePath, ALI213_SAVE_FILE));
    if (!result.ok) return result as ParseResult<ParsedGame>;

    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, ALI213_SAVE_FILE)];
  },
};

export default ali213Plugin;
