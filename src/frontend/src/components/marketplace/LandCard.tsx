import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ShoppingCart,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { LandData } from "../../backend.d";
import {
  BIOME_DISPLAY,
  type ListingItem,
  formatCBRDisplay,
  getBiomeColor,
  getModCatalog,
  getRarityMeta,
} from "./MarketplaceTypes";

export interface LandCardProps {
  listing: ListingItem;
  landData?: LandData;
  isMyListing: boolean;
  onBuy: () => void;
  onCancel: () => void;
  onInspect: () => void;
  isBuying: boolean;
  isCancelling: boolean;
}

export function LandCard({
  listing,
  landData,
  isMyListing,
  onBuy,
  onCancel,
  onInspect,
  isBuying,
  isCancelling,
}: LandCardProps) {
  const [modsExpanded, setModsExpanded] = useState(false);
  const biome = landData?.biome ?? "";
  const biomeColor = getBiomeColor(biome);
  const displayBiome = BIOME_DISPLAY[biome] ?? "CYBER LAND";
  const mods = landData?.attachedModifications ?? [];
  const modCount = mods.length;
  const visibleMods = mods.slice(0, 7);
  const extraCount = modCount > 7 ? modCount - 7 : 0;
  const sellerStr = listing.seller.toString();

  return (
    <article
      className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${biomeColor}40`,
        boxShadow: `0 0 20px ${biomeColor}15, 0 4px 24px rgba(0,0,0,0.6)`,
      }}
      onClick={onInspect}
      onKeyDown={(e) => e.key === "Enter" && onInspect()}
      data-ocid="marketplace.card"
    >
      {/* Card top: biome name + land ID + seller avatar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h3
            className="font-orbitron font-bold text-lg leading-tight"
            style={{
              color: biomeColor,
              textShadow: `0 0 12px ${biomeColor}80`,
            }}
          >
            {displayBiome}
          </h3>
          <p
            className="font-jetbrains text-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            LAND #{listing.itemId.toString()}
          </p>
        </div>
        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          onClick={(e) => {
            e.stopPropagation();
            toast.info(`Seller: ${sellerStr}`, { duration: 5000 });
          }}
          title="Seller info"
          data-ocid="marketplace.secondary_button"
        >
          <User size={14} className="text-white/50" />
        </button>
      </div>

      {/* Hero image with smoke glow */}
      <div
        className="relative mx-4 rounded-xl overflow-hidden"
        style={{ height: "160px" }}
      >
        {/* Smoke pulse behind image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(ellipse at 50% 80%, ${biomeColor}50 0%, transparent 65%)`,
            animation: "landSmoke 3s ease-in-out infinite",
          }}
        />
        <img
          src="/assets/uploads/IMG_0577-1.webp"
          alt={displayBiome}
          className="w-full h-full object-contain relative z-10"
          style={{ mixBlendMode: "lighten" }}
        />
        {/* Edge glow overlay */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent 50%, ${biomeColor}30 100%)`,
          }}
        />
      </div>

      {/* MODS count pill */}
      <div className="flex items-center px-4 mt-3">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-jetbrains text-xs"
          style={{
            border: `1px solid ${biomeColor}60`,
            background: `${biomeColor}12`,
          }}
        >
          <span
            className="font-orbitron font-bold text-sm"
            style={{ color: biomeColor }}
          >
            {modCount}
          </span>
          <span className="text-white/40">/ 49 MODS</span>
        </div>
      </div>

      {/* Price + buy/cancel */}
      <div
        className="flex items-center justify-between px-4 mt-3"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-end gap-1">
          <span
            className="font-orbitron font-bold text-3xl"
            style={{
              color: "#FAD26A",
              textShadow: "0 0 12px rgba(250,210,106,0.6)",
            }}
          >
            {formatCBRDisplay(listing.price)}
          </span>
          <span className="font-jetbrains text-sm text-white/40 mb-1 ml-1">
            CBR
          </span>
        </div>

        {isMyListing ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.5)",
              color: "#f87171",
              boxShadow: isCancelling ? "none" : "0 0 10px rgba(220,38,38,0.3)",
            }}
            data-ocid="marketplace.cancel_button"
          >
            {isCancelling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <X size={14} />
            )}
            CANCEL
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            disabled={isBuying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background: `${biomeColor}20`,
              border: `1px solid ${biomeColor}70`,
              color: biomeColor,
              boxShadow: isBuying ? "none" : `0 0 12px ${biomeColor}40`,
            }}
            data-ocid="marketplace.primary_button"
          >
            {isBuying ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShoppingCart size={14} />
            )}
            BUY
          </button>
        )}
      </div>

      {/* Installed mods slider */}
      {modCount > 0 && (
        <div
          className="px-4 pb-4 mt-3"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 overflow-hidden">
            {/* first 7 mods */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar flex-nowrap">
              {visibleMods.map((mod, _idx) => {
                const catalog = getModCatalog(mod.modifierType);
                const rarity = getRarityMeta(mod.rarity_tier);
                return (
                  <div
                    key={mod.modifierInstanceId.toString()}
                    className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${rarity.color}40`,
                      boxShadow: `0 0 6px ${rarity.glow}`,
                    }}
                    title={mod.modifierType}
                  >
                    {catalog ? (
                      <img
                        src={catalog.asset_url}
                        alt={mod.modifierType}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Zap size={10} style={{ color: rarity.color }} />
                    )}
                  </div>
                );
              })}
            </div>
            {extraCount > 0 && (
              <button
                type="button"
                className="flex-shrink-0 w-8 h-8 rounded-lg font-jetbrains text-[10px] font-bold flex items-center justify-center transition-all"
                style={{
                  background: `${biomeColor}15`,
                  border: `1px solid ${biomeColor}40`,
                  color: biomeColor,
                }}
                onClick={() => setModsExpanded((v) => !v)}
                data-ocid="marketplace.toggle"
              >
                +{extraCount}
              </button>
            )}
          </div>

          {/* Accordion expand */}
          <AnimatePresence>
            {modsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mt-2"
              >
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
                >
                  {mods.map((mod) => {
                    const catalog = getModCatalog(mod.modifierType);
                    const rarity = getRarityMeta(mod.rarity_tier);
                    return (
                      <div
                        key={mod.modifierInstanceId.toString()}
                        className="aspect-square rounded-lg overflow-hidden flex items-center justify-center"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${rarity.color}30`,
                        }}
                        title={mod.modifierType}
                      >
                        {catalog ? (
                          <img
                            src={catalog.asset_url}
                            alt={mod.modifierType}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Zap size={8} style={{ color: rarity.color }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-2 flex items-center gap-1 font-jetbrains text-xs text-white/30 hover:text-white/60"
                  onClick={() => setModsExpanded(false)}
                >
                  <ChevronUp size={12} /> Collapse
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {!modsExpanded && extraCount > 0 && (
            <button
              type="button"
              className="mt-1 flex items-center gap-1 font-jetbrains text-xs text-white/30 hover:text-white/60"
              onClick={() => setModsExpanded(true)}
              data-ocid="marketplace.toggle"
            >
              <ChevronDown size={12} /> Show all {modCount} mods
            </button>
          )}
        </div>
      )}
      {modCount === 0 && <div className="pb-4" />}
    </article>
  );
}
