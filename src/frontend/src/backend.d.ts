import type { Principal } from "@icp-sdk/core/principal";

export interface PublicLandInfo {
  landId: bigint;
  biome: string;
  principal: Principal;
}

export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type Time = bigint;

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface ModifierInstance {
  modifierInstanceId: bigint;
  modifierType: string;
  model_url: string;
  rarity_tier: bigint;
  multiplier_value: number;
}

export interface LandData {
  landId: bigint;
  principal: Principal;
  biome: string;
  plotName: string;
  decorationURL: string | null | [];
  coordinates: Coordinates;
  cycleCharge: bigint;
  chargeCap: bigint;
  upgradeLevel: bigint;
  baseTokenMultiplier: number;
  lastClaimTime: Time;
  lastChargeUpdate: Time;
  attachedModifications: ModifierInstance[];
}

export interface LootCache {
  cache_id: bigint;
  owner: Principal;
  tier: bigint;
  discovered_at: Time;
  is_opened: boolean;
}

export type DiscoverCacheResult =
  | { __kind__: "success"; success: LootCache }
  | { __kind__: "insufficientTokens"; insufficientTokens: { required: bigint; current: bigint } }
  | { __kind__: "paymentFailed"; paymentFailed: string }
  | { __kind__: "insufficientCharge"; insufficientCharge: { required: bigint; current: bigint } };

export type ClaimResult =
  | { __kind__: "success"; success: { tokensClaimed: bigint; newBalance: bigint; nextClaimTime: Time } }
  | { __kind__: "mintFailed"; mintFailed: string }
  | { __kind__: "cooldown"; cooldown: { currentBalance: bigint; remainingTime: bigint } }
  | { __kind__: "insufficientCharge"; insufficientCharge: { required: bigint; current: bigint } };

export type UpgradeResult =
  | { __kind__: "maxLevelReached" }
  | { __kind__: "success"; success: { newLevel: bigint; remainingTokens: bigint } }
  | { __kind__: "insufficientTokens"; insufficientTokens: { required: bigint; current: bigint } };

export interface TopLandEntry {
  upgradeLevel: bigint;
  principal: Principal;
  tokenBalance: bigint;
  plotName: string;
  biome: string;
  landId: bigint;
}

export interface UserProfile {
  name: string;
}

export interface Modification {
  model_url: string;
  mod_id: bigint;
  rarity_tier: bigint;
  multiplier_value: number;
}

export interface backendInterface {
  getLandData(): Promise<LandData[]>;
  getLandDataQuery(): Promise<LandData[]>;
  getUserProfile(principal: Principal): Promise<Option<UserProfile>>;
  getCallerUserProfile(): Promise<Option<UserProfile>>;
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  getCallerUserRole(): Promise<string>;
  isCallerAdmin(): Promise<boolean>;
  initializeAccessControl(): Promise<void>;
  claimRewards(landId: bigint): Promise<ClaimResult>;
  upgradePlot(landId: bigint, cost: bigint): Promise<UpgradeResult>;
  updatePlotName(landId: bigint, name: string): Promise<void>;
  updateDecoration(landId: bigint, url: string): Promise<void>;
  applyModifier(modifierInstanceId: bigint, landId: bigint): Promise<void>;
  removeModifier(landId: bigint, modifierInstanceId: bigint): Promise<void>;
  mintLand(): Promise<unknown>;
  getTopLands(limit: bigint): Promise<TopLandEntry[]>;
  getMyModifications(): Promise<Modification[]>;
  getMyModifierInventory(): Promise<ModifierInstance[]>;
  getMyLootCaches(): Promise<LootCache[]>;
  discoverLootCache(tier: bigint): Promise<DiscoverCacheResult>;
  processCache(cacheId: bigint): Promise<ModifierInstance>;
  getTokenBalance(): Promise<bigint>;
  getCanisterTokenBalance(): Promise<bigint>;
  debugTokenBalance(): Promise<void>;
  debugCanisterBalance(): Promise<void>;
  getStakedBalance(): Promise<bigint>;
  stakeTokens(amount: bigint): Promise<unknown>;
  getAllActiveProposals(): Promise<unknown[]>;
  createProposal(args: { title: string; description: string }): Promise<bigint>;
  vote(args: { proposalId: bigint; choice: boolean }): Promise<unknown>;
  getAllLandsPublic(): Promise<PublicLandInfo[]>;
}
