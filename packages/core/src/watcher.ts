import { watch, type FSWatcher } from "chokidar";
import type { AchievementPlugin } from "@achievement-watcher/shared";
import { WATCHER_DEBOUNCE_MS, WATCHER_MAX_INSTANCES } from "@achievement-watcher/shared";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import type { EngineEventBus } from "./event-bus.js";
import type { PluginRegistry } from "./plugin-loader.js";

type DB = Parameters<typeof gameQueries>[0];

export interface WatcherService {
  /** Start watching all currently known games. */
  start(): void;
  /** Stop all file watchers. */
  stop(): void;
  /** Watch a specific game path using the given plugin. */
  watchGame(gamePath: string, pluginId: string): void;
  /** Stop watching a specific game path. */
  unwatchGame(gamePath: string): void;
}

export interface WatcherDeps {
  registry: PluginRegistry;
  db: DB;
  eventBus: EngineEventBus;
}

interface WatchedGame {
  gamePath: string;
  pluginId: string;
  watcher: FSWatcher;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

export function createWatcherService(deps: WatcherDeps): WatcherService {
  const { registry, db, eventBus } = deps;
  const gq = gameQueries(db);
  const aq = achievementQueries(db);

  // Map from gamePath -> WatchedGame
  const watching = new Map<string, WatchedGame>();

  function handleFileChange(gamePath: string, plugin: AchievementPlugin): void {
    const entry = watching.get(gamePath);
    if (!entry) return;

    // Clear previous debounce
    if (entry.debounceTimer !== null) {
      clearTimeout(entry.debounceTimer);
    }

    // Set new debounced handler
    entry.debounceTimer = setTimeout(() => {
      entry.debounceTimer = null;
      void processChange(gamePath, plugin);
    }, WATCHER_DEBOUNCE_MS);
  }

  async function processChange(gamePath: string, plugin: AchievementPlugin): Promise<void> {
    const result = await plugin.parse(gamePath);
    if (!result.ok) {
      eventBus.emit("error", {
        source: plugin.id,
        code: result.error.code,
        severity: "warn",
        message: result.error.message,
        context: { path: gamePath },
      });
      return;
    }

    const { appId, achievements } = result.data;
    const gameId = `${plugin.source}:${appId}`;

    // Look up the game in the DB
    const dbGame = gq.getById(gameId);
    if (!dbGame) {
      // Game not yet in DB — nothing to diff against
      return;
    }

    // Get current achievement state from DB
    const dbAchs = aq.getByGameId(gameId);
    const dbUnlockedSet = new Set(dbAchs.filter((a) => a.unlocked).map((a) => a.achievementId));

    // Detect newly unlocked achievements
    const newlyUnlocked = achievements.filter((a) => a.unlocked && !dbUnlockedSet.has(a.id));

    for (const ach of newlyUnlocked) {
      const achId = `${gameId}:${ach.id}`;
      const unlockTime = ach.unlockTime ?? Date.now();

      // Update DB
      aq.markUnlocked(achId, unlockTime);

      // Build event data
      const gameEntry = {
        id: dbGame.id,
        appId: dbGame.appId,
        name: dbGame.name,
        source: dbGame.source,
        installPath: dbGame.installPath,
        iconUrl: dbGame.iconUrl ?? undefined,
        lastPlayed: dbGame.lastPlayed ?? undefined,
        playtime: dbGame.playtime,
      };

      const achievement = {
        id: ach.id,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        iconLocked: ach.iconLocked,
        unlocked: true,
        unlockTime,
        rarity: ach.rarity,
        hidden: ach.hidden,
      };

      eventBus.emit("achievement:unlocked", {
        game: gameEntry,
        achievement,
        timestamp: unlockTime,
      });
    }

    // Update unlocked count in DB
    const totalUnlocked = achievements.filter((a) => a.unlocked).length;
    gq.updateAchievementCounts(gameId, achievements.length, totalUnlocked);
  }

  function addWatcher(gamePath: string, plugin: AchievementPlugin): void {
    if (watching.size >= WATCHER_MAX_INSTANCES) {
      eventBus.emit("error", {
        source: "watcher",
        code: "WATCHER_LIMIT_REACHED",
        severity: "warn",
        message: `Cannot watch more than ${String(WATCHER_MAX_INSTANCES)} games`,
        context: { gamePath },
      });
      return;
    }

    const patterns = plugin.watchPatterns(gamePath);
    if (patterns.length === 0) return;

    const fsWatcher = watch(patterns, {
      persistent: false,
      ignoreInitial: true,
      usePolling: true,
      interval: 100,
    });

    fsWatcher.on("change", () => {
      handleFileChange(gamePath, plugin);
    });
    fsWatcher.on("add", () => {
      handleFileChange(gamePath, plugin);
    });

    watching.set(gamePath, {
      gamePath,
      pluginId: plugin.id,
      watcher: fsWatcher,
      debounceTimer: null,
    });
  }

  return {
    start() {
      // Watch all games already in the DB
      const games = gq.getAll();
      for (const game of games) {
        const plugin = registry.getEnabled().find((p) => p.source === game.source);
        if (!plugin) continue;
        addWatcher(game.installPath, plugin);
      }
    },

    stop() {
      for (const entry of watching.values()) {
        if (entry.debounceTimer !== null) {
          clearTimeout(entry.debounceTimer);
        }
        void entry.watcher.close();
      }
      watching.clear();
    },

    watchGame(gamePath: string, pluginId: string) {
      if (watching.has(gamePath)) return;

      const plugin = registry.get(pluginId);
      if (!plugin) {
        eventBus.emit("error", {
          source: "watcher",
          code: "PLUGIN_NOT_FOUND",
          severity: "warn",
          message: `Plugin "${pluginId}" not found in registry`,
          context: { gamePath, pluginId },
        });
        return;
      }

      addWatcher(gamePath, plugin);
    },

    unwatchGame(gamePath: string) {
      const entry = watching.get(gamePath);
      if (!entry) return;

      if (entry.debounceTimer !== null) {
        clearTimeout(entry.debounceTimer);
      }
      void entry.watcher.close();
      watching.delete(gamePath);
    },
  };
}
