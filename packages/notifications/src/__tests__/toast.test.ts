import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendToast } from "../toast.js";
import type { NotificationPayload } from "../notification-manager.js";

// Capture exec calls without vi.mocked typing issues
const capturedCmds: string[] = [];
let execShouldFail = false;

vi.mock("node:child_process", () => ({
  exec: vi.fn((cmd: string, cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    capturedCmds.push(cmd);
    if (execShouldFail) {
      cb(new Error("PowerShell not found"), "", "");
    } else {
      cb(null, "", "");
    }
  }),
}));

const mockPayload: NotificationPayload = {
  game: {
    id: "game-1",
    appId: "440",
    name: "Team Fortress 2",
    source: "steam",
    installPath: "C:/games/tf2",
    playtime: 5000,
  },
  achievement: {
    id: "ach-3",
    name: "Pyromancer",
    description: "Set 10 people on fire",
    icon: "pyro.png",
    unlocked: true,
  },
  timestamp: 1720000000,
};

describe("sendToast", () => {
  beforeEach(() => {
    capturedCmds.length = 0;
    execShouldFail = false;
    vi.clearAllMocks();
  });

  it("resolves without throwing for a normal payload", async () => {
    await expect(sendToast(mockPayload)).resolves.toBeUndefined();
  });

  it("resolves without throwing even if exec fails", async () => {
    execShouldFail = true;
    await expect(sendToast(mockPayload)).resolves.toBeUndefined();
  });

  it("calls exec with a powershell command", async () => {
    await sendToast(mockPayload);
    expect(capturedCmds.length).toBeGreaterThan(0);
    expect(capturedCmds[0]).toMatch(/^powershell/i);
  });

  it("includes the achievement name in the powershell command", async () => {
    await sendToast(mockPayload);
    expect(capturedCmds[0]).toContain("Pyromancer");
  });

  it("includes the game name in the powershell command", async () => {
    await sendToast(mockPayload);
    expect(capturedCmds[0]).toContain("Team Fortress 2");
  });
});
