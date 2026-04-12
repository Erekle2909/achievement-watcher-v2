import type { Settings } from "../types/settings.js";

export const DEFAULT_SETTINGS: Settings = {
  notifications: {
    enabled: {
      toast: true,
      overlay: true,
      sound: true,
      screenshot: false,
      webhook: false,
    },
    overlayDuration: 5000,
  },
  scanPaths: [],
  enabledPlugins: [
    "steam",
    "goldberg",
    "codex",
    "empress",
    "skidrow",
    "ali213",
    "rpcs3",
    "uplay-r1",
    "uplay-r2",
    "creamapi",
    "retroarch",
  ],
  theme: "dark",
  accentColor: "#6366f1",
  locale: "en",
  rescanInterval: 5,
  startMinimized: false,
  startOnBoot: false,
};

export const WATCHER_DEBOUNCE_MS = 300;
export const WATCHER_HEALTH_CHECK_INTERVAL_MS = 60_000;
export const WATCHER_MAX_INSTANCES = 500;
export const PLAYTIME_POLL_INTERVAL_MS = 30_000;
export const PARSE_RETRY_BACKOFF_MS = [1000, 2000, 5000];
export const DB_BACKUP_MAX_AGE_DAYS = 30;
