import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createDatabase,
  closeDatabase,
  gameQueries,
  achievementQueries,
  type DatabaseConnection,
} from "@achievement-watcher/db";
import { goldbergPlugin } from "@achievement-watcher/plugin-goldberg";
import { createPluginRegistry } from "../plugin-loader.js";
import { createAchievementEngine } from "../engine.js";

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AchievementEngine (integration)", () => {
  let tmpDir: string;
  let conn: DatabaseConnection;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `aw-engine-test-${String(Date.now())}`);
    mkdirSync(tmpDir, { recursive: true });
    conn = createInMemoryDb();
  });

  afterEach(() => {
    closeDatabase(conn.raw);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("start() runs discovery scan and emits scan:completed", async () => {
    // Create a Goldberg-style game directory: tmpDir/12345/achievements.json
    const gameDir = join(tmpDir, "12345");
    mkdirSync(gameDir, { recursive: true });
    writeFileSync(
      join(gameDir, "achievements.json"),
      JSON.stringify({
        ACH_FIRST_BLOOD: { earned: true, earned_time: 1700000000 },
        ACH_COMPLETE_GAME: { earned: false, earned_time: 0 },
      }),
    );

    // Override goldberg detectPaths to return our tmpDir
    const testPlugin = {
      ...goldbergPlugin,
      detectPaths: () => [tmpDir],
    };

    const registry = createPluginRegistry();
    registry.register(testPlugin);

    const engine = createAchievementEngine({ registry, db: conn });

    const onCompleted = vi.fn();
    engine.eventBus.on("scan:completed", onCompleted);

    await engine.start();
    engine.stop();

    expect(onCompleted).toHaveBeenCalledOnce();
    expect(onCompleted).toHaveBeenCalledWith({ gamesFound: 1 });
  });

  it("discovery upserts games + achievements into DB", async () => {
    const gameDir = join(tmpDir, "99999");
    mkdirSync(gameDir, { recursive: true });
    writeFileSync(
      join(gameDir, "achievements.json"),
      JSON.stringify({
        ACH_ONE: { earned: true, earned_time: 1700000000 },
        ACH_TWO: { earned: false, earned_time: 0 },
        ACH_THREE: { earned: true, earned_time: 1700050000 },
      }),
    );

    const testPlugin = {
      ...goldbergPlugin,
      detectPaths: () => [tmpDir],
    };

    const registry = createPluginRegistry();
    registry.register(testPlugin);

    const engine = createAchievementEngine({ registry, db: conn });
    await engine.start();
    engine.stop();

    const gq = gameQueries(conn.drizzle);
    const game = gq.getById("steam-emu:99999");
    expect(game).toBeDefined();
    expect(game?.appId).toBe("99999");
    expect(game?.source).toBe("steam-emu");
    expect(game?.totalAchievements).toBe(3);
    expect(game?.unlockedAchievements).toBe(2);

    const aq = achievementQueries(conn.drizzle);
    const achs = aq.getByGameId("steam-emu:99999");
    expect(achs).toHaveLength(3);
  });

  it("emits game:discovered for each found game", async () => {
    const dir1 = join(tmpDir, "111");
    const dir2 = join(tmpDir, "222");
    mkdirSync(dir1, { recursive: true });
    mkdirSync(dir2, { recursive: true });
    writeFileSync(join(dir1, "achievements.json"), JSON.stringify({}));
    writeFileSync(join(dir2, "achievements.json"), JSON.stringify({}));

    const testPlugin = {
      ...goldbergPlugin,
      detectPaths: () => [tmpDir],
    };

    const registry = createPluginRegistry();
    registry.register(testPlugin);

    const engine = createAchievementEngine({ registry, db: conn });
    const discovered = vi.fn();
    engine.eventBus.on("game:discovered", discovered);

    await engine.start();
    engine.stop();

    expect(discovered).toHaveBeenCalledTimes(2);
  });

  it("stop() cleans up without throwing", async () => {
    const registry = createPluginRegistry();
    const engine = createAchievementEngine({ registry, db: conn });
    await engine.start();
    expect(() => {
      engine.stop();
    }).not.toThrow();
  });

  it("rescan() finds games discovered after initial start", async () => {
    const registry = createPluginRegistry();
    const testPlugin = {
      ...goldbergPlugin,
      detectPaths: () => [tmpDir],
    };
    registry.register(testPlugin);

    const engine = createAchievementEngine({ registry, db: conn });
    const completed = vi.fn();
    engine.eventBus.on("scan:completed", completed);

    // First start: no games
    await engine.start();
    expect(completed).toHaveBeenCalledWith({ gamesFound: 0 });

    // Add a game directory
    const gameDir = join(tmpDir, "55555");
    mkdirSync(gameDir, { recursive: true });
    writeFileSync(join(gameDir, "achievements.json"), JSON.stringify({}));

    // Rescan: should find the new game
    await engine.rescan();
    expect(completed).toHaveBeenCalledWith({ gamesFound: 1 });

    engine.stop();
  });

  it("eventBus exposes engine events to subscribers", async () => {
    const registry = createPluginRegistry();
    const engine = createAchievementEngine({ registry, db: conn });

    const onStarted = vi.fn();
    engine.eventBus.on("scan:started", onStarted);

    await engine.start();
    engine.stop();

    expect(onStarted).toHaveBeenCalled();
  });
});
