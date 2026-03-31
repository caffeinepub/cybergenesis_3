// Cache system types - added for Stage 3 openCache / inventory system

export type CrystalKind =
  | { __kind__: "Burnite" }
  | { __kind__: "Synthex" }
  | { __kind__: "Cryonix" };
export type CrystalTier = { __kind__: "T1" } | { __kind__: "T2" };
export interface CrystalItem {
  kind: CrystalKind;
  tier: CrystalTier;
  quantity: bigint;
}
export type BoosterKind =
  | { __kind__: "B250" }
  | { __kind__: "B500" }
  | { __kind__: "B1000" };
export interface BoosterItem {
  kind: BoosterKind;
  quantity: bigint;
}
export interface KeeperHeartItem {
  biome: string;
}
export interface CacheDropMod {
  modId: bigint;
  rarityTier: bigint;
  subtype: string;
  instanceId: bigint;
}
export type CacheDropItem =
  | { __kind__: "mod"; mod: CacheDropMod }
  | { __kind__: "crystal"; crystal: CrystalItem }
  | { __kind__: "booster"; booster: BoosterItem }
  | { __kind__: "keeperHeart"; keeperHeart: KeeperHeartItem };
export interface CacheOpenResult {
  items: CacheDropItem[];
  energySpent: bigint;
}
export interface FullInventory {
  crystals: CrystalItem[];
  boosters: BoosterItem[];
  keeperHearts: KeeperHeartItem[];
}
