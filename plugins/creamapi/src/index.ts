import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseCreamApiSave } from "./parser.js";
import { getCreamApiSavePaths, CREAMAPI_SAVE_FILE } from "./paths.js";

export const creamApiPlugin: AchievementPlugin = {
  id: "creamapi",
  name: "CreamAPI",
  source: "steam-emu",

  detectPaths() {
    return getCreamApiSavePaths();
  },

  detectGame(dirPath: string) {
    const dirName = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(dirName)) return Promise.resolve(false);
    return Promise.resolve(existsSync(join(dirPath, CREAMAPI_SAVE_FILE)));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const result = await parseCreamApiSave(join(gamePath, CREAMAPI_SAVE_FILE));
    if (!result.ok) return result as ParseResult<ParsedGame>;

    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, CREAMAPI_SAVE_FILE)];
  },
};

export default creamApiPlugin;
