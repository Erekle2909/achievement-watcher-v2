import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { createDatabase, closeDatabase, type DatabaseConnection } from "@achievement-watcher/db";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import { createPluginRegistry } from "../plugin-loader.js";
import { createEventBus } from "../event-bus.js";
import { createWatcherService } from "../watcher.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createInMemoryDb(): DatabaseConnection {
  const conn = createDatabase(":memory:");
  conn.raw.exec(`
    CREATE TABLE games (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      install_path TEXT NOT NULL,
      icon_url TEXT,
      total_achievements INTEGER NOT NULL DEFAULT 0,
      unlocked_achievements INTEGER NOT NULL DEFAULT 0,
      last_played INTEGER,
      playtime REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  conn.raw.exec(`
    CREATE TABLE achievements (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon_url TEXT,
      icon_locked_url TEXT,
      unlocked INTEGER NOT NULL DEFAULT 0,
      unlock_time INTEGER,
      rarity REAL,
      hidden INTEGER NOT NULL DEFAULT 0
    )
  `);
  return conn;
}

function seedGame(
  conn: DatabaseConnection,
  gameId: string,
  gamePath: string,
  achievements: { id: string; unlocked: boolean }[],
): void {
  const gq = gameQueries(conn.drizzle);
  const aq = achievementQueries(conn.drizzle);

  const [source, appId] = gameId.split(":") as [string, string];
  gq.upsert({
    id: gameId,
    appId,
    name: "Test Game",
    source,
    installPath: gamePath,
  });

  aq.upsertMany(
    gameId,
    achievements.map((a) => ({
      id: `${gameId}:${a.id}`,
      gameId,
      achievementId: a.id,
      name: `Achievement ${a.id}`,
      description: "",
      unlocked: a.unlocked,
    })),
  );
  gq.updateAchievementCounts(
    gameId,
    achievements.length,
    achievements.filter((a) => a.unlocked).length,
  );
}

/** Wait for a condition to be true, polling every 20ms, up to maxMs. */
async function waitFor(condition: () => boolean, maxMs: number = 2000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > maxMs) {
      throw new Error("waitFor timed out");
    }
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 20);
    });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WatcherService", () => {
  let tmpDir: string;
  let conn: DatabaseConnection;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `aw-watcher-test-${String(Date.now())}`);
    mkdirSync(tmpDir, { recursive: true });
    conn = createInMemoryDb();
  });

  afterEach(() => {
    closeDatabase(conn.raw);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("watchGame registers a watcher without error", () => {
    const gamePath = join(tmpDir, "12345");
    mkdirSync(gamePath, { recursive: true });
    writeFileSync(join(gamePath, "achievements.json"), "{}");

    const plugin: AchievementPlugin = {
      id: "test",
      name: "Test",
      source: "test",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> =>
        Promise.resolve({ ok: true, data: { appId: "12345", name: "T", achievements: [] } }),
      watchPatterns: (p: string) => [join(p, "achievements.json")],
    };

    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });

    watcher.watchGame(gamePath, "test");
    watcher.stop();
  });

  it("unwatchGame removes watcher without error", () => {
    const gamePath = join(tmpDir, "12345");
    mkdirSync(gamePath, { recursive: true });
    writeFileSync(join(gamePath, "achievements.json"), "{}");

    const plugin: AchievementPlugin = {
      id: "test",
      name: "Test",
      source: "test",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> =>
        Promise.resolve({ ok: true, data: { appId: "12345", name: "T", achievements: [] } }),
      watchPatterns: (p: string) => [join(p, "achievements.json")],
    };

    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });

    watcher.watchGame(gamePath, "test");
    watcher.unwatchGame(gamePath);
    watcher.stop();
  });

  it("emits error when watchGame is called with unknown pluginId", () => {
    const eventBus = createEventBus();
    const onError = vi.fn();
    eventBus.on("error", onError);

    const registry = createPluginRegistry();
    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });

    watcher.watchGame("/some/path", "nonexistent");
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "PLUGIN_NOT_FOUND" }));
  });

  it("start() watches games already in the DB", () => {
    const gamePath = join(tmpDir, "99999");
    mkdirSync(gamePath, { recursive: true });
    writeFileSync(join(gamePath, "achievements.json"), "{}");

    const plugin: AchievementPlugin = {
      id: "test",
      name: "Test",
      source: "test-source",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> =>
        Promise.resolve({ ok: true, data: { appId: "99999", name: "DB Game", achievements: [] } }),
      watchPatterns: (p: string) => [join(p, "achievements.json")],
    };

    seedGame(conn, "test-source:99999", gamePath, []);

    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });

    // Should not throw
    watcher.start();
    watcher.stop();
  });

  it("detects a newly unlocked achievement on file change", async () => {
    const gamePath = join(tmpDir, "77777");
    mkdirSync(gamePath, { recursive: true });
    const achFile = join(gamePath, "achievements.json");
    writeFileSync(achFile, "{}");

    // Initially ACH_1 is locked; first parse() call (on file change) returns unlocked
    let parseCount = 0;
    const plugin: AchievementPlugin = {
      id: "test",
      name: "Test",
      source: "test-src",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> => {
        parseCount++;
        // First parse call (triggered by file change) returns unlocked
        const unlocked = parseCount >= 1;
        return Promise.resolve({
          ok: true,
          data: {
            appId: "77777",
            name: "Watch Game",
            achievements: [
              {
                id: "ACH_1",
                name: "First!",
                description: "Do it first",
                icon: "first.png",
                unlocked,
                unlockTime: unlocked ? 1700000000 : undefined,
              },
            ],
          },
        });
      },
      watchPatterns: (p: string) => [join(p, "achievements.json")],
    };

    // Seed the game with ACH_1 locked
    seedGame(conn, "test-src:77777", gamePath, [{ id: "ACH_1", unlocked: false }]);

    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const unlocked = vi.fn();
    eventBus.on("achievement:unlocked", unlocked);

    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });
    watcher.watchGame(gamePath, "test");

    // Give chokidar time to set up polling before triggering a change
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });

    // Trigger file change
    writeFileSync(achFile, '{"changed":true}');

    // Wait for debounce + processing
    await waitFor(() => unlocked.mock.calls.length > 0, 4000);

    expect(unlocked).toHaveBeenCalledOnce();
    const call = unlocked.mock.calls[0] as [{ achievement: { id: string; unlocked: boolean } }];
    expect(call[0].achievement.id).toBe("ACH_1");
    expect(call[0].achievement.unlocked).toBe(true);

    watcher.stop();
  }, 10000);

  it("does not emit achievement:unlocked for already-unlocked achievements", async () => {
    const gamePath = join(tmpDir, "88888");
    mkdirSync(gamePath, { recursive: true });
    const achFile = join(gamePath, "achievements.json");
    writeFileSync(achFile, "{}");

    const plugin: AchievementPlugin = {
      id: "test",
      name: "Test",
      source: "test-src2",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> =>
        Promise.resolve({
          ok: true,
          data: {
            appId: "88888",
            name: "Already Unlocked",
            achievements: [
              {
                id: "ACH_DONE",
                name: "Done",
                description: "Already done",
                icon: "done.png",
                unlocked: true,
                unlockTime: 1600000000,
              },
            ],
          },
        }),
      watchPatterns: (p: string) => [join(p, "achievements.json")],
    };

    // Seed the game with ACH_DONE already unlocked
    seedGame(conn, "test-src2:88888", gamePath, [{ id: "ACH_DONE", unlocked: true }]);

    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const unlocked = vi.fn();
    eventBus.on("achievement:unlocked", unlocked);

    const watcher = createWatcherService({ registry, db: conn.drizzle, eventBus });
    watcher.watchGame(gamePath, "test");

    // Give chokidar time to set up polling
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 300);
    });

    // Trigger file change
    writeFileSync(achFile, '{"still-unlocked":true}');

    // Wait a bit to confirm no events are emitted (debounce 300ms + processing time)
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 800);
    });

    expect(unlocked).not.toHaveBeenCalled();
    watcher.stop();
  }, 10000);
});
