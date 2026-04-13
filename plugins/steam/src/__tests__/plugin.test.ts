import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock steam-user so tests don't depend on a real Steam installation
vi.mock("../steam-user.js", () => ({
  getSteamUserId: vi.fn(() => null),
}));

// Mock game-discovery so detectPaths() / parse() don't need real manifests
vi.mock("../game-discovery.js", () => ({
  getInstalledSteamGames: vi.fn(() => []),
}));

import { steamPlugin, configureSteamPlugin } from "../index.js";

const env = (process as { env: Record<string, string | undefined> }).env;

describe("Steam plugin", () => {
  it("has correct id", () => {
    expect(steamPlugin.id).toBe("steam");
  });

  it("has correct source", () => {
    expect(steamPlugin.source).toBe("native");
  });

  it("has correct name", () => {
    expect(steamPlugin.name).toBe("Steam");
  });

  it("detectPaths returns an array", () => {
    const paths = steamPlugin.detectPaths();
    expect(Array.isArray(paths)).toBe(true);
  });

  it("detectGame returns false for non-numeric appId", async () => {
    expect(await steamPlugin.detectGame("/some/path/common")).toBe(false);
  });

  it("detectGame returns false for nonexistent path", async () => {
    expect(await steamPlugin.detectGame("/nonexistent/path/12345")).toBe(false);
  });

  it("watchPatterns returns empty array (API-based, no local files)", () => {
    const patterns = steamPlugin.watchPatterns("/some/steamapps/220");
    expect(patterns).toEqual([]);
  });

  describe("parse", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      // Reset config
      configureSteamPlugin({ apiKey: "", steamId: "" });
      delete env["STEAM_API_KEY"];
    });

    it("returns NO_API_KEY error when no key is configured", async () => {
      configureSteamPlugin({ apiKey: "" });
      delete env["STEAM_API_KEY"];

      const result = await steamPlugin.parse("/steamapps/220");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NO_API_KEY");
      }
    });

    it("returns NO_STEAM_USER error when no user ID is available", async () => {
      configureSteamPlugin({ apiKey: "TESTKEY", steamId: "" });

      const result = await steamPlugin.parse("/steamapps/220");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NO_STEAM_USER");
      }
    });

    it("returns API_ERROR when fetch returns null", async () => {
      configureSteamPlugin({ apiKey: "TESTKEY", steamId: "76561198012345678" });
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await steamPlugin.parse("/steamapps/220");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("API_ERROR");
      }
    });

    it("returns parsed achievements on successful API response", async () => {
      configureSteamPlugin({ apiKey: "TESTKEY", steamId: "76561198012345678" });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            playerstats: {
              success: true,
              achievements: [
                { apiname: "ACH_WIN", achieved: 1, unlocktime: 1700000000 },
                { apiname: "ACH_LOSE", achieved: 0, unlocktime: 0 },
              ],
            },
          }),
      });

      const result = await steamPlugin.parse("/steamapps/220");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.appId).toBe("220");
        expect(result.data.achievements).toHaveLength(2);

        const won = result.data.achievements.find((a) => a.id === "ACH_WIN");
        expect(won?.unlocked).toBe(true);
        expect(won?.unlockTime).toBe(1700000000);

        const lost = result.data.achievements.find((a) => a.id === "ACH_LOSE");
        expect(lost?.unlocked).toBe(false);
        expect(lost?.unlockTime).toBeUndefined();
      }
    });

    it("uses STEAM_API_KEY env var as fallback", async () => {
      configureSteamPlugin({ apiKey: "", steamId: "76561198012345678" });
      env["STEAM_API_KEY"] = "ENV_KEY";

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            playerstats: { success: true, achievements: [] },
          }),
      });

      const result = await steamPlugin.parse("/steamapps/220");

      // Should reach the API (not the NO_API_KEY error)
      // Empty achievements means API_ERROR (null check on empty array)
      // Actually empty array is still truthy, so it returns ok with 0 achievements
      expect(result.ok).toBe(true);

      const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("key=ENV_KEY");
    });
  });
});
