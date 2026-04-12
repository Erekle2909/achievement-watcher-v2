# Achievement Watcher v2

The definitive achievement tracker for offline, emulated, and DRM-free games.  
No launcher bloat. Your data, your machine, your achievements.

> Modern revival of [xan105/Achievement-Watcher](https://github.com/xan105/Achievement-Watcher)

## Features

- **Real-time tracking** — Detects achievement unlocks as they happen
- **Multi-source support** — Steam, Goldberg, CODEX, EMPRESS, SKIDROW, ALI213, CreamAPI, and more
- **Beautiful dashboard** — See your achievement stats, recent unlocks, and game library
- **Notifications** — Toast, sound, webhook, and overlay notifications on unlock
- **Fully local** — All data stored in SQLite on your machine. No cloud, no telemetry, no tracking.
- **Plugin system** — Easy to add support for new game sources

## Supported Sources

| Source            | Status     | Format |
| ----------------- | ---------- | ------ |
| Goldberg SteamEmu | ✅ Working | JSON   |
| CODEX             | ✅ Working | INI    |
| EMPRESS           | ✅ Working | JSON   |
| SKIDROW           | ✅ Working | INI    |
| ALI213            | ✅ Working | INI    |
| CreamAPI          | ✅ Working | INI    |
| Steam (metadata)  | ✅ Working | API    |
| Uplay R1/R2       | 🔜 Stub    | —      |
| RPCS3             | 🔜 Stub    | —      |
| RetroArch         | 🔜 Stub    | —      |

## Tech Stack

- **Electron 33** + **React 19** + **TypeScript 5.7**
- **Tailwind CSS v4** + **Vite 6**
- **SQLite** (better-sqlite3 + drizzle-orm)
- **pnpm workspaces** monorepo

## Development

```bash
# Install dependencies
pnpm install

# Run all checks
pnpm lint && pnpm typecheck && pnpm test

# Start development
pnpm dev
```

## Architecture

```
packages/
  shared/          — TypeScript interfaces and constants
  core/            — Achievement engine (discovery, watching, events)
  db/              — SQLite database layer
  notifications/   — Toast, sound, webhook notifications
apps/
  desktop/         — Electron + React desktop app
plugins/
  goldberg/        — Goldberg SteamEmu parser
  codex/           — CODEX parser
  empress/         — EMPRESS parser
  skidrow/         — SKIDROW parser
  ali213/          — ALI213 parser
  creamapi/        — CreamAPI parser
  steam/           — Steam metadata provider
  uplay-r1/        — Uplay R1 (stub)
  uplay-r2/        — Uplay R2 (stub)
  rpcs3/           — RPCS3 (stub)
  retroarch/       — RetroArch (stub)
```

## License

LGPL-3.0 — inherited from the original Achievement Watcher
