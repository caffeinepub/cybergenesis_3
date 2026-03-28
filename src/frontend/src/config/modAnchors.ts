/**
 * modAnchors.ts — Tier 2 anchor/beacon config for 3D mod placement
 *
 * Conventions (names match what's embedded in land GLB files):
 *   Common    → c_01 … c_15  (bokovye platformy)
 *   Rare      → r_01 … r_15  (glavnaya ploshchad)
 *   Legendary → l_01 … l_12  (verkhnie yarusy)
 *   Mythic    → m_01 … m_06  (levitaciya)
 *   Keeper    → k_01         (otdelnoe mesto)
 *
 * Mod mesh names inside mega GLBs:
 *   mega_common.glb    mod_c_01 … mod_c_15
 *   mega_rare.glb      mod_r_01 … mod_r_15
 *   mega_legendary.glb mod_l_01 … mod_l_12
 *   mega_mythic.glb    mod_m_01 … mod_m_06
 *   mega_keepers.glb   mod_k_01 … mod_k_07
 */

import {
  KEEPER_CATALOG,
  PLANNED_MODIFIER_CATALOG,
} from "@/data/modifierCatalog";

// ── GLB URLs per tier ─────────────────────────────────────────────────────────
export const MOD_GLB_URLS: Record<number, string> = {
  1: "https://raw.githubusercontent.com/dobr312/cyberland/main/public/models/mega_common.glb",
  2: "https://raw.githubusercontent.com/dobr312/cyberland/main/public/models/mega_rare.glb",
  3: "https://raw.githubusercontent.com/dobr312/cyberland/main/public/models/mega_legendary.glb",
  4: "https://raw.githubusercontent.com/dobr312/cyberland/main/public/models/mega_mythic.glb",
  5: "https://raw.githubusercontent.com/dobr312/cyberland/main/public/models/mega_keepers.glb",
};

// ── Anchor pools per tier (names as used in land GLB scene) ───────────────────
export const TIER_ANCHOR_POOLS: Record<number, string[]> = {
  1: Array.from(
    { length: 15 },
    (_, i) => `c_${String(i + 1).padStart(2, "0")}`,
  ),
  2: Array.from(
    { length: 15 },
    (_, i) => `r_${String(i + 1).padStart(2, "0")}`,
  ),
  3: Array.from(
    { length: 12 },
    (_, i) => `l_${String(i + 1).padStart(2, "0")}`,
  ),
  4: Array.from({ length: 6 }, (_, i) => `m_${String(i + 1).padStart(2, "0")}`),
  5: ["k_01"],
};

// Keeper region → index in mega_keepers.glb (mod_k_01 … mod_k_07)
const KEEPER_REGION_ORDER = [
  "FOREST_VALLEY",
  "ISLAND_ARCHIPELAGO",
  "SNOW_PEAK",
  "DESERT_DUNE",
  "VOLCANIC_CRAG",
  "MYTHIC_VOID",
  "MYTHIC_AETHER",
];

// ── Catalog entry lookup ───────────────────────────────────────────────────────
export interface ModCatalogEntry {
  id: number;
  tier: number;
  name: string;
  /** Populated only for Keepers */
  region?: string;
}

/**
 * Look up mod by modifierType string (can be a mod name like "RuBaRu"
 * or a keeper name/region like "Forest Keeper" / "FOREST_VALLEY").
 */
export function lookupCatalogEntry(
  modifierType: string,
): ModCatalogEntry | null {
  // Regular mods — search by name
  const plain = PLANNED_MODIFIER_CATALOG.find(
    (c) => c.name.toLowerCase() === modifierType.toLowerCase(),
  );
  if (plain) {
    return { id: plain.id, tier: plain.rarity_tier, name: plain.name };
  }

  // Keepers — search by name or region
  const keeper = KEEPER_CATALOG.find(
    (k) =>
      k.region === modifierType ||
      k.name.toLowerCase() === modifierType.toLowerCase(),
  );
  if (keeper) {
    return { id: 49, tier: 5, name: keeper.name, region: keeper.region };
  }

  return null;
}

// ── Mesh name inside mega GLB ──────────────────────────────────────────────────
/**
 * Returns the named node inside the tier's mega GLB for a given catalog ID.
 * For keepers, pass keeperRegion so the correct variant is selected.
 */
export function getMeshName(catalogId: number, keeperRegion?: string): string {
  if (catalogId >= 1 && catalogId <= 15) {
    return `mod_c_${String(catalogId).padStart(2, "0")}`;
  }
  if (catalogId >= 16 && catalogId <= 30) {
    return `mod_r_${String(catalogId - 15).padStart(2, "0")}`;
  }
  if (catalogId >= 31 && catalogId <= 42) {
    return `mod_l_${String(catalogId - 30).padStart(2, "0")}`;
  }
  if (catalogId >= 43 && catalogId <= 48) {
    return `mod_m_${String(catalogId - 42).padStart(2, "0")}`;
  }
  if (catalogId === 49 && keeperRegion) {
    const idx = KEEPER_REGION_ORDER.indexOf(keeperRegion);
    return `mod_k_${String(Math.max(idx, 0) + 1).padStart(2, "0")}`;
  }
  return "";
}

// ── Deterministic anchor assignment ───────────────────────────────────────────
/** Seeded Fisher-Yates shuffle — stable for same (landId, tier) pair */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  // Keep seed positive and bounded
  let s = ((seed % 0x7fffff) + 0x7fffff) % 0x7fffff;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Assign each mod instance a deterministic anchor from its tier pool.
 * Stable per (landId + tier) — mods always appear at the same positions
 * on the same land, regardless of install/remove order.
 *
 * Returns Map<instanceId.toString(), anchorName>
 */
export function assignAnchors(
  mods: Array<{ modifierInstanceId: bigint }>,
  tier: number,
  landId: bigint,
): Map<string, string> {
  const result = new Map<string, string>();
  const pool = TIER_ANCHOR_POOLS[tier] ?? [];
  if (pool.length === 0) return result;

  const seed = Number(landId % BigInt(999983)) * 31 + tier * 7;
  const shuffled = seededShuffle(pool, seed);

  mods.forEach((mod, idx) => {
    if (idx < shuffled.length) {
      result.set(mod.modifierInstanceId.toString(), shuffled[idx]);
    }
  });

  return result;
}
