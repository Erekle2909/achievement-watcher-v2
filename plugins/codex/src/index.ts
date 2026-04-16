import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseCodexSave } from "./parser.js";
import { getCodexSavePaths, CODEX_SAVE_FILE } from "./paths.js";

export const codexPlugin: AchievementPlugin = {
  id: "codex",
  name: "CODEX",
  source: "steam-emu",

  detectPaths() {
    return getCodexSavePaths();
  },

  detectGame(dirPath: string) {
    const dirName = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(dirName)) return Promise.resolve(false);
    return Promise.resolve(existsSync(join(dirPath, CODEX_SAVE_FILE)));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const result = await parseCodexSave(join(gamePath, CODEX_SAVE_FILE));
    if (!result.ok) return result as ParseResult<ParsedGame>;

    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, CODEX_SAVE_FILE)];
  },
};

export default codexPlugin;
