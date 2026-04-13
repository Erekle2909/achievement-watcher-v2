import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPlaytimeTracker, getRunningProcesses } from "../playtime.js";
import type { PlaytimeTrackerDeps } from "../playtime.js";

// ---------------------------------------------------------------------------
// Mock child_process so we never shell out during tests
// ---------------------------------------------------------------------------

let mockTasklistOutput = "";
let execShouldFail = false;

vi.mock("node:child_process", () => ({
  exec: vi.fn(
    (_cmd: string, cb: (err: Error | null, result: { stdout: string; stderr: string }) => void) => {
      if (execShouldFail) {
        cb(new Error("exec failed"), { stdout: "", stderr: "" });
      } else {
        cb(null, { stdout: mockTasklistOutput, stderr: "" });
      }
    },
  ),
}));

// ---------------------------------------------------------------------------
// Helpers to build mock query objects
// ---------------------------------------------------------------------------

function makeSq() {
  return {
    start: vi.fn(),
    end: vi.fn(),
    getByGameId: vi.fn().mockReturnValue([]),
  };
}

function makeGq(playtime = 0) {
  return {
    getAll: vi.fn().mockReturnValue([]),
    getById: vi.fn().mockReturnValue({ id: "game-1", playtime }),
    upsert: vi.fn(),
    remove: vi.fn(),
    updatePlaytime: vi.fn(),
    updateAchievementCounts: vi.fn(),
  };
}

interface MockDepsContainer {
  deps: PlaytimeTrackerDeps;
  sq: ReturnType<typeof makeSq>;
  gq: ReturnType<typeof makeGq>;
}

function makeMockDeps(
  opts: {
    playtime?: number;
    onSessionStart?: (gameId: string) => void;
    onSessionEnd?: (gameId: string, duration: number) => void;
  } = {},
): MockDepsContainer {
  const sq = makeSq();
  const gq = makeGq(opts.playtime ?? 0);
  return {
    sq,
    gq,
    deps: {
      sessionQueries: sq,
      gameQueries: gq,
      onSessionStart: opts.onSessionStart,
      onSessionEnd: opts.onSessionEnd,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests for getRunningProcesses
// ---------------------------------------------------------------------------

describe("getRunningProcesses", () => {
  beforeEach(() => {
    execShouldFail = false;
    mockTasklistOutput = "";
  });

  it("returns an empty set when tasklist output is empty", async () => {
    mockTasklistOutput = "";
    const result = await getRunningProcesses();
    expect(result.size).toBe(0);
  });

  it("parses CSV tasklist output into lowercase process names", async () => {
    mockTasklistOutput = [
      '"System Idle Process","0","Services","0","8 K"',
      '"explorer.EXE","5432","Console","1","120,000 K"',
      '"chrome.exe","9876","Console","1","500,000 K"',
    ].join("\n");
    const result = await getRunningProcesses();
    expect(result.has("explorer.exe")).toBe(true);
    expect(result.has("chrome.exe")).toBe(true);
    expect(result.has("system idle process")).toBe(true);
  });

  it("returns an empty set when exec fails", async () => {
    execShouldFail = true;
    const result = await getRunningProcesses();
    expect(result.size).toBe(0);
  });

  it("ignores lines that do not start with a quoted name", async () => {
    mockTasklistOutput = "invalid line\n" + '"real.exe","1234","Console","1","10 K"';
    const result = await getRunningProcesses();
    expect(result.has("real.exe")).toBe(true);
    expect(result.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tests for createPlaytimeTracker
// ---------------------------------------------------------------------------

describe("createPlaytimeTracker", () => {
  beforeEach(() => {
    execShouldFail = false;
    mockTasklistOutput = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts and stops without throwing", () => {
    const { deps } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);
    expect(() => {
      tracker.start();
      tracker.stop();
    }).not.toThrow();
  });

  it("start() is idempotent — calling twice does not create two timers", () => {
    const { deps } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);
    tracker.start();
    tracker.start(); // second call should be a no-op
    tracker.stop();
    expect(true).toBe(true);
  });

  it("trackProcess adds a process and calls sq.start", () => {
    const { deps, sq } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");

    const procs = tracker.getTrackedProcesses();
    expect(procs).toHaveLength(1);
    expect(procs[0].gameId).toBe("game-1");
    expect(procs[0].processName).toBe("dota2.exe");
    expect(sq.start).toHaveBeenCalledOnce();
  });

  it("trackProcess calls onSessionStart callback", () => {
    const onSessionStart = vi.fn();
    const { deps } = makeMockDeps({ onSessionStart });
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    expect(onSessionStart).toHaveBeenCalledWith("game-1");
  });

  it("trackProcess ignores duplicate gameId", () => {
    const { deps, sq } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.trackProcess("game-1", "570", "dota2.exe"); // duplicate

    expect(tracker.getTrackedProcesses()).toHaveLength(1);
    expect(sq.start).toHaveBeenCalledOnce();
  });

  it("getTrackedProcesses returns a copy, not the internal array", () => {
    const { deps } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);
    tracker.trackProcess("game-1", "570", "dota2.exe");

    const copy = tracker.getTrackedProcesses();
    copy.push({ gameId: "x", appId: "0", processName: "x.exe", startTime: 0, sessionId: "x" });
    expect(tracker.getTrackedProcesses()).toHaveLength(1);
  });

  it("poll ends session when process is no longer running", async () => {
    mockTasklistOutput = '"system.exe","4","Services","0","100 K"';

    const onSessionEnd = vi.fn();
    const { deps, sq, gq } = makeMockDeps({ playtime: 100, onSessionEnd });
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(sq.end).toHaveBeenCalledOnce();
    expect(gq.updatePlaytime).toHaveBeenCalledOnce();
    expect(onSessionEnd).toHaveBeenCalledWith("game-1", expect.any(Number));
    expect(tracker.getTrackedProcesses()).toHaveLength(0);

    tracker.stop();
  });

  it("poll keeps session open when process is still running", async () => {
    mockTasklistOutput = '"dota2.exe","1234","Console","1","500,000 K"';

    const onSessionEnd = vi.fn();
    const { deps, sq, gq } = makeMockDeps({ onSessionEnd });
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(sq.end).not.toHaveBeenCalled();
    expect(gq.updatePlaytime).not.toHaveBeenCalled();
    expect(onSessionEnd).not.toHaveBeenCalled();
    expect(tracker.getTrackedProcesses()).toHaveLength(1);

    tracker.stop();
  });

  it("poll is case-insensitive for process name matching", async () => {
    mockTasklistOutput = '"DOTA2.EXE","1234","Console","1","500,000 K"';

    const { deps, sq } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(tracker.getTrackedProcesses()).toHaveLength(1);
    expect(sq.end).not.toHaveBeenCalled();

    tracker.stop();
  });

  it("updatePlaytime accumulates existing playtime", async () => {
    mockTasklistOutput = '"other.exe","1","Services","0","10 K"';

    const { deps, gq } = makeMockDeps({ playtime: 500 });
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);

    const [, newPlaytime] = (gq.updatePlaytime as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      number,
    ];
    expect(newPlaytime).toBeGreaterThanOrEqual(500);

    tracker.stop();
  });

  it("poll handles game not found in DB gracefully", async () => {
    mockTasklistOutput = '"other.exe","1","Services","0","10 K"';

    const { deps, gq } = makeMockDeps();
    gq.getById.mockReturnValue(undefined);

    const tracker = createPlaytimeTracker(deps);
    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(gq.updatePlaytime).not.toHaveBeenCalled();

    tracker.stop();
  });

  it("stop() prevents further polls", async () => {
    mockTasklistOutput = '"other.exe","1","Services","0","10 K"';

    const { deps, sq } = makeMockDeps();
    const tracker = createPlaytimeTracker(deps);

    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.start();
    tracker.stop();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(sq.end).not.toHaveBeenCalled();
  });

  it("handles multiple tracked processes independently", async () => {
    mockTasklistOutput = '"tf2.exe","1234","Console","1","200,000 K"';

    const onSessionEnd = vi.fn();
    const { deps, gq } = makeMockDeps({ onSessionEnd });
    gq.getById.mockImplementation((id: string) => ({ id, playtime: 0 }));

    const tracker = createPlaytimeTracker(deps);
    tracker.trackProcess("game-1", "570", "dota2.exe");
    tracker.trackProcess("game-2", "440", "tf2.exe");
    tracker.start();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(onSessionEnd).toHaveBeenCalledOnce();
    expect(onSessionEnd).toHaveBeenCalledWith("game-1", expect.any(Number));
    expect(tracker.getTrackedProcesses()).toHaveLength(1);
    expect(tracker.getTrackedProcesses()[0].gameId).toBe("game-2");

    tracker.stop();
  });
});
