import { describe, it, expect } from "vitest";
import type { AchievementPlugin, ParseResult, ParsedGame } from "@achievement-watcher/shared";
import { createPluginRegistry } from "../plugin-loader.js";

function createMockPlugin(id: string): AchievementPlugin {
  return {
    id,
    name: `Mock ${id}`,
    source: "test",
    detectPaths: () => ["/fake/path"],
    detectGame: (_dir: string) => Promise.resolve(false),
    parse: (_path: string): Promise<ParseResult<ParsedGame>> =>
      Promise.resolve({
        ok: true,
        data: { appId: "0", name: "mock", achievements: [] },
      }),
    watchPatterns: (_path: string) => [],
  };
}

describe("Plugin Registry", () => {
  it("registers a plugin", () => {
    const registry = createPluginRegistry();
    registry.register(createMockPlugin("test"));
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get("test")).toBeDefined();
  });

  it("prevents duplicate registration", () => {
    const registry = createPluginRegistry();
    registry.register(createMockPlugin("test"));
    expect(() => {
      registry.register(createMockPlugin("test"));
    }).toThrow(/already registered/);
  });

  it("returns undefined for unknown plugin", () => {
    expect(createPluginRegistry().get("nope")).toBeUndefined();
  });

  it("unregisters a plugin", () => {
    const registry = createPluginRegistry();
    registry.register(createMockPlugin("p1"));
    registry.unregister("p1");
    expect(registry.getAll()).toHaveLength(0);
  });

  it("filters enabled plugins", () => {
    const registry = createPluginRegistry();
    registry.register(createMockPlugin("p1"));
    registry.register(createMockPlugin("p2"));
    registry.disable("p1");
    expect(registry.getEnabled()).toHaveLength(1);
    expect(registry.getEnabled()[0]?.id).toBe("p2");
  });
});
