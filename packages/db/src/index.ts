export { createDatabase, closeDatabase, type DatabaseConnection } from "./connection.js";
export { games, achievements, sessions, settings, pluginState } from "./schema/index.js";
export {
  gameQueries,
  achievementQueries,
  sessionQueries,
  settingsQueries,
  pluginStateQueries,
} from "./queries/index.js";
export { backupDatabase, restoreBackup, pruneBackups } from "./migrate.js";
