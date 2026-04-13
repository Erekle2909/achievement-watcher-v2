import { readFileSync } from "node:fs";

export interface SSEEntry {
  crc: string; // hex string of CRC32 hash
  achieved: boolean;
  unlockTime: number;
}

export function parseSSEBinary(filePath: string): SSEEntry[] {
  const buffer = readFileSync(filePath);
  const entrySize = 24;
  const headerSize = 4;

  const expectedCount = buffer.readInt32LE(0);
  const entries: SSEEntry[] = [];

  for (let i = 0; i < expectedCount; i++) {
    const offset = headerSize + i * entrySize;
    if (offset + entrySize > buffer.length) break;

    // Read CRC: 4 bytes big-endian, reverse to hex string
    const crcBytes = Buffer.from(buffer.subarray(offset, offset + 4));
    const crc = Buffer.from(crcBytes).reverse().toString("hex");

    const unlockTime = buffer.readInt32LE(offset + 8);
    const value = buffer.readInt32LE(offset + 20);

    // Skip pure stats (value > 1)
    if (value > 1) continue;

    entries.push({
      crc,
      achieved: value === 1,
      unlockTime,
    });
  }

  return entries;
}
