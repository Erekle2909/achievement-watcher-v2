import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { getSteamInstallPath } from "./paths.js";

export const steamPlugin: AchievementPlugin = {
  id: "steam",
  name: "Steam",
  source: "native",
  detectPaths() {
    const p = getSteamInstallPath();
    return p ? [p] : [];
  },
  detectGame(_dirPath: string) {
    return Promise.resolve(false);
  },
  parse(_gamePath: string): Promise<ParseResult<ParsedGame>> {
    return Promise.resolve({
      ok: false as const,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Steam native achievement parsing requires Steam client. Use emulator plugins.",
      },
    });
  },
  watchPatterns(_gamePath: string) {
    return [];
  },
};

export default steamPlugin;
