import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema/index.js";

export interface DatabaseConnection {
  drizzle: ReturnType<typeof drizzle<typeof schema>>;
  raw: Database.Database;
}

export function createDatabase(path: string): DatabaseConnection {
  const raw = new Database(path);
  raw.pragma("journal_mode = WAL");
  raw.pragma("foreign_keys = ON");

  const db = drizzle(raw, { schema });

  return { drizzle: db, raw };
}

export function closeDatabase(raw: Database.Database): void {
  raw.close();
}
