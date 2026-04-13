import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getSteamInstallPath } from "./paths.js";

/**
 * Read the most recently logged-in Steam user ID from loginusers.vdf.
 *
 * The VDF format looks like:
 * "users"
 * {
 *   "76561198012345678"
 *   {
 *     "AccountName"		"username"
 *     "MostRecent"		"1"
 *   }
 * }
 *
 * We find all 17-digit user IDs and return the one marked MostRecent=1,
 * falling back to the first ID if none is marked.
 */
export function getSteamUserId(): string | null {
  const steamPath = getSteamInstallPath();
  if (!steamPath) return null;

  const vdfPath = join(steamPath, "config", "loginusers.vdf");
  if (!existsSync(vdfPath)) return null;

  try {
    const content = readFileSync(vdfPath, "utf-8");
    return parseSteamUserIdFromVdf(content);
  } catch {
    return null;
  }
}

/**
 * Parse the most-recent Steam user ID from raw VDF content.
 * Exported separately so it can be tested without filesystem access.
 */
export function parseSteamUserIdFromVdf(content: string): string | null {
  // Collect all 17-digit Steam IDs in document order
  const userIds = [...content.matchAll(/"(\d{17})"/g)]
    .map((m) => m[1])
    .filter((id): id is string => id !== undefined);
  if (userIds.length === 0) return null;

  // Split content on user ID patterns so block[i+1] corresponds to userIds[i]
  const userBlocks = content.split(/"\d{17}"/);

  for (let i = 0; i < userIds.length; i++) {
    const block = userBlocks[i + 1] ?? "";
    if (block.includes('"MostRecent"') && block.includes('"1"')) {
      return userIds[i] ?? null;
    }
  }

  // Fallback: return the first user ID found
  return userIds[0] ?? null;
}
