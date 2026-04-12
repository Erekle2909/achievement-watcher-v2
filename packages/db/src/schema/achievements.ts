import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { games } from "./games.js";

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  iconUrl: text("icon_url"),
  iconLockedUrl: text("icon_locked_url"),
  unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
  unlockTime: integer("unlock_time"),
  rarity: real("rarity"),
  hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
});
