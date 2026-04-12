import type { AchievementPlugin } from "@achievement-watcher/shared";

export interface PluginRegistry {
  register(plugin: AchievementPlugin): void;
  unregister(id: string): void;
  get(id: string): AchievementPlugin | undefined;
  getAll(): AchievementPlugin[];
  getEnabled(): AchievementPlugin[];
  enable(id: string): void;
  disable(id: string): void;
}

export function createPluginRegistry(): PluginRegistry {
  const plugins = new Map<string, AchievementPlugin>();
  const disabled = new Set<string>();

  return {
    register(plugin) {
      if (plugins.has(plugin.id)) {
        throw new Error(`Plugin "${plugin.id}" is already registered`);
      }
      plugins.set(plugin.id, plugin);
    },
    unregister(id) {
      plugins.delete(id);
      disabled.delete(id);
    },
    get(id) {
      return plugins.get(id);
    },
    getAll() {
      return [...plugins.values()];
    },
    getEnabled() {
      return [...plugins.values()].filter((p) => !disabled.has(p.id));
    },
    enable(id) {
      disabled.delete(id);
    },
    disable(id) {
      disabled.add(id);
    },
  };
}
