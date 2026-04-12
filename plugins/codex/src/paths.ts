import { join } from "node:path";

export function getCodexSavePaths(): string[] {
  const paths: string[] = [];
  const publicDocs = process.env.PUBLIC;
  const appData = process.env.APPDATA;

  if (publicDocs) {
    paths.push(join(publicDocs, "Documents", "Steam", "CODEX"));
  }
  if (appData) {
    paths.push(join(appData, "Steam", "CODEX"));
  }
  return paths;
}

export const CODEX_SAVE_FILE = "achievements.ini";
