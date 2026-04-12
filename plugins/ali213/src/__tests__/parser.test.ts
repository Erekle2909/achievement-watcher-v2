import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAli213Save } from "../parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

describe("ALI213 save parser", () => {
  it("parses achievements from INI fixture", async () => {
    const result = await parseAli213Save(join(fixturesDir, "achievements.ini"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
  });

  it("identifies unlocked achievement correctly", async () => {
    const result = await parseAli213Save(join(fixturesDir, "achievements.ini"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const unlocked = result.data.find((a) => a.id === "ACH_FIRST_BLOOD");
    expect(unlocked).toBeDefined();
    expect(unlocked?.unlocked).toBe(true);
    expect(unlocked?.unlockTime).toBe(1700000000);
  });

  it("identifies locked achievement correctly", async () => {
    const result = await parseAli213Save(join(fixturesDir, "achievements.ini"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const locked = result.data.find((a) => a.id === "ACH_COMPLETE_GAME");
    expect(locked).toBeDefined();
    expect(locked?.unlocked).toBe(false);
    expect(locked?.unlockTime).toBeUndefined();
  });

  it("returns error for nonexistent file", async () => {
    const result = await parseAli213Save("/nonexistent/achievements.ini");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("FILE_NOT_FOUND");
  });

  it("skips SteamAchievements index section", async () => {
    const result = await parseAli213Save(join(fixturesDir, "achievements.ini"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const indexSection = result.data.find((a) => a.id === "SteamAchievements");
    expect(indexSection).toBeUndefined();
  });
});
