import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatabase, closeDatabase, type DatabaseConnection } from "@achievement-watcher/db";
import { gameQueries, achievementQueries } from "@achievement-watcher/db";
import { createMetadataCache } from "../metadata-cache.js";
import { createMetadataEnricher } from "../metadata-enricher.js";
import type { SteamGameSchema } from "../steam-metadata.js";

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

const SCHEMA: SteamGameSchema = {
  gameName: "Counter-Strike 2",
  gameVersion: "1",
  availableGameStats: {
    achievements: [
      {
        name: "ACH_FIRST_BLOOD",
        defaultvalue: 0,
        displayName: "First Blood",
        hidden: 0,
        description: "Get the first kill of a match",
        icon: "abc123",
        icongray: "abc123_gray",
      },
      {
        name: "ACH_WIN",
        defaultvalue: 0,
        displayName: "Winner",
        hidden: 0,
        description: "Win a competitive match",
        icon: "win123",
        icongray: "win123_gray",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MetadataEnricher", () => {
  let tmpDir: string;
  let conn: DatabaseConnection;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `aw-enricher-test-${String(Date.now())}`);
    mkdirSync(tmpDir, { recursive: true });
    conn = createInMemoryDb();
  });

  afterEach(() => {
    closeDatabase(conn.raw);
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("does nothing when schema has no achievements", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", { gameName: "CS2", gameVersion: "1" }); // no availableGameStats

    const gq = gameQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });

    const enricher = createMetadataEnricher(cache, "API_KEY");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    // Name was not changed
    expect(gq.getById("steam:730")?.name).toBe("730");
  });

  it("updates achievement display names from cached schema", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });
    aq.upsertMany("steam:730", [
      {
        id: "steam:730:ACH_FIRST_BLOOD",
        gameId: "steam:730",
        achievementId: "ACH_FIRST_BLOOD",
        name: "ACH_FIRST_BLOOD",
        description: "",
      },
    ]);

    const enricher = createMetadataEnricher(cache, "");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    const achs = aq.getByGameId("steam:730");
    expect(achs[0]?.name).toBe("First Blood");
    expect(achs[0]?.description).toBe("Get the first kill of a match");
    expect(achs[0]?.iconUrl).toContain("abc123");
    expect(achs[0]?.iconLockedUrl).toContain("abc123_gray");
  });

  it("updates game name when it was still the raw appId", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const gq = gameQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });

    const enricher = createMetadataEnricher(cache, "");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    expect(gq.getById("steam:730")?.name).toBe("Counter-Strike 2");
    expect(gq.getById("steam:730")?.iconUrl).toContain("730");
  });

  it("does not overwrite a game name that was already customised", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const gq = gameQueries(conn.drizzle);
    // Name is already a proper display name, not the raw appId
    gq.upsert({
      id: "steam:730",
      appId: "730",
      name: "Custom Name",
      source: "steam",
      installPath: "/g",
    });

    const enricher = createMetadataEnricher(cache, "");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    expect(gq.getById("steam:730")?.name).toBe("Custom Name");
  });

  it("is case-insensitive when matching achievement API names", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });
    aq.upsertMany("steam:730", [
      {
        id: "steam:730:ach_win",
        gameId: "steam:730",
        achievementId: "ach_win", // lowercase
        name: "ach_win",
        description: "",
      },
    ]);

    const enricher = createMetadataEnricher(cache, "");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    const achs = aq.getByGameId("steam:730");
    expect(achs[0]?.name).toBe("Winner");
  });

  it("skips achievements that have no matching schema entry", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });
    aq.upsertMany("steam:730", [
      {
        id: "steam:730:ACH_UNKNOWN",
        gameId: "steam:730",
        achievementId: "ACH_UNKNOWN",
        name: "ACH_UNKNOWN",
        description: "",
      },
    ]);

    const enricher = createMetadataEnricher(cache, "");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    // Name stays as original raw API name
    const achs = aq.getByGameId("steam:730");
    expect(achs[0]?.name).toBe("ACH_UNKNOWN");
  });

  it("fetches from API when cache miss and API key provided", async () => {
    const cache = createMetadataCache(tmpDir);

    // Mock fetchSteamSchema at the module level
    const steamMetadata = await import("../steam-metadata.js");
    const fetchSpy = vi.spyOn(steamMetadata, "fetchSteamSchema").mockResolvedValue(SCHEMA);

    const gq = gameQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });

    const enricher = createMetadataEnricher(cache, "REAL_API_KEY");
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    expect(fetchSpy).toHaveBeenCalledWith("730", "REAL_API_KEY");
    // Schema is now cached
    expect(cache.get("730")).not.toBeNull();
  });

  it("does not call API when no API key is provided and cache is empty", async () => {
    const cache = createMetadataCache(tmpDir);

    const steamMetadata = await import("../steam-metadata.js");
    const fetchSpy = vi.spyOn(steamMetadata, "fetchSteamSchema").mockResolvedValue(null);

    const gq = gameQueries(conn.drizzle);
    gq.upsert({ id: "steam:730", appId: "730", name: "730", source: "steam", installPath: "/g" });

    const enricher = createMetadataEnricher(cache, ""); // no key
    await enricher.enrichGame("730", "steam:730", conn.drizzle);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does nothing when game does not exist in DB", async () => {
    const cache = createMetadataCache(tmpDir);
    cache.set("730", SCHEMA);

    const enricher = createMetadataEnricher(cache, "");
    // Should not throw even when game is missing
    await expect(enricher.enrichGame("730", "steam:730", conn.drizzle)).resolves.toBeUndefined();
  });
});
