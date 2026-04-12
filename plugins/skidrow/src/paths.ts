import { join } from "node:path";

export function getSkidrowSavePaths(): string[] {
  const paths: string[] = [];
  const localAppData = process.env.LOCALAPPDATA;
  const userProfile = process.env.USERPROFILE;

  if (localAppData) {
    paths.push(join(localAppData, "SKIDROW"));
  }
  if (userProfile) {
    paths.push(join(userProfile, "Documents", "SKIDROW"));
  }
  return paths;
}

export const SKIDROW_SAVE_FILE = "achievements.ini";
