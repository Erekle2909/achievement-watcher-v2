import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPlayerAchievements } from "../api.js";

describe("fetchPlayerAchievements", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns achievements on successful response", async () => {
    const mockAchievements = [
      { apiname: "ACH_WIN_GAME", achieved: 1, unlocktime: 1700000000 },
      { apiname: "ACH_FIND_SECRET", achieved: 0, unlocktime: 0 },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          playerstats: {
            success: true,
            achievements: mockAchievements,
          },
        }),
    });

    const result = await fetchPlayerAchievements("220", "TESTAPIKEY", "76561198012345678");

    expect(result).toEqual(mockAchievements);
    expect(globalThis.fetch).toHaveBeenCalledOnce();

    const calledUrl = vi.mocked(globalThis.fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("appid=220");
    expect(calledUrl).toContain("key=TESTAPIKEY");
    expect(calledUrl).toContain("steamid=76561198012345678");
  });

  it("returns null when response is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    const result = await fetchPlayerAchievements("220", "BADKEY", "76561198012345678");
    expect(result).toBeNull();
  });

  it("returns null when playerstats.success is false", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          playerstats: {
            success: false,
          },
        }),
    });

    const result = await fetchPlayerAchievements("220", "KEY", "76561198012345678");
    expect(result).toBeNull();
  });

  it("returns null when fetch throws (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchPlayerAchievements("220", "KEY", "76561198012345678");
    expect(result).toBeNull();
  });

  it("returns null when response JSON has no playerstats", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await fetchPlayerAchievements("220", "KEY", "76561198012345678");
    expect(result).toBeNull();
  });
});
