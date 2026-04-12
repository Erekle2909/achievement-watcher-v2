import { eq } from "drizzle-orm";
import { settings } from "../schema/settings.js";
import type { DatabaseConnection } from "../connection.js";

type DB = DatabaseConnection["drizzle"];

export function settingsQueries(db: DB) {
  return {
    get(key: string): string | undefined {
      return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
    },
    set(key: string, value: string) {
      return db
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run();
    },
    getAll(): Record<string, string> {
      const rows = db.select().from(settings).all();
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    },
    remove(key: string) {
      return db.delete(settings).where(eq(settings.key, key)).run();
    },
  };
}
