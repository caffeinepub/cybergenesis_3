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
  getBiomeLandImage,
  getCatalogById,
  getRarityMeta,
} from "./MarketplaceTypes";

interface SellerModalProps {
  sellerPrincipal: string | null;
  allListings: ListingItem[];
  onClose: () => void;
  onListingClick: (listing: ListingItem, tab: "lands" | "mods") => void;
}

function truncatePrincipalLong(p: string): string {
  if (p.length <= 20) return p;
  return `${p.slice(0, 10)}...${p.slice(-5)}`;
}

export function SellerModal({
  sellerPrincipal,
  allListings,
  onClose,
  onListingClick,
}: SellerModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"lands" | "mods">("lands");

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

  const tabs: {
    id: "lands" | "mods";
    label: string;
    count: number;
    color: string;
    glow: string;
  }[] = [
    {
      id: "lands",
      label: "LANDS",
      count: landListings.length,
      color: "#00e5ff",
      glow: "rgba(0,229,255,0.3)",
    },
    {
      id: "mods",
      label: "MODS",
      count: modListings.length,
      color: "#cc00ff",
      glow: "rgba(204,0,255,0.3)",
    },
  ];

  return (
    <Dialog
      open={!!sellerPrincipal}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="max-w-lg border-0 p-0 overflow-hidden"
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

        <div className="px-6 py-4 space-y-4">
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

          {/* Tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 py-2 rounded-lg font-orbitron font-bold text-xs tracking-widest uppercase transition-all"
                  style={{
                    background: isActive ? `${tab.color}18` : "transparent",
                    color: isActive ? tab.color : "rgba(255,255,255,0.35)",
                    border: isActive
                      ? `1px solid ${tab.color}40`
                      : "1px solid transparent",
                    boxShadow: isActive ? `0 0 12px ${tab.glow}` : "none",
                    textShadow: isActive ? `0 0 8px ${tab.glow}` : "none",
                  }}
                  data-ocid={`seller.${tab.id}.tab`}
                >
                  {tab.label}
                  <span
                    className="ml-1.5 font-jetbrains text-[10px] normal-case tracking-normal"
                    style={{ opacity: 0.5 }}
                  >
                    ({tab.count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "288px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,255,200,0.3) transparent",
            }}
          >
            {/* LANDS TAB */}
            {activeTab === "lands" && (
              <div>
                {landListings.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <p className="font-jetbrains text-xs text-white/25 italic">
                      No lands listed
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {landListings.map((listing) => {
                      const biome = (listing as any).biome ?? "";
                      const biomeColor = getBiomeColor(biome);
                      const landImg = getBiomeLandImage(biome);
                      const biomeLabel =
                        BIOME_DISPLAY[biome] ??
                        biome ??
                        `Land #${listing.itemId}`;
                      return (
                        <button
                          type="button"
                          key={listing.listingId.toString()}
                          onClick={() => {
                            onListingClick(listing, "lands");
                            onClose();
                          }}
                          className="flex flex-col rounded-xl overflow-hidden transition-all hover:scale-[1.03] text-left"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${biomeColor}35`,
                            boxShadow: `0 0 10px ${biomeColor}10`,
                          }}
                          data-ocid="seller.lands.item"
                        >
                          <div
                            className="w-full flex items-center justify-center"
                            style={{
                              height: "80px",
                              background: "rgba(0,0,0,0.3)",
                            }}
                          >
                            <img
                              src={landImg}
                              alt={biomeLabel}
                              className="w-full h-full object-contain"
                              style={{ background: "transparent" }}
                            />
                          </div>
                          <div className="px-3 py-2">
                            <p
                              className="font-orbitron font-bold text-[10px] uppercase tracking-wider truncate"
                              style={{
                                color: biomeColor,
                                textShadow: `0 0 6px ${biomeColor}60`,
                              }}
                            >
                              {biomeLabel}
                            </p>
                            <p
                              className="font-jetbrains text-xs font-bold mt-0.5"
                              style={{ color: "#FAD26A" }}
                            >
                              {formatCBRDisplay(listing.price)} CBR
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MODS TAB */}
            {activeTab === "mods" && (
              <div>
                {modListings.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <p className="font-jetbrains text-xs text-white/25 italic">
                      No mods listed
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {modListings.map((listing) => {
                      const catalog = getCatalogById(Number(listing.itemId));
                      const rarity = getRarityMeta(catalog?.rarity_tier ?? 1);
                      const modName = catalog?.name ?? `MOD #${listing.itemId}`;
                      const modImg = catalog?.asset_url;
                      return (
                        <button
                          type="button"
                          key={listing.listingId.toString()}
                          onClick={() => {
                            onListingClick(listing, "mods");
                            onClose();
                          }}
                          className="flex flex-col rounded-xl overflow-hidden transition-all hover:scale-[1.03] text-left"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${rarity.color}35`,
                            boxShadow: `0 0 8px ${rarity.color}10`,
                          }}
                          data-ocid="seller.mods.item"
                        >
                          <div
                            className="w-full flex items-center justify-center"
                            style={{
                              height: "64px",
                              background: "rgba(0,0,0,0.3)",
                            }}
                          >
                            {modImg ? (
                              <img
                                src={modImg}
                                alt={modName}
                                className="w-full h-full object-contain"
                                style={{ background: "transparent" }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{
                                  background: `${rarity.color}20`,
                                  border: `1px solid ${rarity.color}40`,
                                }}
                              >
                                <span
                                  className="font-orbitron text-[8px]"
                                  style={{ color: rarity.color }}
                                >
                                  MOD
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="px-2 py-1.5">
                            <span
                              className="font-jetbrains text-[8px] font-bold px-1 py-0.5 rounded"
                              style={{
                                background: `${rarity.color}18`,
                                border: `1px solid ${rarity.color}35`,
                                color: rarity.color,
                              }}
                            >
                              {rarity.label}
                            </span>
                            <p className="font-jetbrains text-[9px] text-white/60 mt-0.5 truncate">
                              {modName}
                            </p>
                            <p
                              className="font-orbitron text-[9px] font-bold"
                              style={{ color: "#FAD26A" }}
                            >
                              {formatCBRDisplay(listing.price)} CBR
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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
