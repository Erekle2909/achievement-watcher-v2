import { join } from "node:path";
import { existsSync } from "node:fs";

const RPCS3_TROPHY_SUBPATH = join("dev_hdd0", "home", "00000001", "trophy");

const RPCS3_DEFAULT_PATHS = ["C:\\Program Files\\rpcs3", "C:\\Program Files (x86)\\rpcs3"];

export function getRpcs3TrophyPaths(): string[] {
  const paths: string[] = [];
  for (const base of RPCS3_DEFAULT_PATHS) {
    const trophyPath = join(base, RPCS3_TROPHY_SUBPATH);
    if (existsSync(trophyPath)) {
      paths.push(trophyPath);
    }
  }
  return paths;
}
