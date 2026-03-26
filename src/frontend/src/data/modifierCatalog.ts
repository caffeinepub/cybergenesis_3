// Static modifier catalog with 48 entries + 7 Keeper entries (slot 49)

export interface PlannedModifier {
  id: number;
  name: string;
  rarity_tier: 1 | 2 | 3 | 4;
  asset_url: string;
}

export interface KeeperModifier {
  id: 49;
  region: string;
  biome: string;
  name: string;
  asset_url: string;
  color: string;
}

const BASE =
  "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Mods/";

export const PLANNED_MODIFIER_CATALOG: PlannedModifier[] = [
  // ── Tier 1 Common · Slots 1–15 ──────────────────────────────────────────
  {
    id: 1,
    name: "RuBaRu",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_1.webp`,
  },
  {
    id: 2,
    name: "Omnity",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_2.webp`,
  },
  {
    id: 3,
    name: "Catalyze",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_3.webp`,
  },
  {
    id: 4,
    name: "ELNAai",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_4.webp`,
  },
  { id: 5, name: "BoB", rarity_tier: 1, asset_url: `${BASE}modifier_5.webp` },
  {
    id: 6,
    name: "KinicAI",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_6.webp`,
  },
  { id: 7, name: "CLOUD", rarity_tier: 1, asset_url: `${BASE}modifier_7.webp` },
  {
    id: 8,
    name: "WaterNeuron",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_8.webp`,
  },
  {
    id: 9,
    name: "ICLighthouse",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_9.webp`,
  },
  {
    id: 10,
    name: "LiquidiumWTF",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_10.webp`,
  },
  {
    id: 11,
    name: "DecideAI",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_11.webp`,
  },
  {
    id: 12,
    name: "ICPHUBS",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_12.webp`,
  },
  {
    id: 13,
    name: "TRAX",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_13.webp`,
  },
  {
    id: 14,
    name: "zCloak",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_14.webp`,
  },
  {
    id: 15,
    name: "GLDT",
    rarity_tier: 1,
    asset_url: `${BASE}modifier_15.webp`,
  },
  // ── Tier 2 Rare · Slots 16–30 ───────────────────────────────────────────
  {
    id: 16,
    name: "Plug",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_16.webp`,
  },
  {
    id: 17,
    name: "dscvrOne",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_17.webp`,
  },
  {
    id: 18,
    name: "distrikt",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_18.webp`,
  },
  {
    id: 19,
    name: "BoomDAO",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_19.webp`,
  },
  {
    id: 20,
    name: "YRAL",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_20.webp`,
  },
  {
    id: 21,
    name: "onicai",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_21.webp`,
  },
  {
    id: 22,
    name: "IC_GHOST",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_22.webp`,
  },
  {
    id: 23,
    name: "SNEED",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_23.webp`,
  },
  {
    id: 24,
    name: "WUMBO",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_24.webp`,
  },
  {
    id: 25,
    name: "Sonic",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_25.webp`,
  },
  {
    id: 26,
    name: "ICPSwap",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_26.webp`,
  },
  { id: 27, name: "COE", rarity_tier: 2, asset_url: `${BASE}modifier_27.webp` },
  {
    id: 28,
    name: "Windoge98",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_28.webp`,
  },
  {
    id: 29,
    name: "Yuku",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_29.webp`,
  },
  {
    id: 30,
    name: "TabbyPOS",
    rarity_tier: 2,
    asset_url: `${BASE}modifier_30.webp`,
  },
  // ── Tier 3 Legendary · Slots 31–42 ──────────────────────────────────────
  {
    id: 31,
    name: "CLOWN",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_31.webp`,
  },
  {
    id: 32,
    name: "drifty",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_32.webp`,
  },
  {
    id: 33,
    name: "DOGMI",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_33.webp`,
  },
  {
    id: 34,
    name: "OpenChat",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_34.webp`,
  },
  {
    id: 35,
    name: "KongSwap",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_35.webp`,
  },
  {
    id: 36,
    name: "Odin_fun",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_36.webp`,
  },
  {
    id: 37,
    name: "TokoApp",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_37.webp`,
  },
  {
    id: 38,
    name: "DfinityDEV",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_38.webp`,
  },
  {
    id: 39,
    name: "Piggycell",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_39.webp`,
  },
  {
    id: 40,
    name: "Dragginz",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_40.webp`,
  },
  {
    id: 41,
    name: "TAGGR",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_41.webp`,
  },
  {
    id: 42,
    name: "ICPanda",
    rarity_tier: 3,
    asset_url: `${BASE}modifier_42.webp`,
  },
  // ── Tier 4 Mythic · Slots 43–48 ─────────────────────────────────────────
  {
    id: 43,
    name: "OISY",
    rarity_tier: 4,
    asset_url: `${BASE}modifier_43.webp`,
  },
  {
    id: 44,
    name: "DMAIL",
    rarity_tier: 4,
    asset_url: `${BASE}modifier_44.webp`,
  },
  { id: 45, name: "ICP", rarity_tier: 4, asset_url: `${BASE}modifier_45.webp` },
  {
    id: 46,
    name: "Motoko",
    rarity_tier: 4,
    asset_url: `${BASE}modifier_46.webp`,
  },
  {
    id: 47,
    name: "caffeine",
    rarity_tier: 4,
    asset_url: `${BASE}modifier_47.webp`,
  },
  {
    id: 48,
    name: "InternetComputer",
    rarity_tier: 4,
    asset_url: `${BASE}modifier_48.webp`,
  },
  // ── Slot 49 is reserved for the Region Keeper (see KEEPER_CATALOG) ──────
];

// ── Keeper Catalog · Slot 49 · One per Region ────────────────────────────────
// Keepers are NOT obtainable from caches. They are crafted.
// Each Keeper can only be installed on a LAND matching its region.
export const KEEPER_CATALOG: KeeperModifier[] = [
  {
    id: 49,
    region: "FOREST_VALLEY",
    biome: "Forest Valley",
    name: "Forest Keeper",
    asset_url: `${BASE}modifier_49_forest.webp`,
    color: "#4ade80",
  },
  {
    id: 49,
    region: "ISLAND_ARCHIPELAGO",
    biome: "Island Archipelago",
    name: "Island Keeper",
    asset_url: `${BASE}modifier_49_island.webp`,
    color: "#22d3ee",
  },
  {
    id: 49,
    region: "SNOW_PEAK",
    biome: "Snow Peak",
    name: "Snow Keeper",
    asset_url: `${BASE}modifier_49_snow.webp`,
    color: "#60a5fa",
  },
  {
    id: 49,
    region: "DESERT_DUNE",
    biome: "Desert Dune",
    name: "Desert Keeper",
    asset_url: `${BASE}modifier_49_desert.webp`,
    color: "#f59e0b",
  },
  {
    id: 49,
    region: "VOLCANIC_CRAG",
    biome: "Volcanic Crag",
    name: "Volcanic Keeper",
    asset_url: `${BASE}modifier_49_volcanic.webp`,
    color: "#f87171",
  },
  {
    id: 49,
    region: "MYTHIC_VOID",
    biome: "Mythic Void",
    name: "Void Keeper",
    asset_url: `${BASE}modifier_49_void.webp`,
    color: "#a855f7",
  },
  {
    id: 49,
    region: "MYTHIC_AETHER",
    biome: "Mythic Aether",
    name: "Aether Keeper",
    asset_url: `${BASE}modifier_49_aether.webp`,
    color: "#cc44ff",
  },
];

// ── Rarity colour map (tier → hex) ───────────────────────────────────────────
export const RARITY_COLORS: Record<number, string> = {
  1: "#9CA3AF", // Common
  2: "#60A5FA", // Rare
  3: "#A855F7", // Legendary
  4: "#FACC15", // Mythic
  5: "#cc44ff", // Keeper (slot 49)
};

export const RARITY_GLOW: Record<number, string> = {
  1: "rgba(156,163,175,0.25)",
  2: "rgba(96,165,250,0.45)",
  3: "rgba(168,85,247,0.55)",
  4: "rgba(250,204,21,0.7)",
  5: "rgba(204,68,255,0.7)", // Keeper
};

// ── Tier display names ────────────────────────────────────────────────────────
export const TIER_NAMES: Record<number, string> = {
  1: "COMMON",
  2: "RARE",
  3: "LEGENDARY",
  4: "MYTHIC",
  5: "KEEPER",
};

// ── Slot ranges per tier ──────────────────────────────────────────────────────
export const TIER_SLOTS: Record<number, string> = {
  1: "Slots 1–15",
  2: "Slots 16–30",
  3: "Slots 31–42",
  4: "Slots 43–48",
  5: "Slot 49",
};
