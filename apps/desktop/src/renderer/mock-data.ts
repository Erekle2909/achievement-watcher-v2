// Mock data for UI development — swap for real IPC calls when bridge is ready

export type AchievementSource = "steam" | "goldberg" | "codex" | "skidrow" | "rld";
export type AchievementRarity = "common" | "uncommon" | "rare" | "very_rare" | "ultra_rare";

export interface MockGame {
  id: string;
  appId: string;
  name: string;
  source: AchievementSource;
  totalAchievements: number;
  unlockedAchievements: number;
  lastPlayed: string; // ISO date string
  playtimeHours: number;
  gradientFrom: string;
  gradientTo: string;
}

export interface MockAchievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string; // ISO date string
  rarity: AchievementRarity;
  rarityPercent: number; // 0–100, % of players who have it
  hidden: boolean;
  points: number;
}

export interface MockRecentUnlock {
  id: string;
  gameId: string;
  gameName: string;
  achievementId: string;
  achievementName: string;
  rarity: AchievementRarity;
  unlockedAt: string; // ISO date string
}

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export const mockGames: MockGame[] = [
  {
    id: "goldberg:12345",
    appId: "12345",
    name: "Elden Ring",
    source: "goldberg",
    totalAchievements: 42,
    unlockedAchievements: 38,
    lastPlayed: "2026-04-12T18:30:00Z",
    playtimeHours: 187,
    gradientFrom: "#1e1b4b",
    gradientTo: "#7c3aed",
  },
  {
    id: "steam:1091500",
    appId: "1091500",
    name: "Cyberpunk 2077",
    source: "steam",
    totalAchievements: 55,
    unlockedAchievements: 29,
    lastPlayed: "2026-04-10T21:00:00Z",
    playtimeHours: 94,
    gradientFrom: "#0c1a2e",
    gradientTo: "#f59e0b",
  },
  {
    id: "goldberg:1245620",
    appId: "1245620",
    name: "Elden Ring: Shadow of the Erdtree",
    source: "goldberg",
    totalAchievements: 20,
    unlockedAchievements: 12,
    lastPlayed: "2026-04-08T14:00:00Z",
    playtimeHours: 44,
    gradientFrom: "#1a0a00",
    gradientTo: "#c2410c",
  },
  {
    id: "codex:1716740",
    appId: "1716740",
    name: "Lies of P",
    source: "codex",
    totalAchievements: 29,
    unlockedAchievements: 29,
    lastPlayed: "2026-03-25T19:45:00Z",
    playtimeHours: 61,
    gradientFrom: "#0a0a14",
    gradientTo: "#3b82f6",
  },
  {
    id: "steam:2050650",
    appId: "2050650",
    name: "Hogwarts Legacy",
    source: "steam",
    totalAchievements: 45,
    unlockedAchievements: 11,
    lastPlayed: "2026-03-18T17:00:00Z",
    playtimeHours: 22,
    gradientFrom: "#14000a",
    gradientTo: "#9333ea",
  },
  {
    id: "skidrow:1593500",
    appId: "1593500",
    name: "God of War",
    source: "skidrow",
    totalAchievements: 37,
    unlockedAchievements: 37,
    lastPlayed: "2026-03-10T20:00:00Z",
    playtimeHours: 72,
    gradientFrom: "#1a0606",
    gradientTo: "#dc2626",
  },
  {
    id: "goldberg:570940",
    appId: "570940",
    name: "Dark Souls III",
    source: "goldberg",
    totalAchievements: 38,
    unlockedAchievements: 15,
    lastPlayed: "2026-02-28T22:00:00Z",
    playtimeHours: 130,
    gradientFrom: "#0a0a0a",
    gradientTo: "#52525b",
  },
  {
    id: "rld:1086940",
    appId: "1086940",
    name: "Baldur's Gate 3",
    source: "rld",
    totalAchievements: 54,
    unlockedAchievements: 7,
    lastPlayed: "2026-02-20T16:00:00Z",
    playtimeHours: 18,
    gradientFrom: "#060d1a",
    gradientTo: "#0369a1",
  },
  {
    id: "steam:1817070",
    appId: "1817070",
    name: "Wo Long: Fallen Dynasty",
    source: "steam",
    totalAchievements: 51,
    unlockedAchievements: 0,
    lastPlayed: "2026-02-05T11:00:00Z",
    playtimeHours: 3,
    gradientFrom: "#0a1a0a",
    gradientTo: "#15803d",
  },
  {
    id: "codex:2344520",
    appId: "2344520",
    name: "Armored Core VI",
    source: "codex",
    totalAchievements: 33,
    unlockedAchievements: 21,
    lastPlayed: "2026-01-30T13:00:00Z",
    playtimeHours: 55,
    gradientFrom: "#0a0014",
    gradientTo: "#7c3aed",
  },
];

// ---------------------------------------------------------------------------
// Achievements for a single game (Elden Ring)
// ---------------------------------------------------------------------------

export const mockAchievements: Record<string, MockAchievement[]> = {
  "goldberg:12345": [
    {
      id: "ACH_ELDEN_LORD",
      name: "Elden Lord",
      description: "Became Elden Lord. You have mended the Elden Ring.",
      unlocked: true,
      unlockedAt: "2026-04-12T18:24:00Z",
      rarity: "ultra_rare",
      rarityPercent: 2.1,
      hidden: false,
      points: 100,
    },
    {
      id: "ACH_TARNISHED",
      name: "Tarnished",
      description: "Start your journey as a Tarnished.",
      unlocked: true,
      unlockedAt: "2026-01-10T09:00:00Z",
      rarity: "common",
      rarityPercent: 89.3,
      hidden: false,
      points: 10,
    },
    {
      id: "ACH_MARGIT",
      name: "Margit the Fell Omen",
      description: "Defeated Margit, the Fell Omen.",
      unlocked: true,
      unlockedAt: "2026-01-11T14:35:00Z",
      rarity: "uncommon",
      rarityPercent: 62.5,
      hidden: false,
      points: 20,
    },
    {
      id: "ACH_GODRICK",
      name: "Godrick the Grafted",
      description: "Defeated Godrick the Grafted.",
      unlocked: true,
      unlockedAt: "2026-01-12T20:12:00Z",
      rarity: "uncommon",
      rarityPercent: 55.8,
      hidden: false,
      points: 20,
    },
    {
      id: "ACH_RENNALA",
      name: "Rennala, Queen of the Full Moon",
      description: "Defeated Rennala, Queen of the Full Moon.",
      unlocked: true,
      unlockedAt: "2026-01-15T17:00:00Z",
      rarity: "rare",
      rarityPercent: 40.1,
      hidden: false,
      points: 30,
    },
    {
      id: "ACH_RADAHN",
      name: "Starscourge Radahn",
      description: "Defeated Starscourge Radahn.",
      unlocked: true,
      unlockedAt: "2026-01-20T23:10:00Z",
      rarity: "rare",
      rarityPercent: 31.7,
      hidden: false,
      points: 30,
    },
    {
      id: "ACH_MORGOTT",
      name: "Morgott, the Omen King",
      description: "Defeated Morgott, the Omen King.",
      unlocked: true,
      unlockedAt: "2026-02-01T19:45:00Z",
      rarity: "very_rare",
      rarityPercent: 18.4,
      hidden: false,
      points: 50,
    },
    {
      id: "ACH_MALIKETH",
      name: "Maliketh, the Black Blade",
      description: "Defeated Maliketh, the Black Blade.",
      unlocked: true,
      unlockedAt: "2026-02-14T22:30:00Z",
      rarity: "very_rare",
      rarityPercent: 12.3,
      hidden: false,
      points: 50,
    },
    {
      id: "ACH_GODFREY",
      name: "Godfrey, First Elden Lord",
      description: "Defeated Godfrey, First Elden Lord.",
      unlocked: true,
      unlockedAt: "2026-02-16T20:55:00Z",
      rarity: "very_rare",
      rarityPercent: 10.9,
      hidden: false,
      points: 50,
    },
    {
      id: "ACH_RADAGON",
      name: "Radagon of the Golden Order",
      description: "Defeated Radagon of the Golden Order.",
      unlocked: true,
      unlockedAt: "2026-04-12T18:05:00Z",
      rarity: "ultra_rare",
      rarityPercent: 5.2,
      hidden: false,
      points: 75,
    },
    {
      id: "ACH_LICHDRAGON",
      name: "Lichdragon Fortissax",
      description: "Defeated Lichdragon Fortissax.",
      unlocked: true,
      unlockedAt: "2026-03-05T21:00:00Z",
      rarity: "very_rare",
      rarityPercent: 8.6,
      hidden: true,
      points: 50,
    },
    {
      id: "ACH_ASTEL",
      name: "Astel, Naturalborn of the Void",
      description: "Defeated Astel, Naturalborn of the Void.",
      unlocked: true,
      unlockedAt: "2026-03-10T23:15:00Z",
      rarity: "very_rare",
      rarityPercent: 9.1,
      hidden: true,
      points: 50,
    },
    {
      id: "ACH_DRAGONLORD",
      name: "Dragonlord Placidusax",
      description: "Defeated Dragonlord Placidusax.",
      unlocked: true,
      unlockedAt: "2026-03-20T18:40:00Z",
      rarity: "very_rare",
      rarityPercent: 7.4,
      hidden: true,
      points: 50,
    },
    {
      id: "ACH_SHARDBEARERS",
      name: "Shardbearer Rykard",
      description: "Defeated Rykard, Lord of Blasphemy.",
      unlocked: true,
      unlockedAt: "2026-02-22T15:00:00Z",
      rarity: "rare",
      rarityPercent: 22.6,
      hidden: false,
      points: 30,
    },
    {
      id: "ACH_MOHG",
      name: "Mohg, Lord of Blood",
      description: "Defeated Mohg, Lord of Blood.",
      unlocked: true,
      unlockedAt: "2026-04-01T20:30:00Z",
      rarity: "very_rare",
      rarityPercent: 11.2,
      hidden: false,
      points: 50,
    },
    {
      id: "ACH_FIRE_GIANT",
      name: "Fire Giant",
      description: "Defeated the Fire Giant.",
      unlocked: true,
      unlockedAt: "2026-02-10T17:20:00Z",
      rarity: "very_rare",
      rarityPercent: 15.8,
      hidden: false,
      points: 50,
    },
    {
      id: "ACH_MALENIA",
      name: "Malenia, Blade of Miquella",
      description: "Defeated Malenia, Blade of Miquella.",
      unlocked: true,
      unlockedAt: "2026-04-05T01:14:00Z",
      rarity: "ultra_rare",
      rarityPercent: 3.8,
      hidden: true,
      points: 100,
    },
    {
      id: "ACH_GRAND_LIFT",
      name: "Grand Lift of Rold",
      description: "Activated the Grand Lift of Rold.",
      unlocked: true,
      unlockedAt: "2026-02-05T16:00:00Z",
      rarity: "uncommon",
      rarityPercent: 28.3,
      hidden: false,
      points: 20,
    },
    {
      id: "ACH_ROUNDTABLE",
      name: "Roundtable Hold",
      description: "Arrive at the Roundtable Hold.",
      unlocked: false,
      rarity: "common",
      rarityPercent: 74.5,
      hidden: false,
      points: 10,
    },
    {
      id: "ACH_AGE_OF_STARS",
      name: "Age of Stars",
      description: "Reached the Age of Stars ending.",
      unlocked: false,
      rarity: "ultra_rare",
      rarityPercent: 1.9,
      hidden: true,
      points: 100,
    },
  ],
};

// ---------------------------------------------------------------------------
// Recent unlocks feed
// ---------------------------------------------------------------------------

export const mockRecentUnlocks: MockRecentUnlock[] = [
  {
    id: "ru_01",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_ELDEN_LORD",
    achievementName: "Elden Lord",
    rarity: "ultra_rare",
    unlockedAt: "2026-04-12T18:24:00Z",
  },
  {
    id: "ru_02",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_RADAGON",
    achievementName: "Radagon of the Golden Order",
    rarity: "ultra_rare",
    unlockedAt: "2026-04-12T18:05:00Z",
  },
  {
    id: "ru_03",
    gameId: "steam:1091500",
    gameName: "Cyberpunk 2077",
    achievementId: "ACH_LEGEND",
    achievementName: "The Legend Himself",
    rarity: "very_rare",
    unlockedAt: "2026-04-10T21:42:00Z",
  },
  {
    id: "ru_04",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_MALENIA",
    achievementName: "Malenia, Blade of Miquella",
    rarity: "ultra_rare",
    unlockedAt: "2026-04-05T01:14:00Z",
  },
  {
    id: "ru_05",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_MOHG",
    achievementName: "Mohg, Lord of Blood",
    rarity: "very_rare",
    unlockedAt: "2026-04-01T20:30:00Z",
  },
  {
    id: "ru_06",
    gameId: "steam:1091500",
    gameName: "Cyberpunk 2077",
    achievementId: "ACH_NOMAD",
    achievementName: "Nomad",
    rarity: "uncommon",
    unlockedAt: "2026-03-31T15:10:00Z",
  },
  {
    id: "ru_07",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_DRAGONLORD",
    achievementName: "Dragonlord Placidusax",
    rarity: "very_rare",
    unlockedAt: "2026-03-20T18:40:00Z",
  },
  {
    id: "ru_08",
    gameId: "codex:1716740",
    gameName: "Lies of P",
    achievementId: "ACH_TRUE_LIAR",
    achievementName: "True Liar",
    rarity: "rare",
    unlockedAt: "2026-03-25T20:00:00Z",
  },
  {
    id: "ru_09",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_ASTEL",
    achievementName: "Astel, Naturalborn of the Void",
    rarity: "very_rare",
    unlockedAt: "2026-03-10T23:15:00Z",
  },
  {
    id: "ru_10",
    gameId: "steam:2050650",
    gameName: "Hogwarts Legacy",
    achievementId: "ACH_COLLECTOR",
    achievementName: "The Collector",
    rarity: "rare",
    unlockedAt: "2026-03-18T17:30:00Z",
  },
  {
    id: "ru_11",
    gameId: "goldberg:12345",
    gameName: "Elden Ring",
    achievementId: "ACH_LICHDRAGON",
    achievementName: "Lichdragon Fortissax",
    rarity: "very_rare",
    unlockedAt: "2026-03-05T21:00:00Z",
  },
  {
    id: "ru_12",
    gameId: "codex:2344520",
    gameName: "Armored Core VI",
    achievementId: "ACH_AYRE",
    achievementName: "Her Wings of Light",
    rarity: "ultra_rare",
    unlockedAt: "2026-01-30T13:44:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export function getSourceBadge(source: AchievementSource): string {
  switch (source) {
    case "steam":
      return "bg-sky-900/60 text-sky-300";
    case "goldberg":
      return "bg-indigo-900/60 text-indigo-300";
    case "codex":
      return "bg-rose-900/60 text-rose-300";
    case "skidrow":
      return "bg-orange-900/60 text-orange-300";
    case "rld":
      return "bg-teal-900/60 text-teal-300";
  }
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 60) return `${String(minutes)}m ago`;
  if (hours < 24) return `${String(hours)}h ago`;
  if (days < 7) return `${String(days)}d ago`;
  return new Date(isoDate).toLocaleDateString();
}
