import { eq } from "drizzle-orm";
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
            name: game.name,
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
