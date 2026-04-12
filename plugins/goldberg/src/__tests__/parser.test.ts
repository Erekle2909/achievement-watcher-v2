import { describe, it, expect } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGoldbergSave } from "../parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");

describe("Goldberg save parser", () => {
  it("parses fully unlocked save", async () => {
    const result = await parseGoldbergSave(join(fixturesDir, "save-unlocked.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    expect(result.data.every((a) => a.unlocked)).toBe(true);
    expect(result.data[0]?.id).toBe("ACH_FIRST_BLOOD");
    expect(result.data[0]?.unlockTime).toBe(1700000000);
  });

  it("parses mixed locked/unlocked save", async () => {
    const result = await parseGoldbergSave(join(fixturesDir, "save-mixed.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(3);
    expect(result.data.filter((a) => a.unlocked)).toHaveLength(1);
  });

  it("parses empty save", async () => {
    const result = await parseGoldbergSave(join(fixturesDir, "save-empty.json"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(0);
  });

  it("returns error for nonexistent file", async () => {
    const result = await parseGoldbergSave("/nonexistent/path.json");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("FILE_NOT_FOUND");
  });

  it("returns error for malformed JSON", async () => {
    const { writeFileSync, unlinkSync } = await import("node:fs");
    const tmpPath = join(fixturesDir, "bad.json");
    writeFileSync(tmpPath, "not json{{{");
    const result = await parseGoldbergSave(tmpPath);
    unlinkSync(tmpPath);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PARSE_ERROR");
  });
});
