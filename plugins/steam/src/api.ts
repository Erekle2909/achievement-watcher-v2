export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  img_icon_url: string;
}

interface GetOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamOwnedGame[];
  };
}

/**
 * Fetch ALL games owned by a Steam user via IPlayerService/GetOwnedGames.
 * Returns the full library — not just installed games.
 */
export async function fetchOwnedGames(apiKey: string, steamId: string): Promise<SteamOwnedGame[]> {
  const url =
    `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/` +
    `?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=1&include_played_free_games=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const json = (await response.json()) as GetOwnedGamesResponse;
    return json.response.games;
  } catch {
    return [];
  }
}

export interface SteamPlayerAchievement {
  apiname: string;
  /** 0 = locked, 1 = unlocked */
  achieved: number;
  /** Unix timestamp of unlock (0 if locked or unknown) */
  unlocktime: number;
}

interface GetPlayerAchievementsResponse {
  playerstats?: {
    success?: boolean;
    achievements?: SteamPlayerAchievement[];
  };
}

/**
 * Fetch a player's achievement data for a specific game from the Steam Web API.
 *
 * Uses the ISteamUserStats/GetPlayerAchievements/v0001 endpoint.
 * Returns null if the request fails, the game has no achievements,
 * or the player's profile is private.
 */
export async function fetchPlayerAchievements(
  appId: string,
  apiKey: string,
  steamId: string,
): Promise<SteamPlayerAchievement[] | null> {
  const url =
    `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/` +
    `?appid=${appId}&key=${apiKey}&steamid=${steamId}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const json = (await response.json()) as GetPlayerAchievementsResponse;

    if (!json.playerstats?.success) return null;
    return json.playerstats.achievements ?? null;
  } catch {
    return null;
  }
}
