import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { getRetroArchCheevosPaths } from "./paths.js";

export const retroArchPlugin: AchievementPlugin = {
  id: "retroarch",
  name: "RetroArch",
  source: "emulator",

  detectPaths() {
    return getRetroArchCheevosPaths();
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
          "RetroArch achievement parsing via RetroAchievements.org API is not yet implemented.",
      },
    });
  },

  watchPatterns(_gamePath: string) {
    return [];
  },
};

export default retroArchPlugin;
