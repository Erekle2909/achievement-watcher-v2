import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { games } from "./games.js";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  startTime: integer("start_time").notNull(),
  endTime: integer("end_time"),
  duration: real("duration").notNull().default(0),
});
