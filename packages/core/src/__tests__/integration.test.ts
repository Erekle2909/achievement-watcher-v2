import { describe, it, expect } from "vitest";
import { createPluginRegistry } from "../plugin-loader.js";
import { goldbergPlugin } from "@achievement-watcher/plugin-goldberg";
import { steamPlugin } from "@achievement-watcher/plugin-steam";

describe("Plugin registry integration", () => {
  it("registers both plugins", () => {
    const registry = createPluginRegistry();
    registry.register(goldbergPlugin);
    registry.register(steamPlugin);
    expect(registry.getAll()).toHaveLength(2);
    expect(registry.get("goldberg")?.name).toBe("Goldberg SteamEmu");
    expect(registry.get("steam")?.name).toBe("Steam");
  });

  it("plugins implement the full interface", () => {
    const registry = createPluginRegistry();
    registry.register(goldbergPlugin);
    registry.register(steamPlugin);

    for (const plugin of registry.getAll()) {
      expect(typeof plugin.id).toBe("string");
      expect(typeof plugin.name).toBe("string");
      expect(typeof plugin.source).toBe("string");
      expect(typeof plugin.detectPaths).toBe("function");
      expect(typeof plugin.detectGame).toBe("function");
      expect(typeof plugin.parse).toBe("function");
      expect(typeof plugin.watchPatterns).toBe("function");
    }
  });
});
