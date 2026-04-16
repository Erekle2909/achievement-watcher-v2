import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { smartSteamEmuPlugin } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

// detectGame requires a numeric directory name (Steam appId).
// Create a temp directory with a numeric name for tests that call detectGame/parse.
const numericDir = join(__dirname, "99999");
const numericIniDir = join(numericDir, "ini-only");

describe("SmartSteamEmu plugin", () => {
  beforeEach(() => {
    mkdirSync(numericDir, { recursive: true });
    copyFileSync(join(fixturesDir, "stats.bin"), join(numericDir, "stats.bin"));
    copyFileSync(join(fixturesDir, "achievements.ini"), join(numericDir, "achievements.ini"));
  });

  afterEach(() => {
    if (existsSync(numericDir)) {
      rmSync(numericDir, { recursive: true });
    }
  });

  it("has correct id", () => {
    expect(smartSteamEmuPlugin.id).toBe("smartsteamemu");
  });

  it("has correct source", () => {
    expect(smartSteamEmuPlugin.source).toBe("steam-emu");
  });

  it("returns detect paths", () => {
    const paths = smartSteamEmuPlugin.detectPaths();
    expect(paths.length).toBeGreaterThanOrEqual(0);
  });

  it("returns watch patterns for both bin and ini", () => {
    const patterns = smartSteamEmuPlugin.watchPatterns("/some/path");
    expect(patterns.some((p) => p.includes("stats.bin"))).toBe(true);
    expect(patterns.some((p) => p.includes("achievements.ini"))).toBe(true);
  });

  it("detectGame returns true when stats.bin exists in numeric dir", async () => {
    expect(await smartSteamEmuPlugin.detectGame(numericDir)).toBe(true);
  });

  it("detectGame returns false for non-numeric directory names", async () => {
    expect(await smartSteamEmuPlugin.detectGame(fixturesDir)).toBe(false);
  });

  it("detectGame returns false for nonexistent path", async () => {
    expect(await smartSteamEmuPlugin.detectGame("/nonexistent/12345")).toBe(false);
  });

  it("parses stats.bin binary file", async () => {
    const result = await smartSteamEmuPlugin.parse(numericDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.achievements).toHaveLength(2);
    const achieved = result.data.achievements.filter((a) => a.unlocked);
    const locked = result.data.achievements.filter((a) => !a.unlocked);
    expect(achieved).toHaveLength(1);
    expect(locked).toHaveLength(1);
    expect(achieved[0]?.unlockTime).toBe(1700000000);
  });

  it("parses achievements.ini when no stats.bin present", async () => {
    mkdirSync(numericIniDir, { recursive: true });
    copyFileSync(join(fixturesDir, "achievements.ini"), join(numericIniDir, "achievements.ini"));

    try {
      const result = await smartSteamEmuPlugin.parse(numericIniDir);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.achievements).toHaveLength(2);
      const achieved = result.data.achievements.filter((a) => a.unlocked);
      expect(achieved).toHaveLength(1);
      expect(achieved[0]?.id).toBe("ACH_INI_FIRST");
      expect(achieved[0]?.unlockTime).toBe(1700000001);
    } finally {
      rmSync(numericIniDir, { recursive: true });
    }
  });

  it("returns error when no data files found", async () => {
    const result = await smartSteamEmuPlugin.parse("/nonexistent/path/12345");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NO_DATA");
  });

  it("appId is derived from gamePath basename", async () => {
    const result = await smartSteamEmuPlugin.parse(numericDir);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.appId).toBe("99999");
  });
});
