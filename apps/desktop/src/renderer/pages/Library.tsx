import { useState, useMemo, useEffect } from "react";
import { getSourceBadge, getSourceLabel } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types matching drizzle schema rows returned from IPC
// ---------------------------------------------------------------------------

interface GameRow {
  id: string;
  appId: string;
  name: string;
  source: string;
  iconUrl: string | null;
  totalAchievements: number;
  unlockedAchievements: number;
  lastPlayed: number | null;
  playtime: number;
}

type SortKey = "name" | "completion" | "lastPlayed";
type FilterSource = string;

// ---------------------------------------------------------------------------
// Game card
// ---------------------------------------------------------------------------

interface GameCardProps {
  game: GameRow;
  onClick: () => void;
}

/** Image fallback URLs for a Steam appId, tried in order. */
function headerFallbacks(appId: string): string[] {
  return [
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_616x353.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
  ];
}

function GameCard({ game, onClick }: GameCardProps) {
  const pct =
    game.totalAchievements > 0
      ? Math.round((game.unlockedAchievements / game.totalAchievements) * 100)
      : 0;

  const isComplete = pct === 100;

  // Generate a deterministic gradient from appId for the last-resort fallback
  const hue = Array.from(game.appId).reduce((h, c) => h + c.charCodeAt(0), 0) % 360;

  return (
    <button
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-indigo-500/50 hover:scale-[1.02] transition-all text-left group cursor-pointer"
    >
      {/* Art area with gradient fallback */}
      <div
        className="h-28 relative flex items-end p-3"
        style={{
          background: `linear-gradient(135deg, hsl(${String(hue)}, 40%, 18%) 0%, hsl(${String((hue + 40) % 360)}, 30%, 12%) 100%)`,
        }}
      >
        <img
          src={game.iconUrl || headerFallbacks(game.appId)[0]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          data-fallback-idx="0"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const idx = Number(img.dataset["fallbackIdx"] ?? "0");
            const fallbacks = headerFallbacks(game.appId);
            const next = idx + 1;
            if (next < fallbacks.length) {
              img.dataset["fallbackIdx"] = String(next);
              img.src = fallbacks[next];
            } else {
              img.style.display = "none";
            }
          }}
        />
        {/* Game name shown when no image loads (over gradient) */}
        <span className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm font-semibold px-4 text-center pointer-events-none">
          {game.name}
        </span>
        {/* Gradient overlay so text is always readable over the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {isComplete && (
          <span className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            COMPLETE
          </span>
        )}
        <span
          className={`relative z-10 text-xs font-semibold px-2 py-0.5 rounded-full ${getSourceBadge(game.source)}`}
        >
          {getSourceLabel(game.source)}
        </span>
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-sm font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
          {game.name}
        </p>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-500">
              {game.unlockedAchievements}/{game.totalAchievements} achievements
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${isComplete ? "text-green-400" : "text-indigo-400"}`}
            >
              {pct}%
            </span>
          </div>
          <div className="bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${isComplete ? "bg-green-500" : "bg-indigo-500"}`}
              style={{ width: `${String(pct)}%` }}
            />
          </div>
        </div>

        {/* Playtime */}
        <p className="text-xs text-zinc-600">{Math.round(game.playtime / 3600)}h played</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface LibraryProps {
  onGameSelect: (gameId: string) => void;
}

export function Library({ onGameSelect }: LibraryProps) {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterSource>("all");
  const [sort, setSort] = useState<SortKey>("lastPlayed");

  useEffect(() => {
    async function loadData() {
      const api = window.electronAPI;
      if (!api) {
        setLoading(false);
        return;
      }

      try {
        const gamesData = await api.getGames();
        setGames(gamesData as GameRow[]);
      } catch (err) {
        console.error("Failed to load library:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = games.filter((g) => {
      const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || g.source === filter;
      return matchesSearch && matchesFilter;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "completion") {
        const pA = a.totalAchievements > 0 ? a.unlockedAchievements / a.totalAchievements : 0;
        const pB = b.totalAchievements > 0 ? b.unlockedAchievements / b.totalAchievements : 0;
        return pB - pA;
      }
      // sort === "lastPlayed"
      return (b.lastPlayed ?? 0) - (a.lastPlayed ?? 0);
    });

    return list;
  }, [games, search, filter, sort]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Game Library</h2>
          <p className="text-sm text-zinc-500 mt-1">Loading games...</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Game Library</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {games.length} game{games.length !== 1 ? "s" : ""} tracked across all sources.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Source filter — derive unique sources from the actual games data */}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
        >
          <option value="all">All Sources</option>
          {[...new Set(games.map((g) => g.source))].sort().map((src) => (
            <option key={src} value={src}>
              {getSourceLabel(src)}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
          }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
        >
          <option value="lastPlayed">Last Played</option>
          <option value="name">Name A-Z</option>
          <option value="completion">Completion %</option>
        </select>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-zinc-500 -mt-2">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onClick={() => {
                onGameSelect(game.id);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🎮</span>
          <p className="text-zinc-400 font-medium">No games found</p>
          <p className="text-zinc-600 text-sm mt-1">
            {games.length === 0
              ? "Make sure Steam is running and your API key is configured in Settings."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      )}
    </div>
  );
}
