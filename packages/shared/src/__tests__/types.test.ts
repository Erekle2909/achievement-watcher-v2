import { describe, it, expectTypeOf } from "vitest";
import type {
  Achievement,
  ParsedGame,
  ParseResult,
  AchievementPlugin,
  GameEntry,
  GameDetails,
  EngineEvents,
  Settings,
  NotificationMethod,
  NotificationConfig,
} from "../types/index.js";

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

describe("Game types", () => {
  it("GameEntry has required fields", () => {
    expectTypeOf<GameEntry>().toHaveProperty("id");
    expectTypeOf<GameEntry>().toHaveProperty("appId");
    expectTypeOf<GameEntry>().toHaveProperty("name");
    expectTypeOf<GameEntry>().toHaveProperty("source");
    expectTypeOf<GameEntry>().toHaveProperty("installPath");
  });

  it("GameDetails extends GameEntry with achievements", () => {
    expectTypeOf<GameDetails>().toHaveProperty("achievements");
    expectTypeOf<GameDetails>().toHaveProperty("totalAchievements");
    expectTypeOf<GameDetails>().toHaveProperty("unlockedAchievements");
  });
});

describe("Event types", () => {
  it("EngineEvents has all event keys", () => {
    expectTypeOf<EngineEvents>().toHaveProperty("achievement:unlocked");
    expectTypeOf<EngineEvents>().toHaveProperty("game:discovered");
    expectTypeOf<EngineEvents>().toHaveProperty("game:removed");
    expectTypeOf<EngineEvents>().toHaveProperty("scan:started");
    expectTypeOf<EngineEvents>().toHaveProperty("scan:completed");
    expectTypeOf<EngineEvents>().toHaveProperty("error");
  });

  it("error event has severity field", () => {
    type ErrorEvent = EngineEvents["error"];
    expectTypeOf<ErrorEvent>().toHaveProperty("severity");
  });
});

describe("Settings types", () => {
  it("Settings has notification config", () => {
    expectTypeOf<Settings>().toHaveProperty("notifications");
  });

  it("Settings has scan paths", () => {
    expectTypeOf<Settings>().toHaveProperty("scanPaths");
  });

  it("Settings has theme", () => {
    expectTypeOf<Settings>().toHaveProperty("theme");
  });
});

describe("Notification types", () => {
  it("NotificationMethod is a union of valid methods", () => {
    const method: NotificationMethod = "toast";
    expectTypeOf(method).toExtend<NotificationMethod>();
  });

  it("NotificationConfig has required fields", () => {
    expectTypeOf<NotificationConfig>().toHaveProperty("enabled");
    expectTypeOf<NotificationConfig>().toHaveProperty("overlayDuration");
  });
});
