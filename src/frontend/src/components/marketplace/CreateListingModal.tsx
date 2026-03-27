import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, X, Zap } from "lucide-react";
import { useState } from "react";
import type { LandData, ModifierInstance } from "../../backend.d";
import { ItemType } from "../../hooks/useQueries";
import {
  BIOME_DISPLAY,
  getBiomeColor,
  getBiomeLandImage,
  getModCatalog,
  getRarityMeta,
  parseCBRPrice,
} from "./MarketplaceTypes";

export interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  myLands: LandData[];
  myMods: ModifierInstance[];
  onList: (itemId: bigint, itemType: ItemType, price: bigint) => Promise<void>;
  isListing: boolean;
}

export function CreateListingModal({
  open,
  onClose,
  myLands,
  myMods,
  onList,
  isListing,
}: CreateListingModalProps) {
  const [activeTab, setActiveTab] = useState<"lands" | "mods">("lands");
  const [selectedLandId, setSelectedLandId] = useState<bigint | null>(null);
  const [selectedModId, setSelectedModId] = useState<bigint | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const parsedPrice = parseCBRPrice(priceInput);
  const hasSelection =
    (activeTab === "lands" && selectedLandId !== null) ||
    (activeTab === "mods" && selectedModId !== null);
  const canList = hasSelection && parsedPrice > BigInt(0);

  const handleList = async () => {
    if (!canList) return;
    const itemId = activeTab === "lands" ? selectedLandId! : selectedModId!;
    const itemType = activeTab === "lands" ? ItemType.Land : ItemType.Modifier;
    await onList(itemId, itemType, parsedPrice);
    setPriceInput("");
    setSelectedLandId(null);
    setSelectedModId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg w-full p-0 border-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,0,18,0.98) 0%, rgba(15,0,40,0.97) 100%)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,255,200,0.2)",
          boxShadow: "0 0 40px rgba(0,255,200,0.1)",
        }}
        data-ocid="marketplace.modal"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-orbitron font-bold text-xl text-white">
              LIST FOR SALE
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/70"
              style={{ background: "rgba(255,255,255,0.06)" }}
              data-ocid="marketplace.close_button"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {(["lands", "mods"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const color = tab === "lands" ? "#00ffcc" : "#cc00ff";
              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-xl font-orbitron text-xs font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: isActive
                      ? `${color}18`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isActive ? `${color}60` : "rgba(255,255,255,0.1)"}`,
                    color: isActive ? color : "rgba(255,255,255,0.4)",
                    boxShadow: isActive ? `0 0 12px ${color}30` : "none",
                  }}
                  data-ocid="marketplace.tab"
                >
                  {tab === "lands" ? "LANDS" : "MODIFIERS"}
                </button>
              );
            })}
          </div>

          {/* Inventory grid */}
          <div className="max-h-64 overflow-y-auto mb-5">
            {activeTab === "lands" ? (
              myLands.length === 0 ? (
                <p className="font-jetbrains text-xs text-white/30 text-center py-6">
                  No lands available to list
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {myLands.map((land) => {
                    const bc = getBiomeColor(land.biome);
                    const sel = selectedLandId === land.landId;
                    return (
                      <button
                        type="button"
                        key={land.landId.toString()}
                        onClick={() => setSelectedLandId(land.landId)}
                        className="rounded-xl overflow-hidden transition-all text-left"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: sel
                            ? `2px solid ${bc}`
                            : "1px solid rgba(255,255,255,0.1)",
                          boxShadow: sel ? `0 0 12px ${bc}40` : "none",
                        }}
                        data-ocid="marketplace.card"
                      >
                        <img
                          src={getBiomeLandImage(land.biome)}
                          alt={land.biome}
                          className="w-full h-20 object-contain"
                          style={{ background: "transparent" }}
                        />
                        <div className="p-2">
                          <p
                            className="font-orbitron text-xs font-bold truncate"
                            style={{ color: bc }}
                          >
                            {BIOME_DISPLAY[land.biome] ?? land.biome}
                          </p>
                          <p className="font-jetbrains text-[10px] text-white/30">
                            {land.attachedModifications.length}/49 MODS
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : myMods.length === 0 ? (
              <p className="font-jetbrains text-xs text-white/30 text-center py-6">
                No modifiers available to list
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myMods.map((mod) => {
                  const catalog = getModCatalog(mod.modifierType);
                  const rarity = getRarityMeta(mod.rarity_tier);
                  const sel = selectedModId === mod.modifierInstanceId;
                  return (
                    <button
                      type="button"
                      key={mod.modifierInstanceId.toString()}
                      onClick={() => setSelectedModId(mod.modifierInstanceId)}
                      className="rounded-xl p-2 transition-all flex flex-col items-center gap-1"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: sel
                          ? `2px solid ${rarity.color}`
                          : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: sel ? `0 0 10px ${rarity.glow}` : "none",
                      }}
                      data-ocid="marketplace.card"
                    >
                      {catalog ? (
                        <img
                          src={catalog.asset_url}
                          alt={mod.modifierType}
                          className="w-10 h-10 object-contain"
                          style={{
                            filter: `drop-shadow(0 0 4px ${rarity.color})`,
                          }}
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: rarity.glow }}
                        >
                          <Zap size={16} style={{ color: rarity.color }} />
                        </div>
                      )}
                      <p className="font-orbitron text-[9px] text-center text-white/70 leading-tight">
                        {mod.modifierType}
                      </p>
                      <span
                        className={`font-jetbrains text-[8px] font-bold ${rarity.textClass}`}
                      >
                        {rarity.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Price input */}
          <div className="mb-4">
            <label
              htmlFor="list-price-input"
              className="font-jetbrains text-xs text-white/40 mb-2 block tracking-widest"
            >
              PRICE (CBR)
            </label>
            <div className="relative">
              <Input
                id="list-price-input"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0.00"
                className="font-orbitron bg-white/5 border-white/15 focus:border-white/30 text-white placeholder:text-white/20"
                data-ocid="marketplace.input"
              />
              {priceInput && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-jetbrains text-xs text-white/30">
                  CBR
                </span>
              )}
            </div>
          </div>

          {/* List button */}
          <button
            type="button"
            onClick={handleList}
            disabled={!canList || isListing}
            className="w-full py-3 rounded-xl font-orbitron font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canList
                ? "rgba(0,255,150,0.15)"
                : "rgba(255,255,255,0.05)",
              border: canList
                ? "1px solid rgba(0,255,150,0.5)"
                : "1px solid rgba(255,255,255,0.1)",
              color: canList ? "#00ff96" : "rgba(255,255,255,0.3)",
              boxShadow: canList ? "0 0 16px rgba(0,255,150,0.25)" : "none",
              animation:
                canList && !isListing
                  ? "listBtnPulse 2s ease-in-out infinite"
                  : "none",
            }}
            data-ocid="marketplace.submit_button"
          >
            {isListing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> LISTING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap size={16} /> LIST FOR SALE
              </span>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
