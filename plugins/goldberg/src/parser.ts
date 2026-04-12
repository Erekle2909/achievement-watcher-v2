import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { Achievement, ParseResult } from "@achievement-watcher/shared";

interface GoldbergSaveEntry {
  earned: boolean;
  earned_time: number;
}

type GoldbergSaveFile = Record<string, GoldbergSaveEntry>;

export async function parseGoldbergSave(filePath: string): Promise<ParseResult<Achievement[]>> {
  if (!existsSync(filePath)) {
    return { ok: false, error: { code: "FILE_NOT_FOUND", message: `File not found: ${filePath}` } };
  }

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "READ_ERROR",
        message: `Failed to read: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }

  let data: GoldbergSaveFile;
  try {
    data = JSON.parse(raw) as GoldbergSaveFile;
  } catch {
    return { ok: false, error: { code: "PARSE_ERROR", message: `Invalid JSON in ${filePath}` } };
  }

  const achievements: Achievement[] = Object.entries(data).map(([apiName, entry]) => ({
    id: apiName,
    name: apiName,
    description: "",
    icon: "",
    unlocked: entry.earned,
    unlockTime: entry.earned && entry.earned_time > 0 ? entry.earned_time : undefined,
  }));

  return { ok: true, data: achievements };
}
