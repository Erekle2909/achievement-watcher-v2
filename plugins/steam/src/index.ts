import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AchievementPlugin,
  ParseResult,
  ParsedGame,
  Achievement,
} from "@achievement-watcher/shared";
import { getSteamInstallPath } from "./paths.js";
import { getSteamUserId } from "./steam-user.js";
import { getInstalledSteamGames } from "./game-discovery.js";
import { fetchPlayerAchievements } from "./api.js";

// Module-level config — set via configureSteamPlugin() or env vars
let configApiKey: string = "";
let configSteamId: string | null = null;

export const steamPlugin: AchievementPlugin = {
  id: "steam",
  name: "Steam",
  source: "native",

  detectPaths() {
    const steamPath = getSteamInstallPath();
    if (!steamPath) return [];

    // Return one path per installed game. Each path is
    // <steamapps>/<appId> so the discovery service can iterate them
    // directly (it falls back to treating base paths as game dirs
    // when they have no subdirectories).
    const games = getInstalledSteamGames();
    return games.map((g) => join(steamPath, "steamapps", g.appId));
  },

  detectGame(dirPath: string): Promise<boolean> {
    // The "directory" is steamapps/<appId> — extract the appId
    const appId = dirPath.split(/[\\/]/).pop() ?? "";
    if (!/^\d+$/.test(appId)) return Promise.resolve(false);

    const steamPath = getSteamInstallPath();
    if (!steamPath) return Promise.resolve(false);

    const manifestPath = join(steamPath, "steamapps", `appmanifest_${appId}.acf`);
    return Promise.resolve(existsSync(manifestPath));
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const appId = gamePath.split(/[\\/]/).pop() ?? "";

    // Resolve API key: explicit config > environment variable
    const key = configApiKey || process.env["STEAM_API_KEY"] || "";
    if (!key) {
      return {
        ok: false,
        error: {
          code: "NO_API_KEY",
          message: "Steam Web API key is required. Set it in Settings > Steam API Key.",
        },
      };
    }

    // Resolve Steam user ID: explicit config > VDF auto-detection
    const userId = configSteamId || getSteamUserId();
    if (!userId) {
      return {
        ok: false,
        error: {
          code: "NO_STEAM_USER",
          message:
            "Could not detect Steam user ID. Make sure Steam is installed and you are logged in.",
        },
      };
    }

    // Fetch player achievements from the Steam Web API
    const playerAchs = await fetchPlayerAchievements(appId, key, userId);
    if (!playerAchs) {
      return {
        ok: false,
        error: {
          code: "API_ERROR",
          message: `Failed to fetch achievements for app ${appId}. The game may not have achievements or the profile may be private.`,
        },
      };
    }

    // Look up the game name from the installed manifests
    const games = getInstalledSteamGames();
    const gameInfo = games.find((g) => g.appId === appId);

    const achievements: Achievement[] = playerAchs.map((pa) => ({
      id: pa.apiname,
      name: pa.apiname, // Will be enriched by the metadata service
      description: "",
      icon: "",
      unlocked: pa.achieved === 1,
      unlockTime: pa.achieved === 1 && pa.unlocktime > 0 ? pa.unlocktime : undefined,
    }));

    return {
      ok: true,
      data: {
        appId,
        name: gameInfo?.name ?? appId,
        achievements,
      },
    };
  },

  watchPatterns(_gamePath: string) {
    // Steam achievements are fetched via the Web API — there are no
    // local files to watch. The engine polls periodically via rescan.
    return [];
  },
};

/**
 * Configure the Steam plugin with API credentials.
 * Call this before using the plugin (typically at app startup).
 */
export function configureSteamPlugin(config: { apiKey?: string; steamId?: string }) {
  if (config.apiKey !== undefined) configApiKey = config.apiKey;
  if (config.steamId !== undefined) configSteamId = config.steamId;
}

export default steamPlugin;
