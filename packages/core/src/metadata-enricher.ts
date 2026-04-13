import {
  fetchSteamSchema,
  getSteamHeaderUrl,
  getSteamAchievementIconUrl,
} from "./steam-metadata.js";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import type { MetadataCache } from "./metadata-cache.js";

type DB = Parameters<typeof gameQueries>[0];

export interface MetadataEnricher {
  enrichGame(appId: string, gameId: string, db: DB): Promise<void>;
}

export function createMetadataEnricher(cache: MetadataCache, apiKey: string): MetadataEnricher {
  return {
    async enrichGame(appId, gameId, db) {
      // Try cache first
      let schema = cache.get(appId);

      // Fetch from API if not cached and a key is available
      if (!schema && apiKey) {
        schema = await fetchSteamSchema(appId, apiKey);
        if (schema) {
          cache.set(appId, schema);
        }
      }

      if (!schema?.availableGameStats?.achievements) return;

      // Update game header icon. Only update name if the current name
      // is still just the raw appId — the GetOwnedGames API usually
      // provides better names than GetSchemaForGame (which sometimes
      // returns internal names like "game_EN" or "Oak").
      const gq = gameQueries(db);
      const existing = gq.getById(gameId);
      if (existing) {
        const shouldUpdateName = existing.name === existing.appId && schema.gameName;
        gq.upsert({
          ...existing,
          name: shouldUpdateName ? schema.gameName : existing.name,
          iconUrl: getSteamHeaderUrl(appId),
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

        aq.updateMetadata(
          ach.id,
          schemaEntry.displayName || schemaEntry.name,
          schemaEntry.description,
          getSteamAchievementIconUrl(appId, schemaEntry.icon),
          getSteamAchievementIconUrl(appId, schemaEntry.icongray),
        );
      }
    },
  };
}
