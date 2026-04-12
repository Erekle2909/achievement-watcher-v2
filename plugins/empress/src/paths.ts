import { join } from "node:path";

export function getEmpressSavePaths(): string[] {
  const appData = process.env.APPDATA;
  if (!appData) return [];
  return [join(appData, "EMPRESS")];
}

export function getEmpressSaveFile(appId: string): string {
  return join("remote", appId, "achievements.json");
}
