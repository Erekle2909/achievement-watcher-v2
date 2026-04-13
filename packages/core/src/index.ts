export { createPluginRegistry, type PluginRegistry } from "./plugin-loader.js";
export { parseSSEBinary, type SSEEntry } from "./sse-parser.js";
export { matchSSEToSchema } from "./crc-matcher.js";
export { parseAchievementIni } from "./ini-parser.js";
export { parseJsonAchievementSave } from "./json-achievement-parser.js";
export {
  getSteamHeaderUrl,
  getSteamAchievementIconUrl,
  buildSteamApiUrl,
  fetchSteamSchema,
  type SteamAchievementSchema,
  type SteamGameSchema,
} from "./steam-metadata.js";
export { createEventBus, type EngineEventBus } from "./event-bus.js";
export { createDiscoveryService, type DiscoveryService, type DiscoveryDeps } from "./discovery.js";
export { createWatcherService, type WatcherService, type WatcherDeps } from "./watcher.js";
export { createAchievementEngine, type AchievementEngine, type EngineDeps } from "./engine.js";
export { createMetadataCache, type MetadataCache } from "./metadata-cache.js";
export { createMetadataEnricher, type MetadataEnricher } from "./metadata-enricher.js";

export {
  createPlaytimeTracker,
  getRunningProcesses,
  type PlaytimeTracker,
  type PlaytimeTrackerDeps,
} from "./playtime.js";
