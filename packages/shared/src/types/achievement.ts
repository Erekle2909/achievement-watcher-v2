export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconLocked?: string;
  unlocked: boolean;
  unlockTime?: number;
  rarity?: number;
  hidden?: boolean;
}

export interface ParsedGame {
  appId: string;
  name: string;
  achievements: Achievement[];
  iconUrl?: string;
  playtime?: number;
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
