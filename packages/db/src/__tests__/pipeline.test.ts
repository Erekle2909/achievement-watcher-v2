/**
 * End-to-end data pipeline test.
 *
 * Mimics the exact sequence: discovery upsert -> enricher updateMetadata ->
 * IPC getByGameId -> verify React-visible fields.
 *
 * This test reproduces the four UI bugs:
 *  1. Achievement icons missing (emoji fallbacks)
 *  2. Achievement API names instead of display names
 *  3. Game names showing as appId or directory names
 *  4. Missing game header images
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDatabase, closeDatabase, type DatabaseConnection } from "../connection.js";
import { gameQueries } from "../queries/games.js";
import { achievementQueries } from "../queries/achievements.js";

function createTestDb(): DatabaseConnection {
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

describe("Data pipeline: discovery -> enrichment -> IPC read", () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = createTestDb();
  });

  afterEach(() => {
    closeDatabase(conn.raw);
  });

  it("enriched icons survive through the full pipeline", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);

    // -- Step 1: Discovery upserts game with raw appId as name --
    gq.upsert({
      id: "steam-emu:3634520",
      appId: "3634520",
      name: "3634520", // Goldberg: appId as name
      source: "steam-emu",
      installPath: "C:/GSE/3634520",
      iconUrl: "https://cdn.akamai.steamstatic.com/steam/apps/3634520/header.jpg",
    });

    // -- Step 2: Discovery upserts achievements with raw API names --
    aq.upsertMany("steam-emu:3634520", [
      {
        id: "steam-emu:3634520:Ach_First_POI",
        gameId: "steam-emu:3634520",
        achievementId: "Ach_First_POI",
        name: "Ach_First_POI", // API name, not display name
        description: "",
        iconUrl: "", // Empty -- no icon from plugin
        iconLockedUrl: undefined,
        unlocked: true,
        unlockTime: 1700000000,
      },
      {
        id: "steam-emu:3634520:Ach_Win",
        gameId: "steam-emu:3634520",
        achievementId: "Ach_Win",
        name: "Ach_Win",
        description: "",
        iconUrl: "", // Empty
        iconLockedUrl: undefined,
        unlocked: false,
      },
    ]);

    // -- Step 3: Enricher updates achievement metadata from Steam schema --
    aq.updateMetadata(
      "steam-emu:3634520:Ach_First_POI",
      "POI",
      "Discover your first Point of Interest",
      "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/3634520/poi_icon.jpg",
      "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/3634520/poi_gray.jpg",
    );
    aq.updateMetadata(
      "steam-emu:3634520:Ach_Win",
      "Winner!",
      "Win your first match",
      "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/3634520/win_icon.jpg",
      "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/3634520/win_gray.jpg",
    );

    // -- Step 4: Enricher updates game name --
    const existing = gq.getById("steam-emu:3634520");
    expect(existing).toBeDefined();
    gq.upsert({
      id: existing?.id ?? "",
      appId: existing?.appId ?? "",
      name: "Samson",
      source: existing?.source ?? "",
      installPath: existing?.installPath ?? "",
      iconUrl: "https://cdn.akamai.steamstatic.com/steam/apps/3634520/header.jpg",
    });

    // -- Step 5: IPC handler reads (same as games:getDetails) --
    const game = gq.getById("steam-emu:3634520");
    const achievements = aq.getByGameId("steam-emu:3634520");

    // -- Verify game data (fixes symptoms 3 & 4) --
    expect(game).toBeDefined();
    expect(game?.name).toBe("Samson");
    expect(game?.iconUrl).toContain("header.jpg");

    // -- Verify achievement data (fixes symptoms 1 & 2) --
    expect(achievements).toHaveLength(2);

    const poi = achievements.find((a) => a.achievementId === "Ach_First_POI");
    expect(poi).toBeDefined();
    expect(poi?.name).toBe("POI"); // NOT "Ach_First_POI"
    expect(poi?.description).toBe("Discover your first Point of Interest");
    expect(poi?.iconUrl).toContain("poi_icon.jpg"); // NOT "" or null
    expect(poi?.iconLockedUrl).toContain("poi_gray.jpg");

    const win = achievements.find((a) => a.achievementId === "Ach_Win");
    expect(win).toBeDefined();
    expect(win?.name).toBe("Winner!");
    expect(win?.iconUrl).toContain("win_icon.jpg");
  });

  it("rescan does NOT wipe enriched metadata when plugin returns empty icons", () => {
    const gq = gameQueries(conn.drizzle);
    const aq = achievementQueries(conn.drizzle);

    // Initial discovery + enrichment
    gq.upsert({
      id: "steam-emu:100",
      appId: "100",
      name: "100",
      source: "steam-emu",
      installPath: "/game",
    });
    aq.upsertMany("steam-emu:100", [
      {
        id: "steam-emu:100:ACH1",
        gameId: "steam-emu:100",
        achievementId: "ACH1",
        name: "ACH1",
        description: "",
        iconUrl: "",
        unlocked: true,
        unlockTime: 1000,
      },
    ]);
    aq.updateMetadata(
      "steam-emu:100:ACH1",
      "First Blood",
      "Get the first kill",
      "https://cdn.example.com/icon.jpg",
      "https://cdn.example.com/icon_gray.jpg",
    );

    // Verify enriched data is there
    let achs = aq.getByGameId("steam-emu:100");
    expect(achs[0]?.name).toBe("First Blood");
    expect(achs[0]?.iconUrl).toBe("https://cdn.example.com/icon.jpg");

    // -- Simulate rescan: upsertMany called again with raw plugin data --
    aq.upsertMany("steam-emu:100", [
      {
        id: "steam-emu:100:ACH1",
        gameId: "steam-emu:100",
        achievementId: "ACH1",
        name: "ACH1", // Raw API name again
        description: "",
        iconUrl: "", // Empty icon again
        unlocked: true,
        unlockTime: 1000,
      },
    ]);

    // After rescan's upsertMany but BEFORE enricher runs again:
    achs = aq.getByGameId("steam-emu:100");

    // FIX: upsertMany no longer overwrites enriched metadata on conflict.
    // The enriched name and icon URL are preserved through rescans.
    expect(achs[0]?.name).toBe("First Blood");
    expect(achs[0]?.iconUrl).toBe("https://cdn.example.com/icon.jpg");
    expect(achs[0]?.iconLockedUrl).toBe("https://cdn.example.com/icon_gray.jpg");
  });

  it("game name should not be overwritten by rescan when enricher already set it", () => {
    const gq = gameQueries(conn.drizzle);

    // Initial discovery
    gq.upsert({
      id: "steam-emu:100",
      appId: "100",
      name: "100",
      source: "steam-emu",
      installPath: "/game",
    });

    // Enricher updates name
    const existing = gq.getById("steam-emu:100");
    expect(existing).toBeDefined();
    gq.upsert({
      id: existing?.id ?? "",
      appId: existing?.appId ?? "",
      name: "Real Game Name",
      source: existing?.source ?? "",
      installPath: existing?.installPath ?? "",
      iconUrl: "https://cdn.example.com/header.jpg",
    });
    expect(gq.getById("steam-emu:100")?.name).toBe("Real Game Name");

    // Rescan: discovery upserts with raw appId as name again
    gq.upsert({
      id: "steam-emu:100",
      appId: "100",
      name: "100", // Raw appId again
      source: "steam-emu",
      installPath: "/game",
      iconUrl: "https://cdn.akamai.steamstatic.com/steam/apps/100/header.jpg",
    });

    // FIX: game name is preserved because upsert detects name == appId
    // and keeps the existing enriched name.
    expect(gq.getById("steam-emu:100")?.name).toBe("Real Game Name");
  });

  it("game upsert DOES update name when plugin provides a real name", () => {
    const gq = gameQueries(conn.drizzle);

    // Initial discovery with raw appId as name
    gq.upsert({
      id: "native:100",
      appId: "100",
      name: "100",
      source: "native",
      installPath: "/game",
    });

    // Second upsert from Steam plugin with a REAL game name (not appId)
    gq.upsert({
      id: "native:100",
      appId: "100",
      name: "Counter-Strike 2", // Real name from GetOwnedGames
      source: "native",
      installPath: "/game",
      iconUrl: "https://cdn.akamai.steamstatic.com/steam/apps/100/header.jpg",
    });

    // Name should be updated to the real name
    expect(gq.getById("native:100")?.name).toBe("Counter-Strike 2");
  });
});
