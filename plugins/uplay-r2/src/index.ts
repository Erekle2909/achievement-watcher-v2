import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { getUplayR2SavePaths } from "./paths.js";

export const uplayR2Plugin: AchievementPlugin = {
  id: "uplay-r2",
  name: "Uplay R2",
  source: "ubisoft-emu",

  detectPaths() {
    return getUplayR2SavePaths();
  },

  detectGame(_dirPath: string) {
    return Promise.resolve(false);
  },

  parse(_gamePath: string): Promise<ParseResult<ParsedGame>> {
    return Promise.resolve({
      ok: false as const,
      error: {
        code: "NOT_IMPLEMENTED",
        message:
          "Uplay R2 achievement parsing requires binary save file parsing, not yet implemented.",
      },
    });
  },

  watchPatterns(_gamePath: string) {
    return [];
  },
};

export default uplayR2Plugin;
