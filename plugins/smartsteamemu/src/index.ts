import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type {
  AchievementPlugin,
  ParseResult,
  ParsedGame,
  Achievement,
} from "@achievement-watcher/shared";
import { parseSSEBinary, parseAchievementIni } from "@achievement-watcher/core";
import { getSSESavePaths, SSE_BIN_FILE, SSE_INI_FILE } from "./paths.js";

export const smartSteamEmuPlugin: AchievementPlugin = {
  id: "smartsteamemu",
  name: "SmartSteamEmu",
  source: "steam-emu",

  detectPaths() {
    return getSSESavePaths();
  },

  detectGame(dirPath: string) {
    const dirName = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(dirName)) return Promise.resolve(false);
    return Promise.resolve(
      existsSync(join(dirPath, SSE_BIN_FILE)) || existsSync(join(dirPath, SSE_INI_FILE)),
    );
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const binPath = join(gamePath, SSE_BIN_FILE);
    const iniPath = join(gamePath, SSE_INI_FILE);
    const appId = gamePath.split(/[\\/]/).pop() ?? "unknown";

    if (existsSync(binPath)) {
      try {
        const entries = parseSSEBinary(binPath);
        const achievements: Achievement[] = entries.map((e) => ({
          id: e.crc,
          name: e.crc, // enriched later by metadata
          description: "",
          icon: "",
          unlocked: e.achieved,
          unlockTime: e.achieved && e.unlockTime > 0 ? e.unlockTime : undefined,
        }));
        return { ok: true, data: { appId, name: appId, achievements } };
      } catch (err) {
        return { ok: false, error: { code: "PARSE_ERROR", message: String(err) } };
      }
    }

    if (existsSync(iniPath)) {
      try {
        const raw = await readFile(iniPath, "utf-8");
        const sections = parseAchievementIni(raw);
        const achievements: Achievement[] = [];

        for (const [name, fields] of sections) {
          if (name === "SteamAchievements") continue;
          const unlocked = fields["Achieved"] === "1";
          const unlockTimeRaw = parseInt(fields["UnlockTime"] ?? "0", 10);
          achievements.push({
            id: name,
            name,
            description: "",
            icon: "",
            unlocked,
            unlockTime: unlocked && unlockTimeRaw > 0 ? unlockTimeRaw : undefined,
          });
        }

        return { ok: true, data: { appId, name: appId, achievements } };
      } catch (err) {
        return { ok: false, error: { code: "PARSE_ERROR", message: String(err) } };
      }
    }

    return {
      ok: false,
      error: { code: "NO_DATA", message: "No stats.bin or achievements.ini found" },
    };
  },

  watchPatterns(gamePath: string) {
    return [join(gamePath, SSE_BIN_FILE), join(gamePath, SSE_INI_FILE)];
  },
};

export default smartSteamEmuPlugin;
