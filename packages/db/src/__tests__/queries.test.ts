import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDatabase, closeDatabase, type DatabaseConnection } from "../connection.js";
import { gameQueries } from "../queries/games.js";
import { achievementQueries } from "../queries/achievements.js";
import { sessionQueries } from "../queries/sessions.js";
import { settingsQueries } from "../queries/settings.js";
import { pluginStateQueries } from "../queries/plugin-state.js";

describe("Game queries", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createDatabase(":memory:");
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
    conn.raw.exec(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration REAL NOT NULL DEFAULT 0
      )
    `);
    conn.raw.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    conn.raw.exec(`
      CREATE TABLE plugin_state (
        id TEXT PRIMARY KEY,
        plugin_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL
      )
    `);
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("upserts a new game", () => {
    const q = gameQueries(conn.drizzle);
    q.upsert({
      id: "game-1",
      appId: "12345",
      name: "Test Game",
      source: "steam",
      installPath: "C:/Games/Test",
    });
    const all = q.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe("Test Game");
  });

  it("updates existing game on upsert", () => {
    const q = gameQueries(conn.drizzle);
    q.upsert({
      id: "game-1",
      appId: "12345",
      name: "Test Game",
      source: "steam",
      installPath: "C:/Games/Test",
    });
    q.upsert({
      id: "game-1",
      appId: "12345",
      name: "Updated",
      source: "steam",
      installPath: "C:/Games/Test",
    });
    const all = q.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.name).toBe("Updated");
  });

  it("gets game by id", () => {
    const q = gameQueries(conn.drizzle);
    q.upsert({ id: "game-1", appId: "12345", name: "Test", source: "steam", installPath: "/test" });
    expect(q.getById("game-1")?.appId).toBe("12345");
  });

  it("returns undefined for missing game", () => {
    const q = gameQueries(conn.drizzle);
    expect(q.getById("nope")).toBeUndefined();
  });

  it("deletes a game", () => {
    const q = gameQueries(conn.drizzle);
    q.upsert({ id: "game-1", appId: "12345", name: "Test", source: "steam", installPath: "/test" });
    q.remove("game-1");
    expect(q.getAll()).toHaveLength(0);
  });

  it("updates playtime", () => {
    const q = gameQueries(conn.drizzle);
    q.upsert({ id: "game-1", appId: "12345", name: "Test", source: "steam", installPath: "/test" });
    q.updatePlaytime("game-1", 3600);
    expect(q.getById("game-1")?.playtime).toBe(3600);
  });
});

describe("Achievement queries", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createDatabase(":memory:");
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
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("inserts achievements via upsertMany", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      {
        id: "ach-1",
        gameId: "game-1",
        achievementId: "WIN",
        name: "Win",
        description: "Win a match",
      },
      {
        id: "ach-2",
        gameId: "game-1",
        achievementId: "LOSE",
        name: "Lose",
        description: "Lose a match",
      },
    ]);
    expect(aq.getByGameId("game-1")).toHaveLength(2);
  });

  it("upsertMany conflict updates unlock status but preserves metadata", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      { id: "ach-1", gameId: "game-1", achievementId: "WIN", name: "Win", description: "Original" },
    ]);
    // Simulate enricher updating metadata
    aq.updateMetadata("ach-1", "Victory!", "Win your first match", "icon.jpg", "icon_gray.jpg");
    // Simulate rescan — upsertMany should NOT overwrite enriched metadata
    aq.upsertMany("game-1", [
      {
        id: "ach-1",
        gameId: "game-1",
        achievementId: "WIN",
        name: "WIN",
        description: "",
        unlocked: true,
        unlockTime: 1700000000,
      },
    ]);
    const achs = aq.getByGameId("game-1");
    expect(achs).toHaveLength(1);
    // Metadata preserved from enricher
    expect(achs[0]?.name).toBe("Victory!");
    expect(achs[0]?.description).toBe("Win your first match");
    expect(achs[0]?.iconUrl).toBe("icon.jpg");
    // Unlock status updated by upsertMany
    expect(achs[0]?.unlocked).toBe(true);
    expect(achs[0]?.unlockTime).toBe(1700000000);
  });

  it("marks an achievement unlocked", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      { id: "ach-1", gameId: "game-1", achievementId: "WIN", name: "Win", description: "" },
    ]);
    aq.markUnlocked("ach-1", 1700000000);
    const achs = aq.getByGameId("game-1");
    expect(achs[0]?.unlocked).toBe(true);
    expect(achs[0]?.unlockTime).toBe(1700000000);
  });

  it("gets recent unlocks sorted by time desc", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      { id: "ach-1", gameId: "game-1", achievementId: "A1", name: "First", description: "" },
      { id: "ach-2", gameId: "game-1", achievementId: "A2", name: "Second", description: "" },
      { id: "ach-3", gameId: "game-1", achievementId: "A3", name: "Third", description: "" },
    ]);
    aq.markUnlocked("ach-1", 1000);
    aq.markUnlocked("ach-2", 3000);
    aq.markUnlocked("ach-3", 2000);
    const recent = aq.getRecentUnlocks(10);
    expect(recent).toHaveLength(3);
    expect(recent[0]?.id).toBe("ach-2");
    expect(recent[1]?.id).toBe("ach-3");
    expect(recent[2]?.id).toBe("ach-1");
  });

  it("updateMetadata updates name, description, and icon URLs", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      {
        id: "ach-1",
        gameId: "game-1",
        achievementId: "ACH_RAW",
        name: "ACH_RAW",
        description: "",
      },
    ]);
    aq.updateMetadata(
      "ach-1",
      "First Blood",
      "Kill your first enemy",
      "blood.jpg",
      "blood_gray.jpg",
    );
    const achs = aq.getByGameId("game-1");
    expect(achs[0]?.name).toBe("First Blood");
    expect(achs[0]?.description).toBe("Kill your first enemy");
    expect(achs[0]?.iconUrl).toBe("blood.jpg");
    expect(achs[0]?.iconLockedUrl).toBe("blood_gray.jpg");
  });

  it("updateMetadata with no icons leaves them undefined", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    aq.upsertMany("game-1", [
      {
        id: "ach-1",
        gameId: "game-1",
        achievementId: "ACH_RAW",
        name: "ACH_RAW",
        description: "",
        iconUrl: "old.jpg",
      },
    ]);
    aq.updateMetadata("ach-1", "New Name", "New Desc");
    const achs = aq.getByGameId("game-1");
    expect(achs[0]?.name).toBe("New Name");
    expect(achs[0]?.description).toBe("New Desc");
  });
});

describe("Session queries", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createDatabase(":memory:");
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
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration REAL NOT NULL DEFAULT 0
      )
    `);
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("starts a session", () => {
    const gq = gameQueries(conn.drizzle);
    const sq = sessionQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    sq.start("sess-1", "game-1", 1000);
    expect(sq.getByGameId("game-1")).toHaveLength(1);
  });

  it("ends a session with duration", () => {
    const gq = gameQueries(conn.drizzle);
    const sq = sessionQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    sq.start("sess-1", "game-1", 1000);
    sq.end("sess-1", 4600, 3600);
    const sessions = sq.getByGameId("game-1");
    expect(sessions[0]?.endTime).toBe(4600);
    expect(sessions[0]?.duration).toBe(3600);
  });

  it("returns sessions sorted by start time desc", () => {
    const gq = gameQueries(conn.drizzle);
    const sq = sessionQueries(conn.drizzle);
    gq.upsert({ id: "game-1", appId: "100", name: "Game", source: "steam", installPath: "/g" });
    sq.start("sess-1", "game-1", 1000);
    sq.start("sess-2", "game-1", 5000);
    const sessions = sq.getByGameId("game-1");
    expect(sessions[0]?.id).toBe("sess-2");
    expect(sessions[1]?.id).toBe("sess-1");
  });
});

describe("Settings queries", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createDatabase(":memory:");
    conn.raw.exec(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("sets and gets a setting", () => {
    const sq = settingsQueries(conn.drizzle);
    sq.set("theme", "dark");
    expect(sq.get("theme")).toBe("dark");
  });

  it("returns undefined for missing key", () => {
    const sq = settingsQueries(conn.drizzle);
    expect(sq.get("nonexistent")).toBeUndefined();
  });

  it("updates existing setting on conflict", () => {
    const sq = settingsQueries(conn.drizzle);
    sq.set("theme", "dark");
    sq.set("theme", "light");
    expect(sq.get("theme")).toBe("light");
  });

  it("getAll returns a map of all settings", () => {
    const sq = settingsQueries(conn.drizzle);
    sq.set("theme", "dark");
    sq.set("lang", "en");
    const all = sq.getAll();
    expect(all).toEqual({ theme: "dark", lang: "en" });
  });

  it("removes a setting", () => {
    const sq = settingsQueries(conn.drizzle);
    sq.set("theme", "dark");
    sq.remove("theme");
    expect(sq.get("theme")).toBeUndefined();
  });
});

describe("Plugin state queries", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createDatabase(":memory:");
    conn.raw.exec(`
      CREATE TABLE plugin_state (
        id TEXT PRIMARY KEY,
        plugin_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL
      )
    `);
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("sets and gets plugin state", () => {
    const pq = pluginStateQueries(conn.drizzle);
    pq.set("plugin-a", "lastSync", "2024-01-01");
    expect(pq.get("plugin-a", "lastSync")).toBe("2024-01-01");
  });

  it("returns undefined for missing key", () => {
    const pq = pluginStateQueries(conn.drizzle);
    expect(pq.get("plugin-a", "missing")).toBeUndefined();
  });

  it("updates existing value on conflict", () => {
    const pq = pluginStateQueries(conn.drizzle);
    pq.set("plugin-a", "lastSync", "2024-01-01");
    pq.set("plugin-a", "lastSync", "2024-06-01");
    expect(pq.get("plugin-a", "lastSync")).toBe("2024-06-01");
  });

  it("getAllForPlugin returns map scoped to plugin", () => {
    const pq = pluginStateQueries(conn.drizzle);
    pq.set("plugin-a", "foo", "1");
    pq.set("plugin-a", "bar", "2");
    pq.set("plugin-b", "foo", "99");
    const state = pq.getAllForPlugin("plugin-a");
    expect(state).toEqual({ foo: "1", bar: "2" });
  });
});
