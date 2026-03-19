import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Filter,
  Loader2,
  MapPin,
  Plus,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBuyItem,
  useCancelListing,
  useGetAllActiveListings,
  useGetLandData,
  useGetMyModifications,
  useListItem,
} from "../hooks/useQueries";
import { ItemType } from "../marketplace-backend.d";

export default function Marketplace() {
  const { data: listings, isLoading } = useGetAllActiveListings();
  const { data: myLandArray } = useGetLandData();
  const { data: myModifications } = useGetMyModifications();
  const { identity } = useInternetIdentity();
  const buyItemMutation = useBuyItem();
  const listItemMutation = useListItem();
  const cancelListingMutation = useCancelListing();

  const [buyingId, setBuyingId] = useState<bigint | null>(null);
  const [cancellingId, setCancellingId] = useState<bigint | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [listingType, setListingType] = useState<"land" | "modifier">("land");
  const [selectedLandId, setSelectedLandId] = useState<bigint | null>(null);
  const [selectedModId, setSelectedModId] = useState<bigint | null>(null);
  const [filterType, setFilterType] = useState<"all" | "land" | "modifier">(
    "all",
  );
  const [filterTier, setFilterTier] = useState<string>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    return listings.filter((listing) => {
      if (filterType === "land" && listing.itemType !== ItemType.Land)
        return false;
      if (filterType === "modifier" && listing.itemType !== ItemType.Modifier)
        return false;
      const price = Number(listing.price) / 100000000;
      if (minPrice && price < Number.parseFloat(minPrice)) return false;
      if (maxPrice && price > Number.parseFloat(maxPrice)) return false;
      return true;
    });
  }, [listings, filterType, minPrice, maxPrice]);

  const handleBuyItem = async (listingId: bigint, price: bigint) => {
    setBuyingId(listingId);
    try {
      const result = await buyItemMutation.mutateAsync(listingId);
      if (result.__kind__ === "success") {
        toast.success("Item purchased successfully!", {
          description: `You bought the item for ${Number(price) / 100000000} CBR tokens`,
        });
      } else if (result.__kind__ === "insufficientFunds") {
        toast.error("Insufficient funds", {
          description: `Required: ${Number(result.insufficientFunds.required) / 100000000} CBR`,
        });
      } else if (result.__kind__ === "listingNotFound") {
        toast.error("Listing not found");
      } else if (result.__kind__ === "listingNotActive") {
        toast.error("Listing is no longer active");
      } else if (result.__kind__ === "cannotBuyOwnListing") {
        toast.error("Cannot buy your own listing");
      } else if (result.__kind__ === "transferFailed") {
        toast.error("Transfer failed", {
          description: result.transferFailed,
        });
      }
    } catch (error) {
      toast.error("Failed to buy item", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setBuyingId(null);
    }
  };

  const handleCancelListing = async (listingId: bigint) => {
    setCancellingId(listingId);
    try {
      await cancelListingMutation.mutateAsync(listingId);
      toast.success("Listing cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel listing", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleListItem = async () => {
    const price = Number.parseFloat(listPrice);
    if (Number.isNaN(price) || price <= 0) {
      toast.error("Invalid price");
      return;
    }
    try {
      const priceInSmallestUnit = BigInt(Math.floor(price * 100000000));
      if (listingType === "land") {
        if (!selectedLandId) {
          toast.error("Please select a land plot to list");
          return;
        }
        await listItemMutation.mutateAsync({
          itemId: selectedLandId,
          itemType: ItemType.Land,
          price: priceInSmallestUnit,
        });
      } else {
        if (!selectedModId) {
          toast.error("Please select a modifier to list");
          return;
        }
        await listItemMutation.mutateAsync({
          itemId: selectedModId,
          itemType: ItemType.Modifier,
          price: priceInSmallestUnit,
        });
      }
      setListDialogOpen(false);
      setListPrice("");
      setSelectedLandId(null);
      setSelectedModId(null);
      toast.success("Item listed successfully!");
    } catch (error) {
      toast.error("Failed to list item", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const isMyListing = (sellerPrincipal: string): boolean => {
    if (!identity) return false;
    return sellerPrincipal === identity.getPrincipal().toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="font-jetbrains text-muted-foreground">
            Loading marketplace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="font-orbitron text-3xl font-bold text-glow-teal">
            MARKETPLACE
          </h2>
          <p className="font-jetbrains text-muted-foreground">
            Buy and sell land plots and modifiers for CBR tokens
          </p>
        </div>
        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-orbitron bg-primary hover:bg-primary/80 box-glow-teal">
              <Plus className="mr-2 h-4 w-4" />
              LIST ITEM
            </Button>
          </DialogTrigger>
          <DialogContent className="glassmorphism border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-orbitron text-xl text-glow-teal">
                List item for sale
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs
                value={listingType}
                onValueChange={(v) => setListingType(v as "land" | "modifier")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="land" className="font-orbitron">
                    Land
                  </TabsTrigger>
                  <TabsTrigger value="modifier" className="font-orbitron">
                    Modifier
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="land" className="space-y-4">
                  <div>
                    <label
                      htmlFor="select-land"
                      className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                    >
                      Select land
                    </label>
                    <Select
                      value={selectedLandId?.toString()}
                      onValueChange={(v) => setSelectedLandId(BigInt(v))}
                    >
                      <SelectTrigger id="select-land">
                        <SelectValue placeholder="Select a land plot" />
                      </SelectTrigger>
                      <SelectContent>
                        {myLandArray?.map((land) => (
                          <SelectItem
                            key={land.landId.toString()}
                            value={land.landId.toString()}
                          >
                            {land.plotName} - {land.biome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                <TabsContent value="modifier" className="space-y-4">
                  <div>
                    <label
                      htmlFor="select-modifier"
                      className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                    >
                      Select modifier
                    </label>
                    <Select
                      value={selectedModId?.toString()}
                      onValueChange={(v) => setSelectedModId(BigInt(v))}
                    >
                      <SelectTrigger id="select-modifier">
                        <SelectValue placeholder="Select modifier" />
                      </SelectTrigger>
                      <SelectContent>
                        {myModifications?.map((mod) => (
                          <SelectItem
                            key={mod.mod_id.toString()}
                            value={mod.mod_id.toString()}
                          >
                            Modifier #{mod.mod_id.toString()} - Tier{" "}
                            {mod.rarity_tier.toString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
              <div>
                <label
                  htmlFor="list-price"
                  className="font-jetbrains text-sm text-muted-foreground mb-2 block"
                >
                  Sale price (CBR)
                </label>
                <Input
                  id="list-price"
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  className="font-jetbrains"
                  min="0"
                  step="0.01"
                />
              </div>
              <Button
                onClick={handleListItem}
                disabled={listItemMutation.isPending || !listPrice}
                className="w-full font-orbitron bg-primary hover:bg-primary/80 box-glow-teal"
              >
                {listItemMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    LIST ITEM
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glassmorphism border-primary/20">
        <CardHeader>
          <CardTitle className="font-orbitron text-lg text-glow-teal flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="filter-type"
                className="font-jetbrains text-sm text-muted-foreground mb-2 block"
              >
                Item type
              </label>
              <Select
                value={filterType}
                onValueChange={(v) =>
                  setFilterType(v as "all" | "land" | "modifier")
                }
              >
                <SelectTrigger id="filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="land">Land only</SelectItem>
                  <SelectItem value="modifier">Modifiers only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="filter-tier"
                className="font-jetbrains text-sm text-muted-foreground mb-2 block"
              >
                Rarity tier
              </label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger id="filter-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers</SelectItem>
                  <SelectItem value="1">Tier 1 (Common)</SelectItem>
                  <SelectItem value="2">Tier 2 (Rare)</SelectItem>
                  <SelectItem value="3">Tier 3 (Legendary)</SelectItem>
                  <SelectItem value="4">Tier 4 (Mythic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="filter-min-price"
                className="font-jetbrains text-sm text-muted-foreground mb-2 block"
              >
                Min price (CBR)
              </label>
              <Input
                id="filter-min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0.00"
                className="font-jetbrains"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label
                htmlFor="filter-max-price"
                className="font-jetbrains text-sm text-muted-foreground mb-2 block"
              >
                Max price (CBR)
              </label>
              <Input
                id="filter-max-price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="0.00"
                className="font-jetbrains"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!filteredListings || filteredListings.length === 0 ? (
        <Card className="glassmorphism border-primary/20">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-orbitron text-xl text-glow-teal mb-2">
                  No listings available
                </h3>
                <p className="font-jetbrains text-muted-foreground">
                  {filterType !== "all" ||
                  filterTier !== "all" ||
                  minPrice ||
                  maxPrice
                    ? "No items match your filters"
                    : "Be the first to list an item for sale"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const isOwner = isMyListing(listing.seller.toString());
            const isLand = listing.itemType === ItemType.Land;
            return (
              <Card
                key={listing.listingId.toString()}
                className={`glassmorphism border-primary/20 hover:border-primary/40 transition-all duration-300 ${isOwner ? "ring-2 ring-secondary/50 box-glow-magenta" : "box-glow-teal"}`}
              >
                <CardHeader>
                  <CardTitle className="font-orbitron text-lg text-glow-teal flex items-center gap-2">
                    {isLand ? (
                      <>
                        <MapPin className="h-5 w-5" />
                        Land #{Number(listing.itemId)}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Modifier #{Number(listing.itemId)}
                      </>
                    )}
                    {isOwner && (
                      <span className="ml-auto text-xs text-secondary font-jetbrains">
                        YOUR LISTING
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 font-jetbrains text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Type:</span>
                      <span className={isLand ? "text-primary" : "text-accent"}>
                        {isLand ? "Land NFT" : "Modifier"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Seller:</span>
                      <span className="text-primary font-mono text-xs">
                        {listing.seller.toString().slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="text-xl font-bold text-glow-yellow">
                        {Number(listing.price) / 100000000} CBR
                      </span>
                    </div>
                  </div>
                  {isOwner ? (
                    <Button
                      onClick={() => handleCancelListing(listing.listingId)}
                      disabled={cancellingId === listing.listingId}
                      variant="destructive"
                      className="w-full font-orbitron"
                    >
                      {cancellingId === listing.listingId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          CANCEL LISTING
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        handleBuyItem(listing.listingId, listing.price)
                      }
                      disabled={buyingId === listing.listingId}
                      className="w-full font-orbitron bg-primary hover:bg-primary/80 box-glow-teal"
                    >
                      {buyingId === listing.listingId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buying...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          BUY ITEM
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
