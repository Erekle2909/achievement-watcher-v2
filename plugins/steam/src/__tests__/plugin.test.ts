import { describe, it, expect } from "vitest";
import { steamPlugin } from "../index.js";

describe("Steam plugin", () => {
  it("has correct id", () => {
    expect(steamPlugin.id).toBe("steam");
  });
  it("has correct source", () => {
    expect(steamPlugin.source).toBe("native");
  });
  it("detectGame returns false", async () => {
    expect(await steamPlugin.detectGame("/any")).toBe(false);
  });
  it("parse returns not-implemented", async () => {
    const r = await steamPlugin.parse("/any");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NOT_IMPLEMENTED");
  });
});
