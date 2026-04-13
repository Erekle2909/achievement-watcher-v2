import { exec } from "node:child_process";
import { promisify } from "node:util";
import { PLAYTIME_POLL_INTERVAL_MS } from "@achievement-watcher/shared";
import { sessionQueries, gameQueries } from "@achievement-watcher/db";

const execAsync = promisify(exec);

type SessionQueries = ReturnType<typeof sessionQueries>;
type GameQueries = ReturnType<typeof gameQueries>;

interface TrackedProcess {
  gameId: string;
  appId: string;
  processName: string;
  startTime: number;
  sessionId: string;
}

export interface PlaytimeTracker {
  start(): void;
  stop(): void;
  trackProcess(gameId: string, appId: string, processName: string): void;
  getTrackedProcesses(): TrackedProcess[];
}

export interface PlaytimeTrackerDeps {
  sessionQueries: SessionQueries;
  gameQueries: GameQueries;
  onSessionStart?: (gameId: string) => void;
  onSessionEnd?: (gameId: string, duration: number) => void;
}

export async function getRunningProcesses(): Promise<Set<string>> {
  try {
    const { stdout } = await execAsync("tasklist /FO CSV /NH");
    const names = new Set<string>();
    for (const line of stdout.split("\n")) {
      const match = line.match(/^"([^"]+)"/);
      if (match) names.add(match[1].toLowerCase());
    }
    return names;
  } catch {
    return new Set();
  }
}

export function createPlaytimeTracker(deps: PlaytimeTrackerDeps): PlaytimeTracker {
  const { sessionQueries: sq, gameQueries: gq } = deps;
  const tracked: TrackedProcess[] = [];
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function poll(): Promise<void> {
    const running = await getRunningProcesses();

    for (let i = tracked.length - 1; i >= 0; i--) {
      const proc = tracked[i];
      if (!running.has(proc.processName.toLowerCase())) {
        // Process ended — close session
        const duration = Math.floor((Date.now() - proc.startTime) / 1000);

        sq.end(proc.sessionId, Date.now(), duration);

        // Update total playtime
        const game = gq.getById(proc.gameId);
        if (game) {
          gq.updatePlaytime(proc.gameId, game.playtime + duration);
        }

        deps.onSessionEnd?.(proc.gameId, duration);
        tracked.splice(i, 1);
      }
    }
  }

  return {
    start() {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        void poll();
      }, PLAYTIME_POLL_INTERVAL_MS);
    },

    stop() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },

    trackProcess(gameId, appId, processName) {
      // Don't track duplicates
      if (tracked.some((t) => t.gameId === gameId)) return;

      const sessionId = `${gameId}:${String(Date.now())}`;
      sq.start(sessionId, gameId, Date.now());

      tracked.push({ gameId, appId, processName, startTime: Date.now(), sessionId });
      deps.onSessionStart?.(gameId);
    },

    getTrackedProcesses() {
      return [...tracked];
    },
  };
}
