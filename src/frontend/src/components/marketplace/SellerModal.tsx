import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { ItemType } from "../../hooks/useQueries";
import {
  BIOME_DISPLAY,
  type ListingItem,
  formatCBRDisplay,
  getBiomeColor,
  getCatalogById,
  getRarityMeta,
} from "./MarketplaceTypes";

interface SellerModalProps {
  sellerPrincipal: string | null;
  allListings: ListingItem[];
  onClose: () => void;
}

function truncatePrincipalLong(p: string): string {
  if (p.length <= 20) return p;
  return `${p.slice(0, 10)}...${p.slice(-5)}`;
}

export function SellerModal({
  sellerPrincipal,
  allListings,
  onClose,
}: SellerModalProps) {
  const [copied, setCopied] = useState(false);

  const sellerListings = sellerPrincipal
    ? allListings.filter((l) => l.seller.toString() === sellerPrincipal)
    : [];

  const landListings = sellerListings.filter(
    (l) => l.itemType === ItemType.Land,
  );
  const modListings = sellerListings.filter(
    (l) => l.itemType === ItemType.Modifier,
  );

  const handleCopy = () => {
    if (!sellerPrincipal) return;
    navigator.clipboard.writeText(sellerPrincipal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog
      open={!!sellerPrincipal}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="max-w-md border-0 p-0 overflow-hidden"
        style={{
          background: "rgba(5,0,20,0.97)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,255,200,0.25)",
          boxShadow: "0 0 40px rgba(0,255,200,0.1), 0 0 80px rgba(0,0,0,0.8)",
        }}
        data-ocid="seller.modal"
      >
        <DialogHeader
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid rgba(0,255,200,0.12)" }}
        >
          <DialogTitle
            className="font-orbitron font-bold text-base tracking-widest uppercase"
            style={{
              color: "#00ffc8",
              textShadow: "0 0 12px rgba(0,255,200,0.6)",
            }}
          >
            SELLER PROFILE
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Principal */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              background: "rgba(0,255,200,0.06)",
              border: "1px solid rgba(0,255,200,0.18)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-jetbrains text-[10px] text-white/30 mb-1 uppercase tracking-widest">
                Principal ID
              </p>
              <p
                className="font-jetbrains text-sm font-bold truncate"
                style={{ color: "#00ffc8" }}
                title={sellerPrincipal ?? ""}
              >
                {sellerPrincipal ? truncatePrincipalLong(sellerPrincipal) : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{
                background: copied
                  ? "rgba(0,255,200,0.15)"
                  : "rgba(255,255,255,0.06)",
                border: `1px solid ${copied ? "rgba(0,255,200,0.5)" : "rgba(255,255,255,0.12)"}`,
              }}
              title="Copy principal"
              data-ocid="seller.secondary_button"
            >
              {copied ? (
                <Check size={14} style={{ color: "#00ffc8" }} />
              ) : (
                <Copy size={14} className="text-white/50" />
              )}
            </button>
          </div>

          {/* Lands section */}
          <div>
            <h3
              className="font-orbitron font-bold text-xs tracking-widest uppercase mb-3"
              style={{ color: "#00e5ff" }}
            >
              LANDS
              <span className="ml-2 font-jetbrains text-white/30 normal-case tracking-normal">
                ({landListings.length})
              </span>
            </h3>
            {landListings.length === 0 ? (
              <p className="font-jetbrains text-xs text-white/25 italic">
                No lands listed
              </p>
            ) : (
              <div className="space-y-2">
                {landListings.map((listing) => {
                  const biomeColor = getBiomeColor("");
                  return (
                    <div
                      key={listing.listingId.toString()}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${biomeColor}20`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: biomeColor,
                            boxShadow: `0 0 6px ${biomeColor}`,
                          }}
                        />
                        <span className="font-jetbrains text-xs text-white/70">
                          Land #{listing.itemId.toString()}
                        </span>
                      </div>
                      <span
                        className="font-orbitron font-bold text-xs"
                        style={{ color: "#FAD26A" }}
                      >
                        {formatCBRDisplay(listing.price)} CBR
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mods section */}
          <div>
            <h3
              className="font-orbitron font-bold text-xs tracking-widest uppercase mb-3"
              style={{ color: "#cc00ff" }}
            >
              MODS
              <span className="ml-2 font-jetbrains text-white/30 normal-case tracking-normal">
                ({modListings.length})
              </span>
            </h3>
            {modListings.length === 0 ? (
              <p className="font-jetbrains text-xs text-white/25 italic">
                No mods listed
              </p>
            ) : (
              <div className="space-y-2">
                {modListings.map((listing) => {
                  const catalog = getCatalogById(Number(listing.itemId));
                  const rarity = getRarityMeta(catalog?.rarity_tier ?? 1);
                  const modName = catalog?.name ?? `MOD #${listing.itemId}`;
                  return (
                    <div
                      key={listing.listingId.toString()}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${rarity.color}20`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-jetbrains text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: `${rarity.glow}`,
                            border: `1px solid ${rarity.color}40`,
                            color: rarity.color,
                          }}
                        >
                          {rarity.label}
                        </span>
                        <span className="font-jetbrains text-xs text-white/70">
                          {modName}
                        </span>
                      </div>
                      <span
                        className="font-orbitron font-bold text-xs"
                        style={{ color: "#FAD26A" }}
                      >
                        {formatCBRDisplay(listing.price)} CBR
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="px-6 pb-5"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-orbitron font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/10"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.5)",
            }}
            data-ocid="seller.close_button"
          >
            CLOSE
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
