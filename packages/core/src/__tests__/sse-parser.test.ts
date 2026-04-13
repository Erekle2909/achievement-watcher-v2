import { describe, it, expect } from "vitest";
import { writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32 } from "crc";
import { parseSSEBinary } from "../sse-parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function createTestBinary(
  entries: Array<{ name: string; unlockTime: number; value: number }>,
): Buffer {
  const header = Buffer.alloc(4);
  header.writeInt32LE(entries.length);

  const entryBuffers = entries.map((e) => {
    const entry = Buffer.alloc(24);
    const crcVal = crc32(e.name);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal);
    crcBuf.copy(entry, 0);
    entry.writeInt32LE(e.unlockTime, 8);
    entry.writeInt32LE(e.value, 20);
    return entry;
  });

  return Buffer.concat([header, ...entryBuffers]);
}

describe("parseSSEBinary", () => {
  it("parses achieved and locked entries", () => {
    const buf = createTestBinary([
      { name: "ACH_TEST", unlockTime: 1700000000, value: 1 },
      { name: "ACH_LOCKED", unlockTime: 0, value: 0 },
    ]);
    const tmpPath = join(__dirname, "_tmp_test.bin");
    writeFileSync(tmpPath, buf);
    try {
      const entries = parseSSEBinary(tmpPath);
      expect(entries).toHaveLength(2);
      expect(entries[0]?.achieved).toBe(true);
      expect(entries[0]?.unlockTime).toBe(1700000000);
      expect(entries[1]?.achieved).toBe(false);
      expect(entries[1]?.unlockTime).toBe(0);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it("skips stat entries (value > 1)", () => {
    const buf = createTestBinary([
      { name: "STAT_KILLS", unlockTime: 0, value: 500 },
      { name: "ACH_REAL", unlockTime: 1700000001, value: 1 },
    ]);
    const tmpPath = join(__dirname, "_tmp_stats.bin");
    writeFileSync(tmpPath, buf);
    try {
      const entries = parseSSEBinary(tmpPath);
      expect(entries).toHaveLength(1);
      expect(entries[0]?.achieved).toBe(true);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it("returns empty array for zero-count header", () => {
    const buf = Buffer.alloc(4);
    buf.writeInt32LE(0);
    const tmpPath = join(__dirname, "_tmp_empty.bin");
    writeFileSync(tmpPath, buf);
    try {
      const entries = parseSSEBinary(tmpPath);
      expect(entries).toHaveLength(0);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it("stores CRC as reversed hex of big-endian bytes", () => {
    const buf = createTestBinary([{ name: "ACH_TEST", unlockTime: 1700000000, value: 1 }]);
    const tmpPath = join(__dirname, "_tmp_crc.bin");
    writeFileSync(tmpPath, buf);
    try {
      const entries = parseSSEBinary(tmpPath);
      expect(entries).toHaveLength(1);
      // CRC is stored as 4 big-endian bytes, reversed to hex
      const crcVal = crc32("ACH_TEST");
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crcVal);
      const expectedCrc = Buffer.from(crcBuf).reverse().toString("hex");
      expect(entries[0]?.crc).toBe(expectedCrc);
    } finally {
      unlinkSync(tmpPath);
    }
  });
});
