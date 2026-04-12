import { describe, it, expect } from "vitest";
import { parseAchievementIni } from "../ini-parser.js";

const SAMPLE_INI = `
[ACH_FIRST_BLOOD]
Achieved=1
CurProgress=0
MaxProgress=0
UnlockTime=1700000000

[ACH_COMPLETE_GAME]
Achieved=0
CurProgress=0
MaxProgress=0
UnlockTime=0

[SteamAchievements]
00000=ACH_FIRST_BLOOD
00001=ACH_COMPLETE_GAME
Count=2
`;

describe("parseAchievementIni", () => {
  it("parses all sections", () => {
    const result = parseAchievementIni(SAMPLE_INI);
    expect(result.size).toBe(3);
    expect(result.has("ACH_FIRST_BLOOD")).toBe(true);
    expect(result.has("ACH_COMPLETE_GAME")).toBe(true);
    expect(result.has("SteamAchievements")).toBe(true);
  });

  it("parses key-value pairs correctly", () => {
    const result = parseAchievementIni(SAMPLE_INI);
    const ach = result.get("ACH_FIRST_BLOOD");
    expect(ach).toBeDefined();
    expect(ach?.["Achieved"]).toBe("1");
    expect(ach?.["UnlockTime"]).toBe("1700000000");
  });

  it("handles locked achievement", () => {
    const result = parseAchievementIni(SAMPLE_INI);
    const ach = result.get("ACH_COMPLETE_GAME");
    expect(ach?.["Achieved"]).toBe("0");
    expect(ach?.["UnlockTime"]).toBe("0");
  });

  it("ignores comment lines starting with ;", () => {
    const ini = `; this is a comment\n[SECTION]\nkey=value`;
    const result = parseAchievementIni(ini);
    expect(result.has("SECTION")).toBe(true);
    expect(result.get("SECTION")?.["key"]).toBe("value");
  });

  it("ignores comment lines starting with #", () => {
    const ini = `# comment\n[SECTION]\nkey=value`;
    const result = parseAchievementIni(ini);
    expect(result.get("SECTION")?.["key"]).toBe("value");
  });

  it("returns empty map for empty input", () => {
    expect(parseAchievementIni("").size).toBe(0);
  });

  it("handles CRLF line endings", () => {
    const ini = "[ACH]\r\nAchieved=1\r\nUnlockTime=123\r\n";
    const result = parseAchievementIni(ini);
    expect(result.get("ACH")?.["Achieved"]).toBe("1");
  });
});
