export interface PlannedModifier {
  id: string;
  name: string;
  rarity_tier: number;
  asset_url: string;
  description?: string;
}

export const PLANNED_MODIFIER_CATALOG: PlannedModifier[] = [
  {
    id: "MOD-001",
    name: "Quantum Core",
    rarity_tier: 4,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=quantum&backgroundColor=00ffff",
  },
  {
    id: "MOD-002",
    name: "Neon Shield",
    rarity_tier: 3,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=neon&backgroundColor=9933ff",
  },
  {
    id: "MOD-003",
    name: "Cyber Boost",
    rarity_tier: 2,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=cyber&backgroundColor=0099ff",
  },
  {
    id: "MOD-004",
    name: "Energy Cell",
    rarity_tier: 1,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=energy&backgroundColor=666666",
  },
  {
    id: "MOD-005",
    name: "Void Reactor",
    rarity_tier: 4,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=void&backgroundColor=6600cc",
  },
  {
    id: "MOD-006",
    name: "Plasma Drive",
    rarity_tier: 3,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=plasma&backgroundColor=ff00ff",
  },
  {
    id: "MOD-007",
    name: "Data Chip",
    rarity_tier: 1,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=data&backgroundColor=444444",
  },
  {
    id: "MOD-008",
    name: "Pulse Amplifier",
    rarity_tier: 2,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=pulse&backgroundColor=003399",
  },
  {
    id: "MOD-009",
    name: "Nebula Fragment",
    rarity_tier: 3,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=nebula&backgroundColor=330066",
  },
  {
    id: "MOD-010",
    name: "Ion Capacitor",
    rarity_tier: 1,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=ion&backgroundColor=555555",
  },
  {
    id: "MOD-011",
    name: "Singularity Node",
    rarity_tier: 4,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=singularity&backgroundColor=00cccc",
  },
  {
    id: "MOD-012",
    name: "Arc Generator",
    rarity_tier: 2,
    asset_url:
      "https://api.dicebear.com/7.x/shapes/svg?seed=arc&backgroundColor=004488",
  },
];
