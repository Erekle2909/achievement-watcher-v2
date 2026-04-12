import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { createDatabase, closeDatabase, type DatabaseConnection } from "@achievement-watcher/db";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import { createPluginRegistry } from "../plugin-loader.js";
import { createEventBus } from "../event-bus.js";
import { createDiscoveryService } from "../discovery.js";

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

function createMockPlugin(
  id: string,
  basePath: string,
  games: { appId: string; name: string; achievements: ParsedGame["achievements"] }[],
): AchievementPlugin {
  return {
    id,
    name: `Mock ${id}`,
    source: `mock-${id}`,
    detectPaths: () => [basePath],
    detectGame: (dirPath: string) => {
      const appId = dirPath.split(/[\\/]/).pop();
      return Promise.resolve(games.some((g) => g.appId === appId));
    },
    parse: (gamePath: string): Promise<ParseResult<ParsedGame>> => {
      const appId = gamePath.split(/[\\/]/).pop() ?? "";
      const found = games.find((g) => g.appId === appId);
      if (!found) {
        return Promise.resolve({ ok: false, error: { code: "NOT_FOUND", message: "not found" } });
      }
      return Promise.resolve({
        ok: true,
        data: { appId: found.appId, name: found.name, achievements: found.achievements },
      });
    },
    watchPatterns: (gamePath: string) => [join(gamePath, "achievements.json")],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DiscoveryService", () => {
  let tmpDir: string;
  let conn: DatabaseConnection;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `aw-discovery-test-${String(Date.now())}`);
    mkdirSync(tmpDir, { recursive: true });
    conn = createInMemoryDb();
  });

  afterEach(() => {
    closeDatabase(conn.raw);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns 0 when no plugins are registered", async () => {
    const registry = createPluginRegistry();
    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();
    expect(count).toBe(0);
  });

  it("finds a game and upserts it into the DB", async () => {
    // Create a game subdir: tmpDir/12345/
    mkdirSync(join(tmpDir, "12345"), { recursive: true });

    const plugin = createMockPlugin("test", tmpDir, [
      { appId: "12345", name: "Test Game", achievements: [] },
    ]);

    const registry = createPluginRegistry();
    registry.register(plugin);

    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();
    expect(count).toBe(1);

    const gq = gameQueries(conn.drizzle);
    const dbGame = gq.getById("mock-test:12345");
    expect(dbGame).toBeDefined();
    expect(dbGame?.name).toBe("Test Game");
    expect(dbGame?.source).toBe("mock-test");
    expect(dbGame?.appId).toBe("12345");
  });

  it("emits game:discovered event per game", async () => {
    mkdirSync(join(tmpDir, "111"), { recursive: true });
    mkdirSync(join(tmpDir, "222"), { recursive: true });

    const plugin = createMockPlugin("test", tmpDir, [
      { appId: "111", name: "Game One", achievements: [] },
      { appId: "222", name: "Game Two", achievements: [] },
    ]);

    const registry = createPluginRegistry();
    registry.register(plugin);

    const eventBus = createEventBus();
    const discovered = vi.fn();
    eventBus.on("game:discovered", discovered);

    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();

    expect(count).toBe(2);
    expect(discovered).toHaveBeenCalledTimes(2);
  });

  it("emits scan:started and scan:completed events", async () => {
    const registry = createPluginRegistry();
    const eventBus = createEventBus();
    const onStarted = vi.fn();
    const onCompleted = vi.fn();
    eventBus.on("scan:started", onStarted);
    eventBus.on("scan:completed", onCompleted);

    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    await discovery.scan();

    expect(onStarted).toHaveBeenCalledOnce();
    expect(onCompleted).toHaveBeenCalledOnce();
    expect(onCompleted).toHaveBeenCalledWith({ gamesFound: 0 });
  });

  it("upserts achievements into the DB", async () => {
    mkdirSync(join(tmpDir, "999"), { recursive: true });

    const plugin = createMockPlugin("test", tmpDir, [
      {
        appId: "999",
        name: "Achievo Game",
        achievements: [
          {
            id: "ACH_1",
            name: "First Blood",
            description: "Kill your first enemy",
            icon: "blood.jpg",
            unlocked: true,
            unlockTime: 1700000000,
          },
          {
            id: "ACH_2",
            name: "Pacifist",
            description: "Never killed",
            icon: "peace.jpg",
            unlocked: false,
          },
        ],
      },
    ]);

    const registry = createPluginRegistry();
    registry.register(plugin);

    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    await discovery.scan();

    const aq = achievementQueries(conn.drizzle);
    const achs = aq.getByGameId("mock-test:999");
    expect(achs).toHaveLength(2);

    const gq = gameQueries(conn.drizzle);
    const dbGame = gq.getById("mock-test:999");
    expect(dbGame?.totalAchievements).toBe(2);
    expect(dbGame?.unlockedAchievements).toBe(1);
  });

  it("skips subdirs that detectGame returns false for", async () => {
    mkdirSync(join(tmpDir, "SKIP_ME"), { recursive: true });
    mkdirSync(join(tmpDir, "12345"), { recursive: true });

    const plugin = createMockPlugin("test", tmpDir, [
      { appId: "12345", name: "Valid Game", achievements: [] },
      // SKIP_ME is not in the list, detectGame returns false for it
    ]);

    const registry = createPluginRegistry();
    registry.register(plugin);

    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();
    expect(count).toBe(1);
  });

  it("emits error event when parse fails", async () => {
    mkdirSync(join(tmpDir, "BROKEN"), { recursive: true });

    const brokenPlugin: AchievementPlugin = {
      id: "broken",
      name: "Broken",
      source: "broken",
      detectPaths: () => [tmpDir],
      detectGame: () => Promise.resolve(true),
      parse: (): Promise<ParseResult<ParsedGame>> =>
        Promise.resolve({ ok: false, error: { code: "PARSE_FAIL", message: "broken file" } }),
      watchPatterns: () => [],
    };

    const registry = createPluginRegistry();
    registry.register(brokenPlugin);

    const eventBus = createEventBus();
    const onError = vi.fn();
    eventBus.on("error", onError);

    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();

    expect(count).toBe(0);
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "PARSE_FAIL", severity: "warn" }),
    );
  });

  it("skips base paths that do not exist", async () => {
    const plugin = createMockPlugin("test", join(tmpDir, "DOES_NOT_EXIST"), []);
    const registry = createPluginRegistry();
    registry.register(plugin);
    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();
    expect(count).toBe(0);
  });

  it("disabled plugins are skipped", async () => {
    mkdirSync(join(tmpDir, "12345"), { recursive: true });

    const plugin = createMockPlugin("test", tmpDir, [
      { appId: "12345", name: "Game", achievements: [] },
    ]);

    const registry = createPluginRegistry();
    registry.register(plugin);
    registry.disable("test");

    const eventBus = createEventBus();
    const discovery = createDiscoveryService({ registry, db: conn.drizzle, eventBus });
    const count = await discovery.scan();
    expect(count).toBe(0);
  });
});
