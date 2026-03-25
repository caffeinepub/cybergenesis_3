import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useCallback } from "react";
import {
  BIOME_COLORS,
  BIOME_DISPLAY,
  BIOME_KEYS,
  type FilterState,
  RARITY_META,
} from "./MarketplaceTypes";

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

export function FilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: FilterDrawerProps) {
  const toggleBiome = useCallback(
    (biome: string) => {
      const next = new Set(filters.biomes);
      if (next.has(biome)) next.delete(biome);
      else next.add(biome);
      onFiltersChange({ ...filters, biomes: next });
    },
    [filters, onFiltersChange],
  );

  const toggleRarity = useCallback(
    (r: number) => {
      const next = new Set(filters.rarities);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      onFiltersChange({ ...filters, rarities: next });
    },
    [filters, onFiltersChange],
  );

  const resetAll = useCallback(() => {
    onFiltersChange({
      biomes: new Set(),
      rarities: new Set(),
      minPrice: 0,
      maxPrice: 10000,
      search: "",
    });
  }, [onFiltersChange]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 border-r border-white/10"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,0,28,0.97) 0%, rgba(20,0,50,0.95) 100%)",
          backdropFilter: "blur(20px)",
        }}
        data-ocid="marketplace.sheet"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="font-orbitron text-white font-bold text-sm tracking-widest">
              FILTERS
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAll}
                className="font-jetbrains text-xs text-white/40 hover:text-white/70 transition-colors"
                data-ocid="marketplace.filter.button"
              >
                RESET ALL
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Biome filter */}
            <div>
              <div className="font-jetbrains text-xs text-white/30 tracking-widest mb-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                BIOME
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2">
                {BIOME_KEYS.map((biome) => {
                  const color = BIOME_COLORS[biome];
                  const checked = filters.biomes.has(biome);
                  return (
                    <label
                      key={biome}
                      htmlFor={`${biome}-check`}
                      className="flex items-center gap-3 cursor-pointer group"
                      data-ocid="marketplace.filter.checkbox"
                    >
                      <Checkbox
                        id={`${biome}-check`}
                        checked={checked}
                        onCheckedChange={() => toggleBiome(biome)}
                        className="border-white/20 data-[state=checked]:bg-transparent"
                        style={
                          checked
                            ? {
                                borderColor: color,
                                boxShadow: `0 0 8px ${color}80`,
                              }
                            : {}
                        }
                      />
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: color,
                          boxShadow: `0 0 6px ${color}`,
                        }}
                      />
                      <span className="font-jetbrains text-xs text-white/60 group-hover:text-white/90 transition-colors">
                        {BIOME_DISPLAY[biome]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rarity filter */}
            <div>
              <div className="font-jetbrains text-xs text-white/30 tracking-widest mb-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                RARITY
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-2">
                {([1, 2, 3, 4] as const).map((tier) => {
                  const meta = RARITY_META[tier];
                  const checked = filters.rarities.has(tier);
                  return (
                    <label
                      key={tier}
                      htmlFor={`rarity-${tier}`}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <Checkbox
                        id={`rarity-${tier}`}
                        checked={checked}
                        onCheckedChange={() => toggleRarity(tier)}
                        className="border-white/20"
                        style={
                          checked
                            ? {
                                borderColor: meta.color,
                                boxShadow: `0 0 8px ${meta.glow}`,
                              }
                            : {}
                        }
                      />
                      <span
                        className={`font-jetbrains text-xs ${meta.textClass} group-hover:opacity-90 transition-opacity`}
                      >
                        {meta.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price slider */}
            <div>
              <div className="font-jetbrains text-xs text-white/30 tracking-widest mb-3 flex items-center gap-2">
                <div className="flex-1 h-px bg-white/10" />
                PRICE
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-jetbrains text-xs text-white/40">
                      MIN
                    </span>
                    <span
                      className="font-jetbrains text-xs"
                      style={{ color: "#FAD26A" }}
                    >
                      {filters.minPrice} CBR
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10000}
                    step={10}
                    value={[filters.minPrice]}
                    onValueChange={([v]) =>
                      onFiltersChange({ ...filters, minPrice: v })
                    }
                    className="[&_[role=slider]]:border-yellow-400 [&_[role=slider]]:bg-yellow-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-jetbrains text-xs text-white/40">
                      MAX
                    </span>
                    <span
                      className="font-jetbrains text-xs"
                      style={{ color: "#FAD26A" }}
                    >
                      {filters.maxPrice} CBR
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={10000}
                    step={10}
                    value={[filters.maxPrice]}
                    onValueChange={([v]) =>
                      onFiltersChange({ ...filters, maxPrice: v })
                    }
                    className="[&_[role=slider]]:border-yellow-400 [&_[role=slider]]:bg-yellow-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
