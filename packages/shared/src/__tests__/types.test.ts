import { describe, it, expectTypeOf } from "vitest";
import type { Achievement, ParsedGame, ParseResult } from "../types/index.js";

describe("Achievement types", () => {
  it("Achievement has required fields", () => {
    expectTypeOf<Achievement>().toHaveProperty("id");
    expectTypeOf<Achievement>().toHaveProperty("name");
    expectTypeOf<Achievement>().toHaveProperty("description");
    expectTypeOf<Achievement>().toHaveProperty("icon");
    expectTypeOf<Achievement>().toHaveProperty("unlocked");
  });

  it("Achievement has optional fields", () => {
    const achievement: Achievement = {
      id: "ACH_001",
      name: "First Blood",
      description: "Get your first kill",
      icon: "https://example.com/icon.png",
      unlocked: true,
      unlockTime: 1700000000,
    };
    expectTypeOf(achievement).toExtend<Achievement>();
  });

  it("ParseResult success variant", () => {
    const success: ParseResult<ParsedGame> = {
      ok: true,
      data: {
        appId: "12345",
        name: "Test Game",
        achievements: [],
      },
    };
    expectTypeOf(success).toExtend<ParseResult<ParsedGame>>();
  });

  it("ParseResult error variant", () => {
    const failure: ParseResult<ParsedGame> = {
      ok: false,
      error: {
        code: "PARSE_FAILED",
        message: "Invalid file format",
      },
    };
    expectTypeOf(failure).toExtend<ParseResult<ParsedGame>>();
  });
});
