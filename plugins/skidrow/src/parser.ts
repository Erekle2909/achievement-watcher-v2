import type { Achievement, ParseResult } from "@achievement-watcher/shared";
import { parseAchievementIni } from "@achievement-watcher/core";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export async function parseSkidrowSave(filePath: string): Promise<ParseResult<Achievement[]>> {
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

  const sections = parseAchievementIni(raw);
  const achievements: Achievement[] = [];

  for (const [name, fields] of sections) {
    if (name === "SteamAchievements") continue;

    const unlocked = fields["Achieved"] === "1";
    const unlockTimeRaw = parseInt(fields["UnlockTime"] ?? "0", 10);
    const unlockTime = unlocked && unlockTimeRaw > 0 ? unlockTimeRaw : undefined;

    achievements.push({
      id: name,
      name,
      description: "",
      icon: "",
      unlocked,
      unlockTime,
    });
  }

  return { ok: true, data: achievements };
}
