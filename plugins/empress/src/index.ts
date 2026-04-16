import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { parseEmpressSave } from "./parser.js";
import { getEmpressSavePaths, getEmpressSaveFile } from "./paths.js";

export const empressPlugin: AchievementPlugin = {
  id: "empress",
  name: "EMPRESS",
  source: "steam-emu",

  detectPaths() {
    return getEmpressSavePaths();
  },

  detectGame(dirPath: string) {
    const appId = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(appId)) return Promise.resolve(false);
    return Promise.resolve(existsSync(join(dirPath, getEmpressSaveFile(appId))));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";
    const saveFile = join(gamePath, getEmpressSaveFile(appId));
    const result = await parseEmpressSave(saveFile);
    if (!result.ok) return result as ParseResult<ParsedGame>;

    return { ok: true, data: { appId, name: appId, achievements: result.data } };
  },

  watchPatterns(gamePath: string) {
    const appId = gamePath.split(/[\\/]/).pop() ?? "";
    return [join(gamePath, getEmpressSaveFile(appId))];
  },
};

export default empressPlugin;
