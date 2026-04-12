import type { NotificationConfig } from "./notification.js";

export type ThemeMode = "dark" | "light" | "system";

export interface Settings {
  /** Notification method toggles and config */
  notifications: NotificationConfig;
  /** Directories to scan for games */
  scanPaths: string[];
  /** Enabled plugin IDs */
  enabledPlugins: string[];
  /** UI theme */
  theme: ThemeMode;
  /** Custom accent color (hex) */
  accentColor: string;
  /** Locale code — "en" only for v1.0 */
  locale: string;
  /** Steam Web API key (stored encrypted via electron safeStorage) */
  steamApiKey?: string;
  /** Rescan interval in minutes (0 = manual only) */
  rescanInterval: number;
  /** Start minimized to tray */
  startMinimized: boolean;
  /** Start on Windows login */
  startOnBoot: boolean;
}
