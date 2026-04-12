export const IPC_CHANNELS = {
  APP_VERSION: "app:version",
  GAMES_GET_ALL: "games:getAll",
  GAMES_GET_DETAILS: "games:getDetails",
  GAMES_RESCAN: "games:rescan",
  ACHIEVEMENTS_GET_BY_GAME: "achievements:getByGame",
  ACHIEVEMENTS_GET_RECENT: "achievements:getRecent",
  SETTINGS_GET_ALL: "settings:getAll",
  SETTINGS_UPDATE: "settings:update",
  PLUGINS_GET_ALL: "plugins:getAll",
  PLUGINS_TOGGLE: "plugins:toggle",
  ACHIEVEMENT_UNLOCKED: "achievement:unlocked",
  SCAN_COMPLETE: "scan:complete",
} as const;
