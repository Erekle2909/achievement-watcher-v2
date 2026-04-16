import { eq, desc } from "drizzle-orm";
import { achievements } from "../schema/achievements.js";
import type { DatabaseConnection } from "../connection.js";

type DB = DatabaseConnection["drizzle"];

interface UpsertAchievement {
  id: string;
  gameId: string;
  achievementId: string;
  name: string;
  description: string;
  iconUrl?: string;
  iconLockedUrl?: string;
  unlocked?: boolean;
  unlockTime?: number;
  rarity?: number;
  hidden?: boolean;
}

export function achievementQueries(db: DB) {
  return {
    getByGameId(gameId: string) {
      return db.select().from(achievements).where(eq(achievements.gameId, gameId)).all();
    },
    upsertMany(_gameId: string, achs: UpsertAchievement[]) {
      for (const ach of achs) {
        db.insert(achievements)
          .values(ach)
          .onConflictDoUpdate({
            target: achievements.id,
            set: {
              // Only update unlock status and rarity on conflict.
              // Metadata fields (name, description, iconUrl, iconLockedUrl) are
              // written by the enricher via updateMetadata() and must NOT be
              // overwritten with raw plugin data on rescan.
              unlocked: ach.unlocked ?? false,
              unlockTime: ach.unlockTime,
              rarity: ach.rarity,
              hidden: ach.hidden ?? false,
            },
          })
          .run();
      }
    },
    markUnlocked(id: string, unlockTime: number) {
      return db
        .update(achievements)
        .set({ unlocked: true, unlockTime })
        .where(eq(achievements.id, id))
        .run();
    },
    getRecentUnlocks(limit: number) {
      return db
        .select()
        .from(achievements)
        .where(eq(achievements.unlocked, true))
        .orderBy(desc(achievements.unlockTime))
        .limit(limit)
        .all();
    },
    updateMetadata(
      id: string,
      name: string,
      description: string,
      iconUrl?: string,
      iconLockedUrl?: string,
    ) {
      return db
        .update(achievements)
        .set({ name, description, iconUrl, iconLockedUrl })
        .where(eq(achievements.id, id))
        .run();
    },
  };
}
