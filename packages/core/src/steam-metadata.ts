const STEAM_CDN = "https://cdn.akamai.steamstatic.com";
const STEAM_API = "https://api.steampowered.com";

export function getSteamHeaderUrl(appId: string): string {
  return `${STEAM_CDN}/steam/apps/${appId}/header.jpg`;
}

export function getSteamAchievementIconUrl(appId: string, iconHash: string): string {
  return `${STEAM_CDN}/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

export function buildSteamApiUrl(
  appId: string,
  apiKey: string,
  language: string = "english",
): string {
  const params = new URLSearchParams({ key: apiKey, appid: appId, l: language, format: "json" });
  return `${STEAM_API}/ISteamUserStats/GetSchemaForGame/v0002/?${params.toString()}`;
}

export interface SteamAchievementSchema {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamGameSchema {
  gameName: string;
  gameVersion: string;
  availableGameStats?: {
    achievements?: SteamAchievementSchema[];
  };
}

export async function fetchSteamSchema(
  appId: string,
  apiKey: string,
  language?: string,
): Promise<SteamGameSchema | null> {
  if (!apiKey) return null;
  const url = buildSteamApiUrl(appId, apiKey, language);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = (await response.json()) as { game?: SteamGameSchema };
    return json.game ?? null;
  } catch {
    return null;
  }
}
