import type {
  AchievementPlugin,
  ParseResult,
  ParsedGame,
  Achievement,
} from "@achievement-watcher/shared";
import { getSteamUserId } from "./steam-user.js";
import { fetchPlayerAchievements, fetchOwnedGames, type SteamOwnedGame } from "./api.js";

const STEAM_CDN = "https://cdn.akamai.steamstatic.com";

// Module-level config — set via configureSteamPlugin() or env vars
let configApiKey: string = "";
let configSteamId: string | null = null;

// Cache of owned games — fetched once per session
let ownedGamesCache: SteamOwnedGame[] | null = null;

async function getOwnedGames(): Promise<SteamOwnedGame[]> {
  if (ownedGamesCache) return ownedGamesCache;

  const key = configApiKey || process.env["STEAM_API_KEY"] || "";
  const userId = configSteamId || getSteamUserId();
  if (!key || !userId) return [];

  ownedGamesCache = await fetchOwnedGames(key, userId);
  return ownedGamesCache;
}

export const steamPlugin: AchievementPlugin = {
  id: "steam",
  name: "Steam",
  source: "native",

  detectPaths() {
    // Return one virtual path per owned Steam game.
    // Discovery will call detectGame() on each, then parse().
    // We use "steam://<appId>" as virtual paths since Steam games
    // aren't local directories — they're API-fetched.
    // NOTE: This is populated asynchronously on first call via ensureOwnedGames().
    // For the synchronous detectPaths(), we return cached results or empty.
    if (!ownedGamesCache) return ["steam://pending"];
    return ownedGamesCache
      .filter((g) => g.playtime_forever > 0)
      .map((g) => `steam://${String(g.appid)}`);
  },

  async detectGame(dirPath: string): Promise<boolean> {
    // Handle the "pending" sentinel — trigger the API fetch
    if (dirPath === "steam://pending") {
      await getOwnedGames();
      return false;
    }
    const appId = dirPath.replace("steam://", "");
    if (!/^\d+$/.test(appId)) return false;
    const games = await getOwnedGames();
    return games.some((g) => String(g.appid) === appId);
  },

  async parse(gamePath: string): Promise<ParseResult<ParsedGame>> {
    const appId = gamePath.replace("steam://", "").split(/[\\/]/).pop() ?? "";

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

    // Get game name from owned games cache
    const games = await getOwnedGames();
    const gameInfo = games.find((g) => String(g.appid) === appId);

    const achievements: Achievement[] = playerAchs.map((pa) => ({
      id: pa.apiname,
      name: pa.apiname,
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
        iconUrl: `${STEAM_CDN}/steam/apps/${appId}/header.jpg`,
        playtime: gameInfo ? gameInfo.playtime_forever * 60 : 0, // API returns minutes, we store seconds
      },
    };
  },

  watchPatterns(_gamePath: string) {
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

/**
 * Pre-fetch owned games so detectPaths() returns the full library.
 * Call this BEFORE engine.start() to ensure discovery finds all games.
 */
export async function prefetchSteamLibrary(): Promise<number> {
  const games = await getOwnedGames();
  return games.length;
}

export default steamPlugin;
