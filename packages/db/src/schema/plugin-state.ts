import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pluginState = sqliteTable("plugin_state", {
  id: text("id").primaryKey(),
  pluginId: text("plugin_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
});
