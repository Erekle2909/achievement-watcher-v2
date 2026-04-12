import { describe, it, expect } from "vitest";
import { getTableName } from "drizzle-orm";
import { games, achievements, sessions, settings, pluginState } from "../schema/index.js";

describe("Database schema", () => {
  it("games table has correct name", () => {
    expect(getTableName(games)).toBe("games");
  });

  it("achievements table has correct name", () => {
    expect(getTableName(achievements)).toBe("achievements");
  });

  it("sessions table has correct name", () => {
    expect(getTableName(sessions)).toBe("sessions");
  });

  it("settings table has correct name", () => {
    expect(getTableName(settings)).toBe("settings");
  });

  it("pluginState table has correct name", () => {
    expect(getTableName(pluginState)).toBe("plugin_state");
  });
});
