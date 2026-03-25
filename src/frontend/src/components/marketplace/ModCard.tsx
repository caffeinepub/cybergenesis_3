import { Loader2, User, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  type ListingItem,
  formatCBRDisplay,
  getCatalogById,
  getRarityMeta,
} from "./MarketplaceTypes";

export interface ModCardProps {
  listing: ListingItem;
  isMyListing: boolean;
  onBuy: () => void;
  onCancel: () => void;
  isBuying: boolean;
  isCancelling: boolean;
}

export function ModCard({
  listing,
  isMyListing,
  onBuy,
  onCancel,
  isBuying,
  isCancelling,
}: ModCardProps) {
  // Try lookup by item ID as catalog ID
  const catalogEntry = getCatalogById(Number(listing.itemId));
  const rarity = getRarityMeta(catalogEntry?.rarity_tier ?? 1);
  const modName = catalogEntry?.name ?? `MOD #${listing.itemId}`;
  const imgUrl = catalogEntry?.asset_url;
  const sellerStr = listing.seller.toString();

  return (
    <div
      className="rounded-xl overflow-hidden relative transition-all duration-300 hover:scale-[1.02]"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,3,30,0.9) 0%, rgba(5,0,20,0.95) 100%)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${rarity.color}30`,
        boxShadow: `0 0 16px ${rarity.glow}`,
      }}
      data-ocid="marketplace.card"
    >
      {/* Seller avatar top-right */}
      <button
        type="button"
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          toast.info(`Seller: ${sellerStr}`, { duration: 5000 });
        }}
        data-ocid="marketplace.secondary_button"
      >
        <User size={12} className="text-white/50" />
      </button>

      {/* Mod image with glow cloud */}
      <div className="relative flex items-center justify-center p-5 pb-2">
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: rarity.glow, opacity: 0.35 }}
        />
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={modName}
            className="w-20 h-20 object-contain relative z-10"
            style={{ filter: `drop-shadow(0 0 10px ${rarity.color})` }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
            style={{
              background: `${rarity.glow}`,
              boxShadow: `0 0 20px ${rarity.glow}`,
            }}
          >
            <Zap size={28} style={{ color: rarity.color }} />
          </div>
        )}
      </div>

      {/* Mod info */}
      <div className="px-3 pb-3">
        <p className="font-orbitron font-bold text-sm text-white text-center leading-tight mb-1">
          {modName}
        </p>
        <div className="flex items-center justify-center mb-2">
          <span
            className={`font-jetbrains text-xs font-bold ${rarity.textClass} px-2 py-0.5 rounded-full`}
            style={{
              background: `${rarity.glow}`,
              border: `1px solid ${rarity.color}50`,
            }}
          >
            {rarity.label}
          </span>
        </div>
        <p className="font-jetbrains text-xs text-white/25 text-center mb-3">
          ID: {listing.itemId.toString()}
        </p>

        {/* Price + action */}
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-0.5">
            <span
              className="font-orbitron font-bold text-xl"
              style={{
                color: "#FAD26A",
                textShadow: "0 0 8px rgba(250,210,106,0.5)",
              }}
            >
              {formatCBRDisplay(listing.price)}
            </span>
            <span className="font-jetbrains text-xs text-white/30 mb-0.5 ml-0.5">
              CBR
            </span>
          </div>

          {isMyListing ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="px-3 py-1.5 rounded-lg font-orbitron text-[10px] font-bold transition-all disabled:opacity-50"
              style={{
                background: "rgba(220,38,38,0.15)",
                border: "1px solid rgba(220,38,38,0.4)",
                color: "#f87171",
              }}
              data-ocid="marketplace.cancel_button"
            >
              {isCancelling ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                "CANCEL"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onBuy}
              disabled={isBuying}
              className="px-3 py-1.5 rounded-lg font-orbitron text-[10px] font-bold transition-all disabled:opacity-50"
              style={{
                background: `${rarity.glow}`,
                border: `1px solid ${rarity.color}60`,
                color: rarity.color,
                boxShadow: isBuying ? "none" : `0 0 8px ${rarity.glow}`,
              }}
              data-ocid="marketplace.primary_button"
            >
              {isBuying ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                "BUY"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
