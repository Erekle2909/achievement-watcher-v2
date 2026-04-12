import { describe, it, expect } from "vitest";
import {
  getSteamHeaderUrl,
  getSteamAchievementIconUrl,
  buildSteamApiUrl,
} from "../steam-metadata.js";

describe("Steam metadata utilities", () => {
  it("builds correct header image URL", () => {
    expect(getSteamHeaderUrl("12345")).toBe(
      "https://cdn.akamai.steamstatic.com/steam/apps/12345/header.jpg",
    );
  });

  it("builds correct achievement icon URL", () => {
    expect(getSteamAchievementIconUrl("12345", "abc123")).toBe(
      "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/12345/abc123.jpg",
    );
  });

  it("builds correct API URL", () => {
    const url = buildSteamApiUrl("12345", "KEY", "english");
    expect(url).toContain("appid=12345");
    expect(url).toContain("key=KEY");
    expect(url).toContain("l=english");
  });

  it("defaults to english language", () => {
    expect(buildSteamApiUrl("12345", "KEY")).toContain("l=english");
  });
});
