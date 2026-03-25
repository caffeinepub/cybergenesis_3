import { Filter, Loader2, Search, Store, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { LandData } from "../../backend.d";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  ItemType,
  useBuyItem,
  useCancelListing,
  useGetAllActiveListings,
  useGetLandData,
  useGetModifierInventory,
  useGetPublicLandDataBatch,
  useListItem,
} from "../../hooks/useQueries";
import { CreateListingModal } from "./CreateListingModal";
import { FilterDrawer } from "./FilterDrawer";
import { InspectorModal } from "./InspectorModal";
import { LandCard } from "./LandCard";
import {
  type FilterState,
  type ListingItem,
  formatCBRDisplay,
  getCatalogById,
} from "./MarketplaceTypes";
import { ModCard } from "./ModCard";

// ─────────────────────────────────────────────
// MARKETPLACE — MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Marketplace() {
  const { data: listings, isLoading } = useGetAllActiveListings();
  const { data: myLandArray } = useGetLandData();
  const { data: myModInventory } = useGetModifierInventory();
  const { identity } = useInternetIdentity();

  const buyItemMutation = useBuyItem();
  const listItemMutation = useListItem();
  const cancelListingMutation = useCancelListing();

  // UI state
  const [activeTab, setActiveTab] = useState<"lands" | "mods">("lands");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inspectorListing, setInspectorListing] = useState<ListingItem | null>(
    null,
  );
  const [buyingId, setBuyingId] = useState<bigint | null>(null);
  const [cancellingId, setCancellingId] = useState<bigint | null>(null);
  const [landsPage, setLandsPage] = useState(0);
  const [modsPage, setModsPage] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    biomes: new Set(),
    rarities: new Set(),
    minPrice: 0,
    maxPrice: 10000,
    search: "",
  });

  const myPrincipal = identity?.getPrincipal().toString() ?? null;
  const safeListings = (listings ?? []) as ListingItem[];
  const myLands = myLandArray ?? [];
  const myMods = myModInventory ?? [];

  // PATH B: Extract land IDs from listings to fetch live land data for all sellers
  const landListingIds = useMemo(
    () =>
      safeListings
        .filter((l) => (l.itemType as string) === "Land")
        .map((l) => l.itemId),
    [safeListings],
  );
  const { data: publicLandDataMap } = useGetPublicLandDataBatch(landListingIds);

  const isMyListing = useCallback(
    (listing: ListingItem) => {
      if (!myPrincipal) return false;
      return listing.seller.toString() === myPrincipal;
    },
    [myPrincipal],
  );

  // Split listings into lands and mods
  const landListings = useMemo(
    () => safeListings.filter((l) => l.itemType === ItemType.Land),
    [safeListings],
  );
  const modListings = useMemo(
    () => safeListings.filter((l) => l.itemType === ItemType.Modifier),
    [safeListings],
  );

  // Search + filter for lands
  const filteredLandListings = useMemo(() => {
    return landListings.filter((listing) => {
      const price = Number(listing.price) / 100000000;
      if (price < filters.minPrice || price > filters.maxPrice) return false;
      if (filters.biomes.size > 0) {
        // We don't have biome in listing, skip biome filter for now
        // (would need backend enhancement)
      }
      if (searchValue) {
        const s = searchValue.toLowerCase();
        const idStr = listing.itemId.toString();
        if (!idStr.includes(s) && !listing.seller.toString().includes(s))
          return false;
      }
      return true;
    });
  }, [landListings, filters, searchValue]);

  // Search + filter for mods
  const filteredModListings = useMemo(() => {
    return modListings.filter((listing) => {
      const price = Number(listing.price) / 100000000;
      if (price < filters.minPrice || price > filters.maxPrice) return false;
      const catalog = getCatalogById(Number(listing.itemId));
      if (filters.rarities.size > 0 && catalog) {
        if (!filters.rarities.has(catalog.rarity_tier)) return false;
      }
      if (searchValue) {
        const s = searchValue.toLowerCase();
        const name = catalog?.name.toLowerCase() ?? "";
        if (!name.includes(s) && !listing.itemId.toString().includes(s))
          return false;
      }
      return true;
    });
  }, [modListings, filters, searchValue]);

  // Pagination
  const LANDS_PER_PAGE = 7;
  const MODS_PER_PAGE = 12;

  const pagedLands = useMemo(
    () =>
      filteredLandListings.slice(
        landsPage * LANDS_PER_PAGE,
        (landsPage + 1) * LANDS_PER_PAGE,
      ),
    [filteredLandListings, landsPage],
  );
  const pagedMods = useMemo(
    () =>
      filteredModListings.slice(
        modsPage * MODS_PER_PAGE,
        (modsPage + 1) * MODS_PER_PAGE,
      ),
    [filteredModListings, modsPage],
  );

  const totalLandsPages = Math.max(
    1,
    Math.ceil(filteredLandListings.length / LANDS_PER_PAGE),
  );
  const totalModsPages = Math.max(
    1,
    Math.ceil(filteredModListings.length / MODS_PER_PAGE),
  );

  // Find land data for a listing (by landId)
  // PATH B: checks live publicLandDataMap first (covers any seller), then own lands as fallback
  const getLandDataForListing = useCallback(
    (listing: ListingItem): LandData | undefined => {
      if (publicLandDataMap) {
        const liveData = publicLandDataMap.get(listing.itemId.toString());
        if (liveData) return liveData;
      }
      return myLands.find((l) => l.landId === listing.itemId);
    },
    [myLands, publicLandDataMap],
  );

  const handleBuy = async (listing: ListingItem) => {
    setBuyingId(listing.listingId);
    try {
      const result = await buyItemMutation.mutateAsync(listing.listingId);
      if (result.__kind__ === "success") {
        toast.success("Purchase successful!", {
          description: `You paid ${formatCBRDisplay(listing.price)} CBR`,
        });
      } else if (result.__kind__ === "insufficientFunds") {
        toast.error("Insufficient CBR balance");
      } else if (result.__kind__ === "cannotBuyOwnListing") {
        toast.error("Cannot buy your own listing");
      } else if (result.__kind__ === "listingNotFound") {
        toast.error("Listing no longer available");
      } else {
        toast.error("Purchase failed");
      }
    } catch (e) {
      toast.error("Transaction failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancel = async (listing: ListingItem) => {
    setCancellingId(listing.listingId);
    try {
      await cancelListingMutation.mutateAsync(listing.listingId);
      toast.success("Listing cancelled");
    } catch (e) {
      toast.error("Failed to cancel", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleList = async (
    itemId: bigint,
    itemType: ItemType,
    price: bigint,
  ) => {
    try {
      await listItemMutation.mutateAsync({ itemId, itemType, price });
      toast.success("Item listed successfully!");
      setCreateOpen(false);
    } catch (e) {
      toast.error("Failed to list item", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,255,200,0.1)",
            border: "1px solid rgba(0,255,200,0.3)",
            boxShadow: "0 0 20px rgba(0,255,200,0.2)",
          }}
          data-ocid="marketplace.loading_state"
        >
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "#00ffc8" }}
          />
        </div>
        <p className="font-jetbrains text-sm text-white/40">
          Loading marketplace...
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Injected keyframes */}
      <style>{`
        @keyframes landSmoke {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.55; }
        }
        @keyframes listBtnPulse {
          0%, 100% { box-shadow: 0 0 16px rgba(0,255,150,0.25); }
          50% { box-shadow: 0 0 28px rgba(0,255,150,0.5), 0 0 40px rgba(0,255,150,0.2); }
        }
        @keyframes tabActivePulse {
          0%, 100% { box-shadow: 0 0 8px currentColor; }
          50% { box-shadow: 0 0 18px currentColor; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Inspector modal */}
      {inspectorListing && (
        <InspectorModal
          open={!!inspectorListing}
          onClose={() => setInspectorListing(null)}
          listing={inspectorListing}
          landData={getLandDataForListing(inspectorListing)}
        />
      )}

      {/* Create Listing Modal */}
      <CreateListingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        myLands={myLands}
        myMods={myMods}
        onList={handleList}
        isListing={listItemMutation.isPending}
      />

      {/* ─── HEADER ROW ─── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {/* Filter button */}
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(160,60,255,0.45)",
            boxShadow: filterDrawerOpen
              ? "0 0 14px rgba(160,60,255,0.5)"
              : "0 0 6px rgba(160,60,255,0.2)",
          }}
          data-ocid="marketplace.filter.button"
        >
          <Filter size={16} style={{ color: "#a040ff" }} />
        </button>

        {/* LANDS / MODS toggle */}
        {(["lands", "mods"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const color = tab === "lands" ? "#00e5ff" : "#cc00ff";
          return (
            <button
              type="button"
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setLandsPage(0);
                setModsPage(0);
              }}
              className="px-5 h-10 rounded-full font-orbitron font-bold text-xs uppercase tracking-widest transition-all"
              style={{
                backdropFilter: "blur(12px)",
                background: isActive ? `${color}15` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? `${color}70` : "rgba(255,255,255,0.12)"}`,
                color: isActive ? color : "rgba(255,255,255,0.35)",
                boxShadow: isActive
                  ? `0 0 14px ${color}45, inset 0 0 8px ${color}10`
                  : "none",
                animation: isActive
                  ? "tabActivePulse 2.5s ease-in-out infinite"
                  : "none",
              }}
              data-ocid="marketplace.tab"
            >
              {tab === "lands" ? "LANDS" : "MODS"}
            </button>
          );
        })}

        {/* Search button / input */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div
                key="search-open"
                initial={{ width: 40, opacity: 0.5 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center overflow-hidden rounded-full h-10"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <Search
                  size={14}
                  className="ml-3 flex-shrink-0 text-white/40"
                />
                <input
                  ref={searchInputRef}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search by biome or name..."
                  className="flex-1 bg-transparent font-jetbrains text-xs text-white placeholder:text-white/25 outline-none px-2"
                  style={{ minWidth: 0 }}
                  data-ocid="marketplace.search_input"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue("")}
                    className="mr-2 text-white/30 hover:text-white/60"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchValue("");
                  }}
                  className="mr-2 text-white/30 hover:text-white/60 flex-shrink-0"
                  data-ocid="marketplace.close_button"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="search-closed"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSearchOpen(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                data-ocid="marketplace.search_input"
              >
                <Search size={16} className="text-white/50" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* SELL button */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="ml-auto flex items-center gap-2 px-5 h-10 rounded-full font-orbitron font-bold text-xs uppercase tracking-widest transition-all"
          style={{
            backdropFilter: "blur(12px)",
            background: "rgba(0,255,96,0.12)",
            border: "1px solid rgba(0,255,96,0.5)",
            color: "#00ff60",
            boxShadow: "0 0 12px rgba(0,255,96,0.3)",
            animation: "listBtnPulse 2.5s ease-in-out infinite",
          }}
          data-ocid="marketplace.open_modal_button"
        >
          <span style={{ fontSize: "14px" }}>+</span> SELL
        </button>
      </div>

      {/* ─── CONTENT ─── Fix 3: both tabs always in DOM, toggled via CSS */}

      {/* Lands - always mounted */}
      <div style={{ display: activeTab === "lands" ? "block" : "none" }}>
        {filteredLandListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
            data-ocid="marketplace.empty_state"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,255,200,0.08)",
                border: "1px solid rgba(0,255,200,0.2)",
                boxShadow: "0 0 30px rgba(0,255,200,0.1)",
              }}
            >
              <Store size={36} style={{ color: "rgba(0,255,200,0.5)" }} />
            </div>
            <div className="text-center">
              <h3 className="font-orbitron font-bold text-xl text-white mb-2">
                NO LISTINGS YET
              </h3>
              <p className="font-jetbrains text-sm text-white/30 max-w-xs">
                Be the first to list a land for sale
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-orbitron font-bold text-sm uppercase tracking-widest transition-all"
              style={{
                background: "rgba(0,255,150,0.12)",
                border: "1px solid rgba(0,255,150,0.45)",
                color: "#00ff96",
                boxShadow: "0 0 16px rgba(0,255,150,0.2)",
              }}
              data-ocid="marketplace.primary_button"
            >
              <span>+</span> SELL
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {pagedLands.map((listing) => (
              <LandCard
                key={listing.listingId.toString()}
                listing={listing}
                landData={getLandDataForListing(listing)}
                isMyListing={isMyListing(listing)}
                onBuy={() => handleBuy(listing)}
                onCancel={() => handleCancel(listing)}
                onInspect={() => setInspectorListing(listing)}
                isBuying={buyingId === listing.listingId}
                isCancelling={cancellingId === listing.listingId}
              />
            ))}

            {/* Pagination lands */}
            {totalLandsPages > 1 && (
              <div
                className="flex items-center justify-center gap-2 pt-4"
                data-ocid="marketplace.pagination_next"
              >
                <button
                  type="button"
                  onClick={() => setLandsPage((p) => Math.max(0, p - 1))}
                  disabled={landsPage === 0}
                  className="w-9 h-9 rounded-full font-jetbrains text-sm flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="marketplace.pagination_prev"
                >
                  ←
                </button>
                {Array.from({ length: totalLandsPages }, (_, idx) => idx).map(
                  (pageNum) => (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setLandsPage(pageNum)}
                      className="w-9 h-9 rounded-full font-orbitron text-xs font-bold flex items-center justify-center transition-all"
                      style={{
                        background:
                          landsPage === pageNum
                            ? "rgba(0,229,255,0.15)"
                            : "rgba(255,255,255,0.04)",
                        border:
                          landsPage === pageNum
                            ? "1px solid rgba(0,229,255,0.6)"
                            : "1px solid rgba(255,255,255,0.1)",
                        color:
                          landsPage === pageNum
                            ? "#00e5ff"
                            : "rgba(255,255,255,0.4)",
                        boxShadow:
                          landsPage === pageNum
                            ? "0 0 10px rgba(0,229,255,0.3)"
                            : "none",
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setLandsPage((p) => Math.min(totalLandsPages - 1, p + 1))
                  }
                  disabled={landsPage >= totalLandsPages - 1}
                  className="w-9 h-9 rounded-full font-jetbrains text-sm flex items-center justify-center disabled:opacity-30 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="marketplace.pagination_next"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mods - always mounted */}
      <div style={{ display: activeTab === "mods" ? "block" : "none" }}>
        {filteredModListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
            data-ocid="marketplace.empty_state"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,255,200,0.08)",
                border: "1px solid rgba(0,255,200,0.2)",
                boxShadow: "0 0 30px rgba(0,255,200,0.1)",
              }}
            >
              <Store size={36} style={{ color: "rgba(0,255,200,0.5)" }} />
            </div>
            <div className="text-center">
              <h3 className="font-orbitron font-bold text-xl text-white mb-2">
                NO LISTINGS YET
              </h3>
              <p className="font-jetbrains text-sm text-white/30 max-w-xs">
                Be the first to list a modifier for sale
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-orbitron font-bold text-sm uppercase tracking-widest transition-all"
              style={{
                background: "rgba(0,255,150,0.12)",
                border: "1px solid rgba(0,255,150,0.45)",
                color: "#00ff96",
                boxShadow: "0 0 16px rgba(0,255,150,0.2)",
              }}
              data-ocid="marketplace.primary_button"
            >
              <span>+</span> SELL
            </button>
          </motion.div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4">
              {pagedMods.map((listing) => (
                <ModCard
                  key={listing.listingId.toString()}
                  listing={listing}
                  isMyListing={isMyListing(listing)}
                  onBuy={() => handleBuy(listing)}
                  onCancel={() => handleCancel(listing)}
                  isBuying={buyingId === listing.listingId}
                  isCancelling={cancellingId === listing.listingId}
                />
              ))}
            </div>

            {/* Pagination mods */}
            {totalModsPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setModsPage((p) => Math.max(0, p - 1))}
                  disabled={modsPage === 0}
                  className="w-9 h-9 rounded-full font-jetbrains text-sm flex items-center justify-center disabled:opacity-30"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="marketplace.pagination_prev"
                >
                  ←
                </button>
                {Array.from({ length: totalModsPages }, (_, idx) => idx).map(
                  (pageNum) => (
                    <button
                      type="button"
                      key={pageNum}
                      onClick={() => setModsPage(pageNum)}
                      className="w-9 h-9 rounded-full font-orbitron text-xs font-bold flex items-center justify-center transition-all"
                      style={{
                        background:
                          modsPage === pageNum
                            ? "rgba(204,0,255,0.15)"
                            : "rgba(255,255,255,0.04)",
                        border:
                          modsPage === pageNum
                            ? "1px solid rgba(204,0,255,0.6)"
                            : "1px solid rgba(255,255,255,0.1)",
                        color:
                          modsPage === pageNum
                            ? "#cc00ff"
                            : "rgba(255,255,255,0.4)",
                        boxShadow:
                          modsPage === pageNum
                            ? "0 0 10px rgba(204,0,255,0.3)"
                            : "none",
                      }}
                    >
                      {pageNum + 1}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setModsPage((p) => Math.min(totalModsPages - 1, p + 1))
                  }
                  disabled={modsPage >= totalModsPages - 1}
                  className="w-9 h-9 rounded-full font-jetbrains text-sm flex items-center justify-center disabled:opacity-30"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                  data-ocid="marketplace.pagination_next"
                >
                  →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
