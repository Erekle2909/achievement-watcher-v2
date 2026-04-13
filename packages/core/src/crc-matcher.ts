import { crc32 } from "crc";
import type { Achievement } from "@achievement-watcher/shared";
import type { SSEEntry } from "./sse-parser.js";

/**
 * Convert an SSE entry CRC hex string to a canonical big-endian hex string
 * for comparison. The SSE parser stores the 4 CRC bytes reversed (little-endian
 * order), so we reverse them back before comparing.
 */
function crcEntryToCanonical(crcHex: string): string {
  // crcHex is 8 chars (4 bytes), reversed from big-endian → re-reverse it
  const bytes = Buffer.from(crcHex, "hex");
  return Buffer.from(bytes).reverse().toString("hex");
}

/**
 * Match SSE binary entries to achievement schema using CRC32.
 * The SSE format stores CRC32(apiName) instead of the name itself.
 *
 * entry.crc is the raw CRC bytes in reversed (little-endian) order.
 * We convert it back to a canonical big-endian form and compare with
 * the zero-padded 8-char hex of crc32(schemaName).
 */
export function matchSSEToSchema(sseEntries: SSEEntry[], schemaNames: string[]): Achievement[] {
  const achievements: Achievement[] = [];

  for (const entry of sseEntries) {
    const entryCrcCanonical = crcEntryToCanonical(entry.crc);

    // Find matching schema name by CRC32
    const matchedName = schemaNames.find((name) => {
      const nameCrc = crc32(name).toString(16).padStart(8, "0");
      return entryCrcCanonical === nameCrc;
    });

    achievements.push({
      id: matchedName ?? entry.crc,
      name: matchedName ?? `Unknown (CRC: ${entry.crc})`,
      description: "",
      icon: "",
      unlocked: entry.achieved,
      unlockTime: entry.achieved && entry.unlockTime > 0 ? entry.unlockTime : undefined,
    });
  }

  return achievements;
}
