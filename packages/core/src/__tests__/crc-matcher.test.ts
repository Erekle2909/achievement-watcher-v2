import { describe, it, expect } from "vitest";
import { crc32 } from "crc";
import { matchSSEToSchema } from "../crc-matcher.js";
import type { SSEEntry } from "../sse-parser.js";

function makeEntry(name: string, achieved: boolean, unlockTime = 0): SSEEntry {
  const crcVal = crc32(name);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal);
  const crc = Buffer.from(crcBuf).reverse().toString("hex");
  return { crc, achieved, unlockTime };
}

describe("matchSSEToSchema", () => {
  it("matches achieved entry to schema name", () => {
    const entry = makeEntry("ACH_FIRST_BLOOD", true, 1700000000);
    const result = matchSSEToSchema([entry], ["ACH_FIRST_BLOOD", "ACH_WIN"]);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("ACH_FIRST_BLOOD");
    expect(result[0]?.unlocked).toBe(true);
    expect(result[0]?.unlockTime).toBe(1700000000);
  });

  it("uses CRC as id when no schema name matches", () => {
    const entry = makeEntry("ACH_UNKNOWN", true, 1700000000);
    const result = matchSSEToSchema([entry], ["ACH_OTHER"]);

    expect(result[0]?.id).toBe(entry.crc);
    expect(result[0]?.name).toContain("Unknown (CRC:");
  });

  it("omits unlockTime when achievement is not achieved", () => {
    const entry = makeEntry("ACH_LOCKED", false, 0);
    const result = matchSSEToSchema([entry], ["ACH_LOCKED"]);

    expect(result[0]?.unlocked).toBe(false);
    expect(result[0]?.unlockTime).toBeUndefined();
  });

  it("returns empty array for empty entries", () => {
    const result = matchSSEToSchema([], ["ACH_ONE", "ACH_TWO"]);
    expect(result).toHaveLength(0);
  });

  it("handles multiple entries", () => {
    const entries = [
      makeEntry("ACH_A", true, 1700000001),
      makeEntry("ACH_B", false, 0),
      makeEntry("ACH_C", true, 1700000002),
    ];
    const result = matchSSEToSchema(entries, ["ACH_A", "ACH_B", "ACH_C"]);

    expect(result).toHaveLength(3);
    expect(result.filter((r) => r.unlocked)).toHaveLength(2);
  });
});
