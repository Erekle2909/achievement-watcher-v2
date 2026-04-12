import type { DatabaseConnection } from "@achievement-watcher/db";
import type { PluginRegistry } from "./plugin-loader.js";
import { createEventBus, type EngineEventBus } from "./event-bus.js";
import { createDiscoveryService } from "./discovery.js";
import { createWatcherService } from "./watcher.js";

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
}

export function createAchievementEngine(deps: EngineDeps): AchievementEngine {
  const { registry, db } = deps;
  const eventBus = createEventBus();

  const discovery = createDiscoveryService({
    registry,
    db: db.drizzle,
    eventBus,
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
