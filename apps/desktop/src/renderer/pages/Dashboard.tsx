import { useState, useEffect } from "react";
import {
  getRarityBg,
  getRarityLabel,
  getRarityColor,
  formatRelativeTime,
  rarityFromPercent,
  steamHeaderUrl,
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
  iconUrl: string | null;
  totalAchievements: number;
  unlockedAchievements: number;
  lastPlayed: number | null;
  playtime: number;
}

interface RecentUnlockRow {
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

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accentClass?: string;
}

function StatCard({ label, value, sub, accentClass = "text-zinc-100" }: StatCardProps) {
  // Map text accent class to a matching left-border color
  const borderColor = accentClass.includes("indigo")
    ? "border-l-indigo-500"
    : accentClass.includes("green")
      ? "border-l-green-500"
      : accentClass.includes("amber")
        ? "border-l-amber-500"
        : "border-l-zinc-600";

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 ${borderColor} border-l-2 rounded-lg p-4 flex flex-col gap-1`}
    >
      <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</span>
      <span className={`text-3xl font-bold ${accentClass}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent unlock row
// ---------------------------------------------------------------------------

interface UnlockRowProps {
  unlock: RecentUnlockRow;
  gameName: string;
  gameAppId: string | null;
  gameIconUrl: string | null;
}

function UnlockRow({ unlock, gameName, gameAppId, gameIconUrl }: UnlockRowProps) {
  const rarity: AchievementRarity = rarityFromPercent(unlock.rarity);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors group">
      {/* Achievement icon or game thumbnail fallback */}
      <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-indigo-500/40 transition-colors overflow-hidden">
        {unlock.iconUrl ? (
          <img src={unlock.iconUrl} alt="" className="w-full h-full object-cover" />
        ) : gameAppId ? (
          <img
            src={gameIconUrl || steamHeaderUrl(gameAppId)}
            alt=""
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-amber-400 text-lg">*</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{unlock.name}</p>
        <p className="text-xs text-zinc-500 truncate">{gameName}</p>
      </div>

      {/* Rarity + time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRarityBg(rarity)}`}>
          {getRarityLabel(rarity)}
        </span>
        {unlock.unlockTime && (
          <span className="text-xs text-zinc-600">
            {formatRelativeTime(unlock.unlockTime * 1000)}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Dashboard() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<RecentUnlockRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const api = window.electronAPI;
      if (!api) {
        setLoading(false);
        return;
      }

      try {
        const [gamesData, recentData] = await Promise.all([
          api.getGames(),
          api.getRecentUnlocks(15),
        ]);
        setGames(gamesData as GameRow[]);
        setRecentUnlocks(recentData as RecentUnlockRow[]);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-1">Your achievement progress at a glance.</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
          <p className="text-sm text-zinc-500 mt-1">Your achievement progress at a glance.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-3">🎮</span>
          <p className="text-zinc-400 font-medium">No games found</p>
          <p className="text-zinc-600 text-sm mt-1">
            Make sure Steam is running and your API key is configured in Settings.
          </p>
        </div>
      </div>
    );
  }

  // Derived stats
  const totalGames = games.length;
  const totalUnlocked = games.reduce((sum, g) => sum + g.unlockedAchievements, 0);
  const totalPossible = games.reduce((sum, g) => sum + g.totalAchievements, 0);
  const completionPct = totalPossible > 0 ? Math.round((totalUnlocked / totalPossible) * 100) : 0;

  // Build lookups from gameId for the recent unlocks feed
  const gameNameMap = new Map(games.map((g) => [g.id, g.name]));
  const gameAppIdMap = new Map(games.map((g) => [g.id, g.appId]));
  const gameIconMap = new Map(games.map((g) => [g.id, g.iconUrl]));

  // Find rarest recent unlock
  const rarestUnlock = recentUnlocks.reduce<{ name: string; game: string; pct: number } | null>(
    (best, u) => {
      const pct = u.rarity ?? 100;
      if (!best || pct < best.pct) {
        return { name: u.name, game: gameNameMap.get(u.gameId) ?? "Unknown", pct };
      }
      return best;
    },
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">Your achievement progress at a glance.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Games Tracked" value={String(totalGames)} sub="across all sources" />
        <StatCard
          label="Achievements"
          value={String(totalUnlocked)}
          sub={`of ${String(totalPossible)} possible`}
          accentClass="text-indigo-400"
        />
        <StatCard
          label="Completion"
          value={`${String(completionPct)}%`}
          sub="overall average"
          accentClass={
            completionPct >= 75
              ? "text-green-400"
              : completionPct >= 40
                ? "text-indigo-400"
                : "text-zinc-100"
          }
        />
        <StatCard
          label="Rarest Unlock"
          value={rarestUnlock ? `${String(rarestUnlock.pct)}%` : "\u2014"}
          sub={rarestUnlock ? `${rarestUnlock.name} \u00b7 ${rarestUnlock.game}` : undefined}
          accentClass="text-amber-400"
        />
      </div>

      {/* Recent unlocks feed */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Recent Unlocks</h3>
          <span className="text-xs text-zinc-600">{recentUnlocks.length} shown</span>
        </div>
        <div className="p-2 flex flex-col">
          {recentUnlocks.length > 0 ? (
            recentUnlocks.map((unlock) => (
              <UnlockRow
                key={unlock.id}
                unlock={unlock}
                gameName={gameNameMap.get(unlock.gameId) ?? "Unknown"}
                gameAppId={gameAppIdMap.get(unlock.gameId) ?? null}
                gameIconUrl={gameIconMap.get(unlock.gameId) ?? null}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500 p-3">No recent unlocks yet.</p>
          )}
        </div>
      </div>

      {/* Quick completion overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">Top Games by Completion</h3>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {[...games]
            .sort((a, b) => {
              const pctA =
                a.totalAchievements > 0 ? a.unlockedAchievements / a.totalAchievements : 0;
              const pctB =
                b.totalAchievements > 0 ? b.unlockedAchievements / b.totalAchievements : 0;
              return pctB - pctA;
            })
            .slice(0, 5)
            .map((game) => {
              const pct =
                game.totalAchievements > 0
                  ? Math.round((game.unlockedAchievements / game.totalAchievements) * 100)
                  : 0;
              return (
                <div key={game.id} className="flex items-center gap-3">
                  {/* Small game thumbnail */}
                  <div className="w-8 h-8 rounded flex-shrink-0 overflow-hidden bg-zinc-800">
                    <img
                      src={game.iconUrl || steamHeaderUrl(game.appId)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span className="text-sm text-zinc-300 w-40 truncate">{game.name}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct === 100 ? "bg-green-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${String(pct)}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs w-10 text-right tabular-nums ${
                      pct === 100
                        ? "text-green-400"
                        : getRarityColor(
                            pct >= 90
                              ? "ultra_rare"
                              : pct >= 60
                                ? "very_rare"
                                : pct >= 30
                                  ? "rare"
                                  : "common",
                          )
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
