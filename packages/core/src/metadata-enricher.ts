import {
  fetchSteamSchema,
  getSteamHeaderUrl,
  getSteamAchievementIconUrl,
} from "./steam-metadata.js";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import type { MetadataCache } from "./metadata-cache.js";

type DB = Parameters<typeof gameQueries>[0];

interface StoreInfo {
  name: string | null;
  headerImage: string | null;
}

/**
 * Fetch the real public game name AND header image from the Steam Store API.
 * More reliable than GetSchemaForGame which sometimes returns internal names.
 * Also gets the correct header image URL (new games use store_item_assets path).
 */
async function fetchStoreInfo(appId: string): Promise<StoreInfo> {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const res = await fetch(url);
    if (!res.ok) return { name: null, headerImage: null };
    const json = (await res.json()) as Record<
      string,
      { success: boolean; data?: { name: string; header_image: string } }
    >;
    const entry = json[appId];
    if (!entry?.success) return { name: null, headerImage: null };
    return {
      name: entry.data?.name ?? null,
      headerImage: entry.data?.header_image ?? null,
    };
  } catch {
    return { name: null, headerImage: null };
  }
}

export interface MetadataEnricher {
  enrichGame(appId: string, gameId: string, db: DB): Promise<void>;
}

export function createMetadataEnricher(cache: MetadataCache, apiKey: string): MetadataEnricher {
  return {
    async enrichGame(appId, gameId, db) {
      console.log(`[enricher] Enriching appId=${appId} gameId=${gameId}`);
      // Try cache first
      let schema = cache.get(appId);

      // Fetch from API if not cached and a key is available
      if (!schema && apiKey) {
        schema = await fetchSteamSchema(appId, apiKey);
        if (schema) {
          cache.set(appId, schema);
        }
      }

      if (!schema?.availableGameStats?.achievements) {
        console.log(`[enricher] No achievements in schema for ${appId}`);
        return;
      }
      console.log(
        `[enricher] Schema has ${String(schema.availableGameStats.achievements.length)} achievements for ${appId}`,
      );

      // Update game header icon and name.
      // GetSchemaForGame sometimes returns internal names (e.g. "CJSteam", "game_EN").
      // Steam Store API provides real public name AND correct header image URL.
      const gq = gameQueries(db);
      const existing = gq.getById(gameId);
      if (existing) {
        // Always fetch store info for the real header image (new games use different CDN paths)
        const storeInfo = await fetchStoreInfo(appId);
        let gameName = existing.name;
        if (existing.name === existing.appId || /^[A-Z][a-z]+[A-Z]/.test(existing.name)) {
          gameName = storeInfo.name ?? schema.gameName;
        }
        gq.upsert({
          ...existing,
          name: gameName,
          iconUrl: storeInfo.headerImage ?? getSteamHeaderUrl(appId),
        });
      }

      // Update achievement display metadata from schema
      const aq = achievementQueries(db);
      const achievements = aq.getByGameId(gameId);

      for (const ach of achievements) {
        const schemaEntry = schema.availableGameStats.achievements.find(
          (s) => s.name.toLowerCase() === ach.achievementId.toLowerCase(),
        );
        if (!schemaEntry) continue;

        const iconUrl = getSteamAchievementIconUrl(appId, schemaEntry.icon);
        const iconLockedUrl = getSteamAchievementIconUrl(appId, schemaEntry.icongray);
        aq.updateMetadata(
          ach.id,
          schemaEntry.displayName || schemaEntry.name,
          schemaEntry.description,
          iconUrl,
          iconLockedUrl,
        );
        if (ach.achievementId === schema.availableGameStats.achievements[0]?.name) {
          console.log(
            `[enricher] Sample: ${ach.id} → name="${schemaEntry.displayName}" icon=${iconUrl.substring(0, 60)}...`,
          );
        }
      }
    },
  };
}
