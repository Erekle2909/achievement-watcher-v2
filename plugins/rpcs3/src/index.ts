import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { getRpcs3TrophyPaths } from "./paths.js";

export const rpcs3Plugin: AchievementPlugin = {
  id: "rpcs3",
  name: "RPCS3",
  source: "emulator",

  detectPaths() {
    return getRpcs3TrophyPaths();
  },

  detectGame(_dirPath: string) {
    return Promise.resolve(false);
  },

  parse(_gamePath: string): Promise<ParseResult<ParsedGame>> {
    return Promise.resolve({
      ok: false as const,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "RPCS3 trophy parsing requires binary .trp archive parsing, not yet implemented.",
      },
    });
  },

  watchPatterns(_gamePath: string) {
    return [];
  },
};

export default rpcs3Plugin;
