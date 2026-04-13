import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SteamGameSchema } from "./steam-metadata.js";

const CACHE_MAX_AGE_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~6 months

export interface MetadataCache {
  get(appId: string): SteamGameSchema | null;
  set(appId: string, data: SteamGameSchema): void;
}

export function createMetadataCache(cacheDir: string): MetadataCache {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  return {
    get(appId) {
      const filePath = join(cacheDir, `${appId}.json`);
      if (!existsSync(filePath)) return null;

      const stat = statSync(filePath);
      if (Date.now() - stat.mtimeMs > CACHE_MAX_AGE_MS) return null; // expired

      try {
        return JSON.parse(readFileSync(filePath, "utf-8")) as SteamGameSchema;
      } catch {
        return null;
      }
    },

    set(appId, data) {
      writeFileSync(join(cacheDir, `${appId}.json`), JSON.stringify(data));
    },
  };
}
