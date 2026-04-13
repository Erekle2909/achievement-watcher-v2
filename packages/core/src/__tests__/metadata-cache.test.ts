import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, utimesSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMetadataCache } from "../metadata-cache.js";
import type { SteamGameSchema } from "../steam-metadata.js";
// Type-only import pulls in project resolution for @types/node
import type {} from "@achievement-watcher/db";

const SAMPLE_SCHEMA: SteamGameSchema = {
  gameName: "Test Game",
  gameVersion: "1",
  availableGameStats: {
    achievements: [
      {
        name: "ACH_FIRST",
        defaultvalue: 0,
        displayName: "First Blood",
        hidden: 0,
        description: "Kill your first enemy",
        icon: "abc123",
        icongray: "abc123_gray",
      },
    ],
  },
};

describe("MetadataCache", () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = join(tmpdir(), `aw-cache-test-${String(Date.now())}`);
  });

  afterEach(() => {
    rmSync(cacheDir, { recursive: true, force: true });
  });

  it("creates the cache directory if it does not exist", () => {
    createMetadataCache(cacheDir);
    expect(existsSync(cacheDir)).toBe(true);
  });

  it("returns null for a missing entry", () => {
    const cache = createMetadataCache(cacheDir);
    expect(cache.get("99999")).toBeNull();
  });

  it("stores and retrieves a schema", () => {
    const cache = createMetadataCache(cacheDir);
    cache.set("12345", SAMPLE_SCHEMA);
    const result = cache.get("12345");
    expect(result).not.toBeNull();
    expect(result?.gameName).toBe("Test Game");
    expect(result?.availableGameStats?.achievements?.[0]?.displayName).toBe("First Blood");
  });

  it("returns null for a different appId than what was stored", () => {
    const cache = createMetadataCache(cacheDir);
    cache.set("12345", SAMPLE_SCHEMA);
    expect(cache.get("99999")).toBeNull();
  });

  it("returns null for an expired entry (file mtime > 6 months ago)", () => {
    const cache = createMetadataCache(cacheDir);
    cache.set("12345", SAMPLE_SCHEMA);

    // Back-date the file modification time to 7 months ago
    const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000);
    utimesSync(join(cacheDir, "12345.json"), sevenMonthsAgo, sevenMonthsAgo);

    expect(cache.get("12345")).toBeNull();
  });

  it("returns data for an entry within the 6-month window", () => {
    const cache = createMetadataCache(cacheDir);
    cache.set("12345", SAMPLE_SCHEMA);

    // Back-date to 5 months ago — still valid
    const fiveMonthsAgo = new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000);
    utimesSync(join(cacheDir, "12345.json"), fiveMonthsAgo, fiveMonthsAgo);

    expect(cache.get("12345")?.gameName).toBe("Test Game");
  });

  it("returns null for a corrupted JSON file", () => {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(join(cacheDir, "99999.json"), "not valid json {{{{");
    const cache = createMetadataCache(cacheDir);
    expect(cache.get("99999")).toBeNull();
  });

  it("overwrites existing cache entry on set", () => {
    const cache = createMetadataCache(cacheDir);
    cache.set("12345", SAMPLE_SCHEMA);
    cache.set("12345", { ...SAMPLE_SCHEMA, gameName: "Updated Name" });
    expect(cache.get("12345")?.gameName).toBe("Updated Name");
  });
});
