import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Zap } from "lucide-react";
import type { LandData } from "../../backend.d";
import {
  BIOME_DISPLAY,
  type ListingItem,
  RARITY_META,
  getBiomeColor,
  getModCatalog,
  getRarityMeta,
  truncatePrincipal,
} from "./MarketplaceTypes";

export interface InspectorModalProps {
  open: boolean;
  onClose: () => void;
  listing: ListingItem;
  landData?: LandData;
}

export function InspectorModal({
  open,
  onClose,
  listing,
  landData,
}: InspectorModalProps) {
  const biome = landData?.biome ?? "";
  const biomeColor = getBiomeColor(biome);
  const displayBiome = BIOME_DISPLAY[biome] ?? "CYBER LAND";
  const sellerStr = listing.seller.toString();
  const mods = landData?.attachedModifications ?? [];
  const installed = mods.length;
  const free = 49 - installed;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-full p-0 border-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,0,20,0.98) 0%, rgba(15,0,40,0.97) 100%)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${biomeColor}30`,
          boxShadow: `0 0 40px ${biomeColor}20, 0 0 80px ${biomeColor}10`,
        }}
        data-ocid="marketplace.dialog"
      >
        {/* Close btn */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
          data-ocid="marketplace.close_button"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Header text */}
          <div className="mb-6">
            <h2
              className="font-orbitron font-bold text-2xl mb-1"
              style={{
                color: biome ? biomeColor : "#ffffff",
                textShadow: biome ? `0 0 16px ${biomeColor}80` : "none",
              }}
            >
              {displayBiome}
            </h2>
            <p className="font-jetbrains text-sm text-white/40 mb-0.5">
              LAND #{listing.itemId.toString()} · INSPECTOR
            </p>
            <p
              className="font-jetbrains text-xs"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              by: {truncatePrincipal(sellerStr)}
            </p>
          </div>

          {/* Grid label */}
          <p className="font-jetbrains text-xs tracking-widest text-white/25 mb-3">
            MODIFIER SLOTS (49)
          </p>

          {/* 7×7 grid */}
          <div
            className="grid gap-1.5 mb-6"
            style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {Array.from({ length: 49 }, (_, i) => {
              const mod = mods.find(
                (m) => getModCatalog(m.modifierType)?.id === i + 1,
              );
              if (mod) {
                const catalog = getModCatalog(mod.modifierType);
                const rarity = getRarityMeta(mod.rarity_tier);
                return (
                  <div
                    key={mod.modifierInstanceId.toString()}
                    className="aspect-square rounded-lg overflow-hidden relative flex items-center justify-center"
                    style={{
                      border: `1px solid ${biomeColor}50`,
                      boxShadow: `0 0 8px ${biomeColor}30`,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                    }}
                    title={mod.modifierType}
                  >
                    {catalog ? (
                      <img
                        src={catalog.asset_url}
                        alt={mod.modifierType}
                        className="w-full h-full object-cover"
                        style={{
                          filter: `drop-shadow(0 0 4px ${rarity.color})`,
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${rarity.glow}` }}
                      >
                        <Zap size={12} style={{ color: rarity.color }} />
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={String(i + 100)}
                  className="aspect-square rounded-lg flex items-center justify-center"
                  style={{
                    border: "1px dashed rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="font-jetbrains text-[9px] text-white/20">
                    #{i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom counters */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: `${biomeColor}12`,
                border: `1px solid ${biomeColor}30`,
              }}
            >
              <p
                className="font-orbitron text-3xl font-bold"
                style={{
                  color: biomeColor,
                  textShadow: `0 0 12px ${biomeColor}`,
                }}
              >
                {installed}
              </p>
              <p className="font-jetbrains text-xs text-white/40 mt-1 tracking-wider">
                INSTALLED
              </p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="font-orbitron text-3xl font-bold text-white/50">
                {free}
              </p>
              <p className="font-jetbrains text-xs text-white/30 mt-1 tracking-wider">
                FREE
              </p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="font-orbitron text-3xl font-bold text-white">49</p>
              <p className="font-jetbrains text-xs text-white/40 mt-1 tracking-wider">
                TOTAL SLOTS
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
