import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { getUplayR1SavePaths } from "./paths.js";

export const uplayR1Plugin: AchievementPlugin = {
  id: "uplay-r1",
  name: "Uplay R1",
  source: "ubisoft-emu",

  detectPaths() {
    return getUplayR1SavePaths();
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
          "Uplay R1 achievement parsing requires binary save file parsing, not yet implemented.",
      },
    });
  },

  watchPatterns(_gamePath: string) {
    return [];
  },
};

export default uplayR1Plugin;
