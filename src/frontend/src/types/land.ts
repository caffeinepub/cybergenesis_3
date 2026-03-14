export interface LandData {
  landId: string;
  biome: string | Record<string, unknown>;
  coordinates: { x: number; y: number };
  energyLevel: number | bigint;
  level: number | bigint;
  attachedModifications?: unknown[];
}
