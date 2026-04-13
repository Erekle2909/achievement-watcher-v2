import { ipcMain, app } from "electron";
import {
  gameQueries,
  achievementQueries,
  settingsQueries,
  type DatabaseConnection,
} from "@achievement-watcher/db";
import type { AchievementEngine, PluginRegistry } from "@achievement-watcher/core";

export function registerIpcHandlers(
  db: DatabaseConnection,
  engine: AchievementEngine,
  registry: PluginRegistry,
) {
  const gq = gameQueries(db.drizzle);
  const aq = achievementQueries(db.drizzle);
  const sq = settingsQueries(db.drizzle);

  ipcMain.handle("app:version", () => app.getVersion());

  ipcMain.handle("games:getAll", () => {
    return gq.getAll();
  });

  ipcMain.handle("games:getDetails", (_event, id: string) => {
    const game = gq.getById(id);
    if (!game) return null;
    const achievements = aq.getByGameId(id);
    return { ...game, achievements };
  });

  ipcMain.handle("games:rescan", async () => {
    await engine.rescan();
  });

  ipcMain.handle("achievements:getByGame", (_event, gameId: string) => {
    return aq.getByGameId(gameId);
  });

  ipcMain.handle("achievements:getRecent", (_event, limit: number) => {
    return aq.getRecentUnlocks(limit);
  });

  ipcMain.handle("settings:getAll", () => {
    return sq.getAll();
  });

  ipcMain.handle("settings:update", (_event, patch: Record<string, string>) => {
    for (const [key, value] of Object.entries(patch)) {
      sq.set(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  });

  ipcMain.handle("plugins:getAll", () => {
    return registry.getAll().map((p) => ({
      id: p.id,
      name: p.name,
      source: p.source,
      enabled: registry.getEnabled().some((e) => e.id === p.id),
    }));
  });

  ipcMain.handle("plugins:toggle", (_event, id: string, enabled: boolean) => {
    if (enabled) {
      registry.enable(id);
    } else {
      registry.disable(id);
    }
  });
}
