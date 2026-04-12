import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEmpressSave } from "../parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

describe("EMPRESS save parser", () => {
  it("parses achievements from JSON fixture", async () => {
    const result = await parseEmpressSave(join(fixturesDir, "achievements.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
  });

  it("identifies unlocked achievement correctly", async () => {
    const result = await parseEmpressSave(join(fixturesDir, "achievements.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const unlocked = result.data.find((a) => a.id === "ACH_FIRST_BLOOD");
    expect(unlocked).toBeDefined();
    expect(unlocked?.unlocked).toBe(true);
    expect(unlocked?.unlockTime).toBe(1700000000);
  });

  it("identifies locked achievement correctly", async () => {
    const result = await parseEmpressSave(join(fixturesDir, "achievements.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const locked = result.data.find((a) => a.id === "ACH_COMPLETE_GAME");
    expect(locked).toBeDefined();
    expect(locked?.unlocked).toBe(false);
    expect(locked?.unlockTime).toBeUndefined();
  });

  it("returns error for nonexistent file", async () => {
    const result = await parseEmpressSave("/nonexistent/achievements.json");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("FILE_NOT_FOUND");
  });

  it("returns error for malformed JSON", async () => {
    const { writeFileSync, unlinkSync } = await import("node:fs");
    const tmpPath = join(fixturesDir, "bad.json");
    writeFileSync(tmpPath, "not json{{{");
    const result = await parseEmpressSave(tmpPath);
    unlinkSync(tmpPath);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PARSE_ERROR");
  });
});
