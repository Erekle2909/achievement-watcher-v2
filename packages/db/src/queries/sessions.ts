import { eq, desc } from "drizzle-orm";
import { sessions } from "../schema/sessions.js";
import type { DatabaseConnection } from "../connection.js";

type DB = DatabaseConnection["drizzle"];

export function sessionQueries(db: DB) {
  return {
    start(id: string, gameId: string, startTime: number) {
      return db.insert(sessions).values({ id, gameId, startTime }).run();
    },
    end(id: string, endTime: number, duration: number) {
      return db.update(sessions).set({ endTime, duration }).where(eq(sessions.id, id)).run();
    },
    getByGameId(gameId: string) {
      return db
        .select()
        .from(sessions)
        .where(eq(sessions.gameId, gameId))
        .orderBy(desc(sessions.startTime))
        .all();
    },
  };
}
