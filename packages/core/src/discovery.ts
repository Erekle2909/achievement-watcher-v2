import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { AchievementPlugin, GameEntry } from "@achievement-watcher/shared";
import type { PluginRegistry } from "./plugin-loader.js";
import type { EngineEventBus } from "./event-bus.js";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import type { MetadataEnricher } from "./metadata-enricher.js";

type DB = Parameters<typeof gameQueries>[0];

export interface DiscoveryService {
  /** Scan all enabled plugins for games. Returns count of games found. */
  scan(): Promise<number>;
}

export interface DiscoveryDeps {
  registry: PluginRegistry;
  db: DB;
  eventBus: EngineEventBus;
  /** Optional — if provided, enriches each discovered game with Steam metadata. */
  enricher?: MetadataEnricher;
}

/**
 * List immediate subdirectories of a given directory path.
 * Returns an empty array if the directory cannot be read.
 */
function listSubdirs(dirPath: string): string[] {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => {
        if (!e.isDirectory()) return false;
        try {
          statSync(join(dirPath, e.name));
          return true;
        } catch {
          return false;
        }
      })
      .map((e) => join(dirPath, e.name));
  } catch {
    return [];
  }
}

/**
 * Convert a ParsedGame from a plugin into a GameEntry for the DB / event bus.
 * Game IDs use the format `{source}:{appId}` for cross-plugin uniqueness.
 */
function toGameEntry(
  plugin: AchievementPlugin,
  appId: string,
  name: string,
  installPath: string,
): GameEntry {
  return {
    id: `${plugin.source}:${appId}`,
    appId,
    name,
    source: plugin.source,
    installPath,
    playtime: 0,
  };
}

export function createDiscoveryService(deps: DiscoveryDeps): DiscoveryService {
  const { registry, db, eventBus, enricher } = deps;
  const gq = gameQueries(db);
  const aq = achievementQueries(db);

  return {
    async scan(): Promise<number> {
      eventBus.emit("scan:started", undefined);

      let gamesFound = 0;

      for (const plugin of registry.getEnabled()) {
        const basePaths = plugin.detectPaths();

        for (const basePath of basePaths) {
          const subdirs = listSubdirs(basePath);

          // If the base path has no subdirectories, try treating the base path
          // itself as a game directory. This supports plugins like Steam where
          // detectPaths() returns one path per game rather than a parent directory.
          const candidates = subdirs.length > 0 ? subdirs : [basePath];

          for (const candidate of candidates) {
            let detected: boolean;
            try {
              detected = await plugin.detectGame(candidate);
            } catch {
              eventBus.emit("error", {
                source: plugin.id,
                code: "DETECT_GAME_ERROR",
                severity: "warn",
                message: `detectGame threw for path: ${candidate}`,
                context: { path: candidate },
              });
              continue;
            }

            if (!detected) continue;

            const result = await plugin.parse(candidate);
            if (!result.ok) {
              eventBus.emit("error", {
                source: plugin.id,
                code: result.error.code,
                severity: "warn",
                message: result.error.message,
                context: { path: candidate },
              });
              continue;
            }

            const { appId, name, achievements } = result.data;
            const gameEntry = toGameEntry(plugin, appId, name, candidate);

            // Upsert game into DB
            gq.upsert({
              id: gameEntry.id,
              appId: gameEntry.appId,
              name: gameEntry.name,
              source: gameEntry.source,
              installPath: gameEntry.installPath,
              iconUrl: gameEntry.iconUrl,
            });

            // Upsert achievements — IDs use `{gameId}:{achievementId}`
            aq.upsertMany(
              gameEntry.id,
              achievements.map((a) => ({
                id: `${gameEntry.id}:${a.id}`,
                gameId: gameEntry.id,
                achievementId: a.id,
                name: a.name,
                description: a.description,
                iconUrl: a.icon,
                iconLockedUrl: a.iconLocked,
                unlocked: a.unlocked,
                unlockTime: a.unlockTime,
                rarity: a.rarity,
                hidden: a.hidden,
              })),
            );

            // Update achievement counts
            const unlockedCount = achievements.filter((a) => a.unlocked).length;
            gq.updateAchievementCounts(gameEntry.id, achievements.length, unlockedCount);

            // Non-blocking enrichment — errors are swallowed so discovery always succeeds
            if (enricher) {
              enricher.enrichGame(appId, gameEntry.id, db).catch(() => {
                eventBus.emit("error", {
                  source: plugin.id,
                  code: "ENRICHMENT_ERROR",
                  severity: "warn",
                  message: `Metadata enrichment failed for appId: ${appId}`,
                  context: { appId },
                });
              });
            }

            gamesFound++;
            eventBus.emit("game:discovered", { game: gameEntry });
          }
        }
      }

      eventBus.emit("scan:completed", { gamesFound });
      return gamesFound;
    },
  };
}
