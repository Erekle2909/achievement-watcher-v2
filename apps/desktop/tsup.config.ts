import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    main: "src/main/index.ts",
    preload: "src/main/preload.ts",
  },
  format: ["cjs"],
  outDir: "dist/main",
  external: ["electron"],
  noExternal: [
    // Bundle all workspace packages so CJS require works
    "@achievement-watcher/core",
    "@achievement-watcher/db",
    "@achievement-watcher/shared",
    "@achievement-watcher/notifications",
    "@achievement-watcher/plugin-goldberg",
    "@achievement-watcher/plugin-codex",
    "@achievement-watcher/plugin-empress",
    "@achievement-watcher/plugin-skidrow",
    "@achievement-watcher/plugin-ali213",
    "@achievement-watcher/plugin-creamapi",
    "@achievement-watcher/plugin-steam",
    "@achievement-watcher/plugin-retroarch",
    "@achievement-watcher/plugin-rpcs3",
    "@achievement-watcher/plugin-uplay-r1",
    "@achievement-watcher/plugin-uplay-r2",
  ],
  clean: true,
  sourcemap: true,
});
