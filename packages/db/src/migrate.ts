import { existsSync, copyFileSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { DB_BACKUP_MAX_AGE_DAYS } from "@achievement-watcher/shared";

export function backupDatabase(dbPath: string): string {
  if (!existsSync(dbPath)) {
    return "";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  const backupPath = `${dbPath}.backup-${timestamp}`;
  copyFileSync(dbPath, backupPath);
  return backupPath;
}

export function restoreBackup(backupPath: string, dbPath: string): void {
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, dbPath);
  }
}

export function pruneBackups(dbPath: string, maxAgeDays: number = DB_BACKUP_MAX_AGE_DAYS): void {
  const dir = dirname(dbPath);
  const dbName = basename(dbPath);
  const prefix = `${dbName}.backup-`;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const files = readdirSync(dir);
  for (const file of files) {
    if (file.startsWith(prefix)) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (now - stat.mtimeMs > maxAgeMs) {
        unlinkSync(filePath);
      }
    }
  }
}
