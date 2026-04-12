import { eq, and } from "drizzle-orm";
import { pluginState } from "../schema/plugin-state.js";
import type { DatabaseConnection } from "../connection.js";

type DB = DatabaseConnection["drizzle"];

export function pluginStateQueries(db: DB) {
  return {
    get(pluginId: string, key: string): string | undefined {
      return db
        .select()
        .from(pluginState)
        .where(and(eq(pluginState.pluginId, pluginId), eq(pluginState.key, key)))
        .get()?.value;
    },
    set(pluginId: string, key: string, value: string) {
      const id = `${pluginId}:${key}`;
      return db
        .insert(pluginState)
        .values({ id, pluginId, key, value })
        .onConflictDoUpdate({ target: pluginState.id, set: { value } })
        .run();
    },
    getAllForPlugin(pluginId: string): Record<string, string> {
      const rows = db.select().from(pluginState).where(eq(pluginState.pluginId, pluginId)).all();
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
  };
}
