import { join } from "node:path";
import { homedir } from "node:os";
import type { DatabaseConnection } from "@achievement-watcher/db";
import type { PluginRegistry } from "./plugin-loader.js";
import { createEventBus, type EngineEventBus } from "./event-bus.js";
import { createDiscoveryService } from "./discovery.js";
import { createWatcherService } from "./watcher.js";
import { createMetadataCache } from "./metadata-cache.js";
import { createMetadataEnricher } from "./metadata-enricher.js";

export interface AchievementEngine {
  /** Run initial scan then start file watchers. */
  start(): Promise<void>;
  /** Stop all file watchers. */
  stop(): void;
  /** Re-run discovery scan (watchers stay active). */
  rescan(): Promise<void>;
  /** Typed event bus to subscribe to engine events. */
  eventBus: EngineEventBus;
}

export interface EngineDeps {
  registry: PluginRegistry;
  db: DatabaseConnection;
  /** Steam Web API key — if omitted, enrichment is skipped when cache is cold. */
  steamApiKey?: string;
  /** Directory for caching Steam schema JSON files. Defaults to ~/.achievement-watcher/cache. */
  cacheDir?: string;
}

export function createAchievementEngine(deps: EngineDeps): AchievementEngine {
  const { registry, db, steamApiKey = "", cacheDir } = deps;
  const eventBus = createEventBus();

  const resolvedCacheDir =
    cacheDir ?? join(homedir(), ".achievement-watcher", "cache", "steam-schema");
  const cache = createMetadataCache(resolvedCacheDir);
  const enricher = createMetadataEnricher(cache, steamApiKey);

  const discovery = createDiscoveryService({
    registry,
    db: db.drizzle,
    eventBus,
    enricher,
  });

  const watcher = createWatcherService({
    registry,
    db: db.drizzle,
    eventBus,
  });

  // When a new game is discovered, start watching it immediately
  eventBus.on("game:discovered", ({ game }) => {
    const plugin = registry.get(
      registry.getEnabled().find((p) => p.source === game.source)?.id ?? "",
    );
    if (plugin) {
      watcher.watchGame(game.installPath, plugin.id);
    }
  });

  return {
    async start(): Promise<void> {
      // Watch games already persisted from a previous session
      watcher.start();
      // Discover new games (fires game:discovered which will also call watchGame)
      await discovery.scan();
    },

    stop(): void {
      watcher.stop();
    },

    async rescan(): Promise<void> {
      await discovery.scan();
    },

    eventBus,
  };
}
