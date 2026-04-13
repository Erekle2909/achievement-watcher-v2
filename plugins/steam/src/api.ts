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
