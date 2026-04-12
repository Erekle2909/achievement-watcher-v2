import {
  mockGames,
  mockRecentUnlocks,
  mockAchievements,
  getRarityBg,
  getRarityLabel,
  getRarityColor,
  formatRelativeTime,
} from "../mock-data";

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------

const totalGames = mockGames.length;
const totalUnlocked = mockGames.reduce((sum, g) => sum + g.unlockedAchievements, 0);
const totalPossible = mockGames.reduce((sum, g) => sum + g.totalAchievements, 0);
const completionPct = totalPossible > 0 ? Math.round((totalUnlocked / totalPossible) * 100) : 0;

// Find rarest unlocked achievement across all games
const rarestAchievement = (() => {
  let rarest: { name: string; game: string; pct: number } | null = null;
  for (const [gameId, achs] of Object.entries(mockAchievements)) {
    const game = mockGames.find((g) => g.id === gameId);
    if (!game) continue;
    for (const ach of achs) {
      if (ach.unlocked) {
        if (!rarest || ach.rarityPercent < rarest.pct) {
          rarest = { name: ach.name, game: game.name, pct: ach.rarityPercent };
        }
      }
    }
  }
  return rarest;
})();

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
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold ${accentClass}`}>{value}</span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent unlock row
// ---------------------------------------------------------------------------

function UnlockRow({ unlock }: { unlock: (typeof mockRecentUnlocks)[0] }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/60 transition-colors group">
      {/* Icon placeholder */}
      <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl flex-shrink-0 group-hover:border-indigo-500/40 transition-colors">
        🏆
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{unlock.achievementName}</p>
        <p className="text-xs text-zinc-500 truncate">{unlock.gameName}</p>
      </div>

      {/* Rarity + time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRarityBg(unlock.rarity)}`}
        >
          {getRarityLabel(unlock.rarity)}
        </span>
        <span className="text-xs text-zinc-600">{formatRelativeTime(unlock.unlockedAt)}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Dashboard() {
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
          value={rarestAchievement ? `${String(rarestAchievement.pct)}%` : "—"}
          sub={
            rarestAchievement ? `${rarestAchievement.name} · ${rarestAchievement.game}` : undefined
          }
          accentClass="text-amber-400"
        />
      </div>

      {/* Recent unlocks feed */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Recent Unlocks</h3>
          <span className="text-xs text-zinc-600">{mockRecentUnlocks.length} shown</span>
        </div>
        <div className="p-2 flex flex-col">
          {mockRecentUnlocks.map((unlock) => (
            <UnlockRow key={unlock.id} unlock={unlock} />
          ))}
        </div>
      </div>

      {/* Quick completion overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">Top Games by Completion</h3>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {[...mockGames]
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
                  <span className="text-sm text-zinc-300 w-44 truncate">{game.name}</span>
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
