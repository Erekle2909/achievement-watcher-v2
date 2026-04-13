import { useState, useMemo, useEffect } from "react";
import {
  getRarityBg,
  getRarityLabel,
  getRarityColor,
  getSourceBadge,
  rarityFromPercent,
  steamHeaderUrl,
  SOURCE_LABELS,
  type AchievementSource,
  type AchievementRarity,
} from "../lib/utils";

// ---------------------------------------------------------------------------
// Types matching drizzle schema rows returned from IPC
// ---------------------------------------------------------------------------

interface GameRow {
  id: string;
  appId: string;
  name: string;
  source: string;
  totalAchievements: number;
  unlockedAchievements: number;
  lastPlayed: number | null;
  playtime: number;
}

interface AchievementRow {
  id: string;
  gameId: string;
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  iconLockedUrl: string | null;
  unlocked: boolean;
  unlockTime: number | null;
  rarity: number | null;
  hidden: boolean;
}

interface GameDetailsResponse extends GameRow {
  achievements: AchievementRow[];
}

type AchFilter = "all" | "unlocked" | "locked";

// ---------------------------------------------------------------------------
// Achievement card
// ---------------------------------------------------------------------------

function AchievementCard({ ach }: { ach: AchievementRow }) {
  const isHiddenLocked = ach.hidden && !ach.unlocked;
  const rarity: AchievementRarity = rarityFromPercent(ach.rarity);
  const rarityPct = ach.rarity ?? 0;

  return (
    <div
      className={`border rounded-lg p-4 flex gap-3 transition-all ${
        ach.unlocked
          ? "bg-zinc-900 border-zinc-700 hover:border-green-500/40"
          : "bg-zinc-900/50 border-zinc-800 opacity-60 hover:opacity-80"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-md flex items-center justify-center text-2xl flex-shrink-0 border overflow-hidden ${
          ach.unlocked ? "bg-green-900/30 border-green-700/40" : "bg-zinc-800 border-zinc-700"
        }`}
      >
        {ach.unlocked && ach.iconUrl ? (
          <img src={ach.iconUrl} alt="" className="w-full h-full object-cover" />
        ) : !ach.unlocked && ach.iconLockedUrl ? (
          <img src={ach.iconLockedUrl} alt="" className="w-full h-full object-cover" />
        ) : ach.unlocked ? (
          "\u2705"
        ) : (
          "\uD83D\uDD12"
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-semibold leading-tight ${ach.unlocked ? "text-zinc-100" : "text-zinc-400"}`}
          >
            {isHiddenLocked ? "???" : ach.name}
          </p>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getRarityBg(rarity)}`}
          >
            {getRarityLabel(rarity)}
          </span>
        </div>

        <p className="text-xs text-zinc-500 leading-snug">
          {isHiddenLocked
            ? "Hidden achievement \u2014 unlock to reveal description."
            : ach.description}
        </p>

        {/* Rarity bar */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 bg-zinc-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full rounded-full ${getRarityColor(rarity).replace("text-", "bg-")}`}
              style={{ width: `${String(rarityPct)}%` }}
            />
          </div>
          <span className={`text-[11px] tabular-nums flex-shrink-0 ${getRarityColor(rarity)}`}>
            {rarityPct}% of players
          </span>
        </div>

        {/* Unlocked timestamp */}
        {ach.unlocked && ach.unlockTime && (
          <p className="text-[11px] text-green-500">
            Unlocked{" "}
            {new Date(ach.unlockTime * 1000).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface GameDetailProps {
  gameId: string;
  onBack: () => void;
}

export function GameDetail({ gameId, onBack }: GameDetailProps) {
  const [game, setGame] = useState<GameRow | null>(null);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [achFilter, setAchFilter] = useState<AchFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const api = window.electronAPI;
      if (!api) {
        setLoading(false);
        return;
      }

      try {
        const details = (await api.getGameDetails(gameId)) as GameDetailsResponse | null;
        if (details) {
          const { achievements: achs, ...gameData } = details;
          setGame(gameData);
          setAchievements(achs);
        }
      } catch (err) {
        console.error("Failed to load game details:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [gameId]);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      if (achFilter === "unlocked" && !a.unlocked) return false;
      if (achFilter === "locked" && a.unlocked) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = a.name.toLowerCase().includes(q);
        const descMatch = a.description.toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [achievements, achFilter, search]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
        >
          <span>\u2190</span>
          <span>Back to Library</span>
        </button>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-400">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">\u2753</span>
        <p className="text-zinc-400">Game not found.</p>
        <button
          onClick={onBack}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          \u2190 Back to Library
        </button>
      </div>
    );
  }

  const source = game.source as AchievementSource;
  const pct =
    game.totalAchievements > 0
      ? Math.round((game.unlockedAchievements / game.totalAchievements) * 100)
      : 0;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
      >
        <span>\u2190</span>
        <span>Back to Library</span>
      </button>

      {/* Game header */}
      <div className="rounded-xl p-6 flex flex-col gap-4 border border-zinc-700/50 relative overflow-hidden">
        {/* Background image */}
        <img
          src={steamHeaderUrl(game.appId)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 to-zinc-950/60" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-zinc-100">{game.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSourceBadge(source)}`}
              >
                {SOURCE_LABELS[source]}
              </span>
              <span className="text-xs text-zinc-400">
                {Math.round(game.playtime / 3600)}h playtime
              </span>
              {game.lastPlayed && (
                <span className="text-xs text-zinc-500">
                  Last played {new Date(game.lastPlayed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-4xl font-bold ${pct === 100 ? "text-green-400" : "text-indigo-400"}`}
            >
              {pct}%
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">completion</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="relative flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>
              {unlockedCount} / {game.totalAchievements} achievements
            </span>
          </div>
          <div className="bg-black/40 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
              style={{ width: `${String(pct)}%` }}
            />
          </div>
        </div>
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
            placeholder="Search achievements..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {(["all", "unlocked", "locked"] as AchFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setAchFilter(f);
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                achFilter === f ? "bg-indigo-500 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Count line */}
      <p className="text-xs text-zinc-600 -mt-2">
        Showing {filtered.length} of {achievements.length} achievements
      </p>

      {/* Achievement grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((ach) => (
            <AchievementCard key={ach.id} ach={ach} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="text-zinc-400">
            {achievements.length === 0
              ? "No achievements found for this game."
              : "No achievements match your filter."}
          </p>
        </div>
      )}
    </div>
  );
}
