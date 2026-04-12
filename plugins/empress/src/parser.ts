import type { Achievement, ParseResult } from "@achievement-watcher/shared";
import { parseJsonAchievementSave } from "@achievement-watcher/core";

export async function parseEmpressSave(filePath: string): Promise<ParseResult<Achievement[]>> {
  return parseJsonAchievementSave(filePath);
}
