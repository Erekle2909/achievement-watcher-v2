import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  appId: text("app_id").notNull(),
  name: text("name").notNull(),
  source: text("source").notNull(),
  installPath: text("install_path").notNull(),
  iconUrl: text("icon_url"),
  totalAchievements: integer("total_achievements").notNull().default(0),
  unlockedAchievements: integer("unlocked_achievements").notNull().default(0),
  lastPlayed: integer("last_played"),
  playtime: real("playtime").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
