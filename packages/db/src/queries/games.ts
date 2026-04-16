import { eq, sql } from "drizzle-orm";
import { games } from "../schema/games.js";
import type { DatabaseConnection } from "../connection.js";

type DB = DatabaseConnection["drizzle"];

interface UpsertGame {
  id: string;
  appId: string;
  name: string;
  source: string;
  installPath: string;
  iconUrl?: string;
}

export function gameQueries(db: DB) {
  return {
    getAll() {
      return db.select().from(games).all();
    },
    getById(id: string) {
      return db.select().from(games).where(eq(games.id, id)).get();
    },
    upsert(game: UpsertGame) {
      return db
        .insert(games)
        .values(game)
        .onConflictDoUpdate({
          target: games.id,
          set: {
            // Only overwrite name if the new value is a real name (not just the
            // raw appId). This prevents rescans from wiping enriched names with
            // placeholder values from emu plugins that return appId as the name.
            // If the new name equals appId, keep whatever is already stored.
            name: sql`CASE WHEN ${game.name} != ${game.appId} THEN ${game.name} ELSE ${games.name} END`,
            source: game.source,
            installPath: game.installPath,
            iconUrl: game.iconUrl,
          },
        })
        .run();
    },
    remove(id: string) {
      return db.delete(games).where(eq(games.id, id)).run();
    },
    updatePlaytime(id: string, playtime: number) {
      return db
        .update(games)
        .set({ playtime, lastPlayed: Date.now() })
        .where(eq(games.id, id))
        .run();
    },
    updateAchievementCounts(id: string, total: number, unlocked: number) {
      return db
        .update(games)
        .set({ totalAchievements: total, unlockedAchievements: unlocked })
        .where(eq(games.id, id))
        .run();
    },
  };
}
