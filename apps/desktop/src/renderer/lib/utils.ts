// UI utility helpers — rarity colors, source badges, time formatting
// Extracted from mock-data.ts so pages can use them without importing mocks.

export type AchievementSource = "native" | "steam-emu" | "ubisoft-emu" | "emulator";
export type AchievementRarity = "common" | "uncommon" | "rare" | "very_rare" | "ultra_rare";

export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case "common":
      return "text-zinc-400";
    case "uncommon":
      return "text-green-400";
    case "rare":
      return "text-blue-400";
    case "very_rare":
      return "text-purple-400";
    case "ultra_rare":
      return "text-amber-400";
  }
}

export function getRarityBg(rarity: AchievementRarity): string {
  switch (rarity) {
    case "common":
      return "bg-zinc-700 text-zinc-300";
    case "uncommon":
      return "bg-green-900/60 text-green-300";
    case "rare":
      return "bg-blue-900/60 text-blue-300";
    case "very_rare":
      return "bg-purple-900/60 text-purple-300";
    case "ultra_rare":
      return "bg-amber-900/60 text-amber-300";
  }
}

export function getRarityLabel(rarity: AchievementRarity): string {
  switch (rarity) {
    case "common":
      return "Common";
    case "uncommon":
      return "Uncommon";
    case "rare":
      return "Rare";
    case "very_rare":
      return "Very Rare";
    case "ultra_rare":
      return "Ultra Rare";
  }
}

export function getSourceBadge(source: string): string {
  switch (source) {
    case "native":
      return "bg-sky-900/60 text-sky-300";
    case "steam-emu":
      return "bg-indigo-900/60 text-indigo-300";
    case "ubisoft-emu":
      return "bg-orange-900/60 text-orange-300";
    case "emulator":
      return "bg-teal-900/60 text-teal-300";
    default:
      return "bg-zinc-700/60 text-zinc-300";
  }
}

export function formatRelativeTime(isoOrTimestamp: string | number): string {
  const time =
    typeof isoOrTimestamp === "number" ? isoOrTimestamp : new Date(isoOrTimestamp).getTime();
  const diff = Date.now() - time;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 60) return `${String(minutes)}m ago`;
  if (hours < 24) return `${String(hours)}h ago`;
  if (days < 7) return `${String(days)}d ago`;
  return new Date(time).toLocaleDateString();
}

/**
 * Derive a rarity tier from a numeric percentage (0-100).
 * Used when the DB stores rarity as a float rather than an enum.
 */
export function rarityFromPercent(pct: number | null | undefined): AchievementRarity {
  if (pct == null || pct >= 50) return "common";
  if (pct >= 25) return "uncommon";
  if (pct >= 10) return "rare";
  if (pct >= 5) return "very_rare";
  return "ultra_rare";
}

export const SOURCE_LABELS: Record<string, string> = {
  all: "All Sources",
  native: "Steam",
  "steam-emu": "Steam Emu",
  "ubisoft-emu": "Ubisoft Emu",
  emulator: "Emulator",
};

export const SOURCE_COLORS: Record<string, string> = {
  native: "bg-sky-500",
  "steam-emu": "bg-indigo-500",
  "ubisoft-emu": "bg-orange-500",
  emulator: "bg-teal-500",
};

/**
 * Safely get a display label for any source string.
 * Falls back to title-casing the raw source if not in the lookup.
 */
export function getSourceLabel(source: string): string {
  return (
    SOURCE_LABELS[source] ?? source.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Build a Steam CDN header image URL from an appId.
 */
export function steamHeaderUrl(appId: string): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
