import {
  mockGames,
  mockRecentUnlocks,
  mockAchievements,
  type AchievementSource,
} from "../mock-data";

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------

const totalUnlocked = mockGames.reduce((s, g) => s + g.unlockedAchievements, 0);
const totalPossible = mockGames.reduce((s, g) => s + g.totalAchievements, 0);
const completionPct = totalPossible > 0 ? Math.round((totalUnlocked / totalPossible) * 100) : 0;

// Achievement score: sum points of unlocked achievements in mock data (weighted by rarity)
const achievementScore = Object.values(mockAchievements)
  .flat()
  .filter((a) => a.unlocked)
  .reduce((s, a) => s + a.points, 0);

// Source breakdown
const sourceBreakdown: Record<AchievementSource, { unlocked: number; total: number }> = {
  steam: { unlocked: 0, total: 0 },
  goldberg: { unlocked: 0, total: 0 },
  codex: { unlocked: 0, total: 0 },
  skidrow: { unlocked: 0, total: 0 },
  rld: { unlocked: 0, total: 0 },
};
for (const g of mockGames) {
  sourceBreakdown[g.source].unlocked += g.unlockedAchievements;
  sourceBreakdown[g.source].total += g.totalAchievements;
}

// Top 5 games by completion %
const topGames = [...mockGames]
  .filter((g) => g.totalAchievements > 0)
  .map((g) => ({
    ...g,
    pct: Math.round((g.unlockedAchievements / g.totalAchievements) * 100),
  }))
  .sort((a, b) => b.pct - a.pct)
  .slice(0, 5);

// Last 7 days activity: count unlocks per day
const today = new Date("2026-04-13T00:00:00Z");
const days: { label: string; count: number }[] = [];
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - i);
  const label = d.toLocaleDateString(undefined, { weekday: "short" });
  const dateStr = d.toISOString().slice(0, 10);
  const count = mockRecentUnlocks.filter((u) => u.unlockedAt.startsWith(dateStr)).length;
  days.push({ label, count });
}
const maxDayCount = Math.max(...days.map((d) => d.count), 1);

// Source display names
const SOURCE_LABELS: Record<AchievementSource, string> = {
  steam: "Steam",
  goldberg: "Goldberg",
  codex: "Codex",
  skidrow: "SKIDROW",
  rld: "RLD",
};

const SOURCE_COLORS: Record<AchievementSource, string> = {
  steam: "bg-sky-500",
  goldberg: "bg-indigo-500",
  codex: "bg-rose-500",
  skidrow: "bg-orange-500",
  rld: "bg-teal-500",
};

// ---------------------------------------------------------------------------
// CSS-only progress ring
// ---------------------------------------------------------------------------

interface ProgressRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
}

function ProgressRing({ pct, size = 120, strokeWidth = 10 }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(39 39 42)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct === 100 ? "rgb(34 197 94)" : "rgb(99 102 241)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Stats() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Stats & Analytics</h2>
        <p className="text-sm text-zinc-500 mt-1">Deep dive into your achievement journey.</p>
      </div>

      {/* Top row: ring + score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completion overview */}
        <Section title="Overall Completion">
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <ProgressRing pct={completionPct} size={120} strokeWidth={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">
                  {completionPct}%
                </span>
                <span className="text-[10px] text-zinc-500">complete</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-3xl font-bold text-indigo-400 tabular-nums">{totalUnlocked}</p>
                <p className="text-xs text-zinc-500">achievements unlocked</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-400 tabular-nums">{totalPossible}</p>
                <p className="text-xs text-zinc-500">total possible</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-400 tabular-nums">
                  {totalPossible - totalUnlocked}
                </p>
                <p className="text-xs text-zinc-500">remaining</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Achievement score */}
        <Section title="Achievement Score">
          <div className="flex flex-col gap-3 items-center justify-center h-full py-4">
            <p className="text-6xl font-bold text-amber-400 tabular-nums">
              {achievementScore.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500">total score points</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-center">
              <div>
                <p className="text-lg font-bold text-zinc-300">
                  {
                    mockGames.filter(
                      (g) =>
                        g.unlockedAchievements === g.totalAchievements && g.totalAchievements > 0,
                    ).length
                  }
                </p>
                <p className="text-xs text-zinc-600">perfect games</p>
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-300">{mockGames.length}</p>
                <p className="text-xs text-zinc-600">games tracked</p>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Source breakdown */}
      <Section title="Source Breakdown">
        <div className="flex flex-col gap-3">
          {(
            Object.entries(sourceBreakdown) as [
              AchievementSource,
              { unlocked: number; total: number },
            ][]
          )
            .filter(([, v]) => v.total > 0)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([source, { unlocked, total }]) => {
              const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
              return (
                <div key={source} className="flex items-center gap-3">
                  <span className="text-sm text-zinc-300 w-24 flex-shrink-0">
                    {SOURCE_LABELS[source]}
                  </span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${SOURCE_COLORS[source]}`}
                      style={{ width: `${String(pct)}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-400 w-24 text-right flex-shrink-0 tabular-nums">
                    {unlocked}/{total} ({pct}%)
                  </span>
                </div>
              );
            })}
        </div>
      </Section>

      {/* Top games */}
      <Section title="Top Games by Completion">
        <div className="flex flex-col gap-3">
          {topGames.map((game, i) => (
            <div key={game.id} className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 w-4 flex-shrink-0 tabular-nums">{i + 1}</span>
              <span className="text-sm text-zinc-300 w-44 truncate flex-shrink-0">{game.name}</span>
              <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${game.pct === 100 ? "bg-green-500" : "bg-indigo-500"}`}
                  style={{ width: `${String(game.pct)}%` }}
                />
              </div>
              <span
                className={`text-xs w-10 text-right flex-shrink-0 tabular-nums font-semibold ${game.pct === 100 ? "text-green-400" : "text-indigo-400"}`}
              >
                {game.pct}%
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Recent activity — last 7 days */}
      <Section title="Recent Activity — Last 7 Days">
        <div className="flex items-end gap-2 h-28">
          {days.map((day, i) => {
            const barPct = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-zinc-400 tabular-nums">{day.count || ""}</span>
                <div
                  className="w-full bg-zinc-800 rounded-t overflow-hidden"
                  style={{ height: "72px" }}
                >
                  <div
                    className="w-full bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${String(barPct)}%`, marginTop: `${String(100 - barPct)}%` }}
                  />
                </div>
                <span className="text-[11px] text-zinc-500">{day.label}</span>
              </div>
            );
          })}
        </div>
        {days.every((d) => d.count === 0) && (
          <p className="text-xs text-zinc-600 mt-2 text-center">No unlocks in the last 7 days.</p>
        )}
      </Section>
    </div>
  );
}
