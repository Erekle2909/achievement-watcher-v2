import { describe, it, expect } from "vitest";
import { goldbergPlugin } from "../index.js";

describe("Goldberg plugin", () => {
  it("has correct id", () => {
    expect(goldbergPlugin.id).toBe("goldberg");
  });
  it("has correct source", () => {
    expect(goldbergPlugin.source).toBe("steam-emu");
  });
  it("returns detect paths", () => {
    const paths = goldbergPlugin.detectPaths();
    expect(paths.length).toBeGreaterThanOrEqual(0);
  });
  it("returns watch patterns", () => {
    const patterns = goldbergPlugin.watchPatterns("/some/path");
    expect(patterns.some((p) => p.includes("achievements.json"))).toBe(true);
  });
  it("detectGame returns false for nonexistent path", async () => {
    expect(await goldbergPlugin.detectGame("/nonexistent/12345")).toBe(false);
  });
});
