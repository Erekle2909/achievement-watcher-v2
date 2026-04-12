import type { ParsedGame, ParseResult } from "./achievement.js";

export interface AchievementPlugin {
  /** Unique plugin identifier, e.g. "goldberg", "steam" */
  id: string;
  /** Human-readable name, e.g. "Goldberg SteamEmu" */
  name: string;
  /** Source category, e.g. "steam-emu", "native", "emulator" */
  source: string;
  /** Default filesystem paths this plugin scans */
  detectPaths(): string[];
  /** Check if this plugin can handle the given directory */
  detectGame(dirPath: string): Promise<boolean>;
  /**
   * Parse achievement data from a game directory.
   * Note: Spec section 4.2 shows Promise<ParsedGame> but section 4.5
   * specifies ParseResult<ParsedGame> for error handling. We follow 4.5.
   */
  parse(gamePath: string): Promise<ParseResult<ParsedGame>>;
  /** Glob patterns for chokidar to watch for changes */
  watchPatterns(gamePath: string): string[];
}
