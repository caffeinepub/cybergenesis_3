export const BIOME_COLORS: Record<string, string> = {
  FOREST_VALLEY: "#00ff96",
  ISLAND_ARCHIPELAGO: "#00e5ff",
  SNOW_PEAK: "#a0d4ff",
  DESERT_DUNE: "#ffd060",
  VOLCANIC_CRAG: "#ff6030",
  MYTHIC_VOID: "#cc44ff",
  MYTHIC_AETHER: "#ff44cc",
};

export const getBiomeColor = (biome: string): string =>
  BIOME_COLORS[biome] ?? "#00e5ff";

export const formatCBR = (val: bigint): string =>
  (Number(val) / 100_000_000).toFixed(2);

export const formatWeight = (val: bigint): string =>
  (Number(val) / 100_000_000).toFixed(4);

export const shortenPrincipal = (p: string): string => {
  if (p.length <= 14) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
};

export const CATEGORY_LABELS: Record<string, string> = {
  treasury: "TREASURY",
  partnership: "PARTNERSHIP",
  roadmap: "ROADMAP",
};

export const CATEGORY_COLORS: Record<string, string> = {
  treasury: "#ffd060",
  partnership: "#00e5ff",
  roadmap: "#00ff96",
};
