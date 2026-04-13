import { describe, it, expect, vi, beforeEach } from "vitest";
import { greenlumaPlugin } from "../index.js";

// ---------------------------------------------------------------------------
// Mock child_process so we never touch the real registry
// ---------------------------------------------------------------------------

let mockRegOutput = "";
let execShouldFail = false;

vi.mock("node:child_process", () => ({
  exec: vi.fn(
    (_cmd: string, cb: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
      if (execShouldFail) {
        cb(new Error("exec failed"), { stdout: "", stderr: "" });
      } else {
        cb(null, { stdout: mockRegOutput, stderr: "" });
      }
    },
  ),
}));

// Helper: build a fake reg query output block
function makeRegOutput(entries: Array<{ name: string; value: number }>): string {
  return entries.map((e) => `    ${e.name}    REG_DWORD    0x${e.value.toString(16)}`).join("\n");
}

beforeEach(() => {
  execShouldFail = false;
  mockRegOutput = "";
});

describe("GreenLuma plugin", () => {
  it("has correct id", () => {
    expect(greenlumaPlugin.id).toBe("greenluma");
  });

  it("has correct source", () => {
    expect(greenlumaPlugin.source).toBe("steam-emu");
  });

  it("detectPaths returns GLR and GL2020 registry paths", () => {
    const paths = greenlumaPlugin.detectPaths();
    expect(paths.some((p) => p.includes("GLR"))).toBe(true);
    expect(paths.some((p) => p.includes("GL2020"))).toBe(true);
  });

  it("watchPatterns returns empty array", () => {
    expect(greenlumaPlugin.watchPatterns("/any/path")).toHaveLength(0);
  });

  it("detectGame returns true when registry key has values", async () => {
    mockRegOutput = makeRegOutput([{ name: "ACH_FIRST", value: 1 }]);
    const result = await greenlumaPlugin.detectGame("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result).toBe(true);
  });

  it("detectGame returns false when registry key is empty", async () => {
    mockRegOutput = "";
    const result = await greenlumaPlugin.detectGame("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result).toBe(false);
  });

  it("detectGame returns false when exec fails", async () => {
    execShouldFail = true;
    const result = await greenlumaPlugin.detectGame("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result).toBe(false);
  });

  it("parses unlocked achievement with unlock time", async () => {
    mockRegOutput = makeRegOutput([
      { name: "ACH_FIRST", value: 1 },
      { name: "ACH_FIRST_Time", value: 1700000000 },
    ]);

    const result = await greenlumaPlugin.parse("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const achs = result.data.achievements;
    expect(achs).toHaveLength(1);
    expect(achs[0]?.id).toBe("ACH_FIRST");
    expect(achs[0]?.unlocked).toBe(true);
    expect(achs[0]?.unlockTime).toBe(1700000000);
  });

  it("parses locked achievement without unlock time", async () => {
    mockRegOutput = makeRegOutput([
      { name: "ACH_LOCKED", value: 0 },
      { name: "ACH_LOCKED_Time", value: 0 },
    ]);

    const result = await greenlumaPlugin.parse("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const achs = result.data.achievements;
    expect(achs).toHaveLength(1);
    expect(achs[0]?.unlocked).toBe(false);
    expect(achs[0]?.unlockTime).toBeUndefined();
  });

  it("parses multiple achievements correctly", async () => {
    mockRegOutput = makeRegOutput([
      { name: "ACH_A", value: 1 },
      { name: "ACH_A_Time", value: 1700000001 },
      { name: "ACH_B", value: 0 },
      { name: "ACH_B_Time", value: 0 },
      { name: "ACH_C", value: 1 },
      { name: "ACH_C_Time", value: 1700000002 },
    ]);

    const result = await greenlumaPlugin.parse("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const achs = result.data.achievements;
    expect(achs).toHaveLength(3);
    expect(achs.filter((a) => a.unlocked)).toHaveLength(2);
  });

  it("returns empty achievements when registry is empty", async () => {
    mockRegOutput = "";
    const result = await greenlumaPlugin.parse("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.achievements).toHaveLength(0);
  });

  it("appId is derived from path basename", async () => {
    mockRegOutput = "";
    const result = await greenlumaPlugin.parse("HKCU\\SOFTWARE\\GLR\\AppID\\570");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.appId).toBe("570");
  });
});
