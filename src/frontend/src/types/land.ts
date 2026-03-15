import type { Principal } from "@icp-sdk/core/principal";

export interface LandData {
  landId: bigint;
  principal: Principal;
  biome: string;
  plotName: string;
  decorationURL: string | null | [];
  coordinates: { lat: number; lon: number };
  cycleCharge: bigint;
  chargeCap: bigint;
  upgradeLevel: bigint;
  baseTokenMultiplier: number;
  lastClaimTime: bigint;
  lastChargeUpdate: bigint;
  attachedModifications: unknown[];
}
