import { describe, it, expectTypeOf } from "vitest";
import type { Achievement, ParsedGame, ParseResult, AchievementPlugin } from "../types/index.js";

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

describe("Plugin types", () => {
  it("AchievementPlugin has required methods", () => {
    expectTypeOf<AchievementPlugin>().toHaveProperty("id");
    expectTypeOf<AchievementPlugin>().toHaveProperty("name");
    expectTypeOf<AchievementPlugin>().toHaveProperty("source");
    expectTypeOf<AchievementPlugin>().toHaveProperty("detectPaths");
    expectTypeOf<AchievementPlugin>().toHaveProperty("detectGame");
    expectTypeOf<AchievementPlugin>().toHaveProperty("parse");
    expectTypeOf<AchievementPlugin>().toHaveProperty("watchPatterns");
  });

  it("detectGame returns Promise<boolean>", () => {
    expectTypeOf<AchievementPlugin["detectGame"]>().returns.toEqualTypeOf<Promise<boolean>>();
  });

  it("parse returns Promise<ParseResult<ParsedGame>>", () => {
    expectTypeOf<AchievementPlugin["parse"]>().returns.toEqualTypeOf<
      Promise<ParseResult<ParsedGame>>
    >();
  });
});
