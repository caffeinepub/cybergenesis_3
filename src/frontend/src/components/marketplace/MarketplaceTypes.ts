import {
  KEEPER_CATALOG,
  PLANNED_MODIFIER_CATALOG,
} from "../../data/modifierCatalog";
import type { ItemType } from "../../hooks/useQueries";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

export const BIOME_COLORS: Record<string, string> = {
  MYTHIC_VOID: "#cc00ff",
  MYTHIC_AETHER: "#0088ff",
  VOLCANIC_CRAG: "#ff2200",
  DESERT_DUNE: "#ffaa00",
  FOREST_VALLEY: "#00ff44",
  SNOW_PEAK: "#88ddff",
  ISLAND_ARCHIPELAGO: "#00ffcc",
};

export const BIOME_DISPLAY: Record<string, string> = {
  MYTHIC_VOID: "MYTHIC VOID",
  MYTHIC_AETHER: "MYTHIC AETHER",
  VOLCANIC_CRAG: "VOLCANIC CRAG",
  DESERT_DUNE: "DESERT DUNE",
  FOREST_VALLEY: "FOREST VALLEY",
  SNOW_PEAK: "SNOW PEAK",
  ISLAND_ARCHIPELAGO: "ISLAND ARCHIPELAGO",
};

export const BIOME_KEYS = Object.keys(BIOME_COLORS);

export const RARITY_META: Record<
  number,
  { label: string; color: string; glow: string; textClass: string }
> = {
  1: {
    label: "COMMON",
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.4)",
    textClass: "text-gray-400",
  },
  2: {
    label: "RARE",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.6)",
    textClass: "text-blue-400",
  },
  3: {
    label: "LEGENDARY",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.7)",
    textClass: "text-purple-400",
  },
  4: {
    label: "MYTHIC",
    color: "#facc15",
    glow: "rgba(250,204,21,0.9)",
    textClass: "text-yellow-400",
  },
  // Tier 5 — Keeper (slot 49)
  5: {
    label: "KEEPER",
    color: "#cc44ff",
    glow: "rgba(204,68,255,0.75)",
    textClass: "text-purple-300",
  },
};

// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────

export interface ListingItem {
  listingId: bigint;
  itemId: bigint;
  itemType: ItemType;
  seller: { toString(): string };
  price: bigint;
  isActive: boolean;
}

export interface FilterState {
  biomes: Set<string>;
  rarities: Set<number>;
  minPrice: number;
  maxPrice: number;
  search: string;
}

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

export function parseCBRPrice(input: string): bigint {
  const trimmed = input.trim().replace(",", ".");
  if (!trimmed || Number.isNaN(Number(trimmed))) return BigInt(0);
  const parts = trimmed.split(".");
  const whole = BigInt(parts[0] || "0");
  const decimalsStr = (parts[1] || "").padEnd(8, "0").slice(0, 8);
  const decimals = BigInt(decimalsStr);
  return whole * BigInt(100000000) + decimals;
}

export function formatCBRDisplay(priceRaw: bigint): string {
  const n = Number(priceRaw) / 100000000;
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

export function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 6)}...${p.slice(-5)}`;
}

/**
 * Look up a mod catalog entry by modifierType string.
 * Searches regular mods (IDs 1–48) first, then Keepers (ID 49).
 * Returns a unified shape with id and rarity_tier for all callers.
 */
export function getModCatalog(modifierType: string) {
  // Regular mods
  const regular = PLANNED_MODIFIER_CATALOG.find((m) => m.name === modifierType);
  if (regular) return regular;

  // Keepers — match by name (e.g. "Forest Keeper") or by region string
  // (e.g. "FOREST_VALLEY") since backend stores the region as modifierType
  const keeper = KEEPER_CATALOG.find(
    (k) =>
      k.name === modifierType ||
      k.region === modifierType ||
      k.name.toLowerCase() === modifierType.toLowerCase(),
  );
  if (keeper) {
    return {
      id: 49 as const,
      name: keeper.name,
      rarity_tier: 5 as const,
      asset_url: keeper.asset_url,
      region: keeper.region,
      color: keeper.color,
    };
  }

  return undefined;
}

/**
 * Look up a mod catalog entry by numeric catalog ID.
 * For ID 49 (Keeper) returns a generic Keeper entry since the specific
 * Keeper variant is not known from the ID alone.
 */
export function getCatalogById(id: number) {
  if (id === 49) {
    // Generic Keeper entry — used when only the ID is available (e.g. SellerModal)
    return {
      id: 49 as const,
      name: "KEEPER",
      rarity_tier: 5 as const,
      asset_url: KEEPER_CATALOG[0]?.asset_url ?? "",
    };
  }
  return PLANNED_MODIFIER_CATALOG.find((m) => m.id === id);
}

export function getBiomeColor(biome: string): string {
  return BIOME_COLORS[biome] ?? "#00ffcc";
}

export function getRarityMeta(tier: number | bigint) {
  const t = Number(tier);
  return RARITY_META[t] ?? RARITY_META[1];
}

export function getBiomeLandImage(biome: string): string {
  const map: Record<string, string> = {
    FOREST_VALLEY: "/assets/uploads/land_forest_valley.webp",
    ISLAND_ARCHIPELAGO: "/assets/uploads/land_island_archipelago.webp",
    SNOW_PEAK: "/assets/uploads/land_snow_peak.webp",
    DESERT_DUNE: "/assets/uploads/land_desert_dune.webp",
    VOLCANIC_CRAG: "/assets/uploads/land_volcanic_crag.webp",
    MYTHIC_VOID: "/assets/uploads/land_mythic_void.webp",
    MYTHIC_AETHER: "/assets/uploads/land_mythic_aether.webp",
  };
  return map[biome] ?? "/assets/uploads/land_forest_valley.webp";
}
