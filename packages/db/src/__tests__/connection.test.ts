import { describe, it, expect, afterEach } from "vitest";
import { createDatabase, closeDatabase } from "../connection.js";
import { games } from "../schema/index.js";

describe("Database connection", () => {
  let cleanup: (() => void)[] = [];

  afterEach(() => {
    cleanup.forEach((fn) => {
      fn();
    });
    cleanup = [];
  });

  it("creates an in-memory database", () => {
    const conn = createDatabase(":memory:");
    cleanup.push(() => {
      closeDatabase(conn.raw);
    });
    expect(conn).toBeDefined();
    expect(conn.drizzle).toBeDefined();
    expect(conn.raw).toBeDefined();
  });

  it("can insert and query games", () => {
    const conn = createDatabase(":memory:");
    cleanup.push(() => {
      closeDatabase(conn.raw);
    });

    // Create the table manually for in-memory testing
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

    conn.drizzle
      .insert(games)
      .values({
        id: "test-1",
        appId: "12345",
        name: "Test Game",
        source: "steam",
        installPath: "C:/Games/TestGame",
      })
      .run();

    const results = conn.drizzle.select().from(games).all();
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("Test Game");
  });
});
