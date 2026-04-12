import type { Achievement } from "./achievement.js";

export interface GameEntry {
  id: string;
  appId: string;
  name: string;
  source: string;
  installPath: string;
  iconUrl?: string;
  lastPlayed?: number;
  playtime: number;
}

export interface GameDetails extends GameEntry {
  achievements: Achievement[];
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercent: number;
  sessions: GameSession[];
}

export interface GameSession {
  id: string;
  gameId: string;
  startTime: number;
  endTime?: number;
  duration: number;
}
