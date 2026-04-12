import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { backupDatabase, pruneBackups } from "../migrate.js";

describe("Migration safety", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aw-test-${String(Date.now())}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("creates a backup of the database file", () => {
    const dbPath = join(testDir, "test.db");
    writeFileSync(dbPath, "fake-db-content");

    const backupPath = backupDatabase(dbPath);
    expect(existsSync(backupPath)).toBe(true);
    expect(backupPath).toContain(".backup-");
  });

  it("prunes backups older than maxAgeDays", () => {
    const dbPath = join(testDir, "test.db");
    writeFileSync(dbPath, "fake-db-content");

    // Create a fake old backup with old mtime
    const oldBackup = join(testDir, "test.db.backup-20200101T000000");
    writeFileSync(oldBackup, "old-backup");
    // Touch the file to have an old mtime
    const oldDate = new Date("2020-01-01");
    utimesSync(oldBackup, oldDate, oldDate);

    // Create a recent backup
    const recentBackup = backupDatabase(dbPath);

    pruneBackups(dbPath, 30);

    expect(existsSync(oldBackup)).toBe(false);
    expect(existsSync(recentBackup)).toBe(true);
  });

  it("does not create backup if db file does not exist", () => {
    const dbPath = join(testDir, "nonexistent.db");
    const backupPath = backupDatabase(dbPath);
    expect(backupPath).toBe("");
  });
});
