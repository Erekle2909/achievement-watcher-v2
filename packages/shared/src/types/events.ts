import type { Achievement } from "./achievement.js";
import type { GameEntry } from "./game.js";

export interface EngineEvents {
  "achievement:unlocked": {
    game: GameEntry;
    achievement: Achievement;
    timestamp: number;
  };
  "game:discovered": {
    game: GameEntry;
  };
  "game:removed": {
    gameId: string;
  };
  "scan:started": undefined;
  "scan:completed": {
    gamesFound: number;
  };
  error: {
    source: string;
    code: string;
    severity: "warn" | "error" | "fatal";
    message: string;
    context?: Record<string, unknown>;
  };
}
