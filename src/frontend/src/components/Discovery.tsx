import type {
  DiscoverCacheResult,
  LootCache,
  ModifierInstance,
} from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import { useGetLandData, useGetTokenBalance } from "@/hooks/useQueries";
import { formatTokenBalance } from "@/lib/tokenUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Gift, Loader2, Package, Sparkles, Zap } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { PLANNED_MODIFIER_CATALOG } from "../data/modifierCatalog";

function getCatalogEntry(name: string) {
  return PLANNED_MODIFIER_CATALOG.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
}

const RARITY_COLORS: Record<number, string> = {
  1: "text-gray-400",
  2: "text-blue-400",
  3: "text-purple-400",
  4: "text-yellow-400",
};

export default function Discovery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: lands, isLoading: landsLoading } = useGetLandData();
  const {
    data: tokenBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetTokenBalance();

  const [caches, setCaches] = useState<LootCache[]>([]);
  const [cachesLoading, setCachesLoading] = useState(false);
  const [discoveringTier, setDiscoveringTier] = useState<number | null>(null);
  const [processingCacheId, setProcessingCacheId] = useState<bigint | null>(
    null,
  );
  const [lootLog, setLootLog] = useState<
    Array<{
      id: string;
      name: string;
      itemType: string;
      time: string;
      assetUrl?: string;
      rarityTier?: number;
    }>
  >([]);

  const selectedLand = lands?.[0];

  React.useEffect(() => {
    if (actor) loadCaches();
  }, [actor]);

  const loadCaches = async () => {
    if (!actor) return;
    setCachesLoading(true);
    try {
      const result = await actor.getMyLootCaches();
      setCaches(result);
    } catch (error) {
      console.error("Error loading caches:", error);
    } finally {
      setCachesLoading(false);
    }
  };

  const handleDiscoverCache = async (tier: number) => {
    if (!actor || !selectedLand) {
      toast.error("Actor or land unavailable");
      return;
    }
    const tierCosts = {
      1: { cbr: BigInt(10000000000), charge: 200 },
      2: { cbr: BigInt(25000000000), charge: 500 },
      3: { cbr: BigInt(50000000000), charge: 1000 },
    };
    const cost = tierCosts[tier as keyof typeof tierCosts];
    if (!tokenBalance || tokenBalance < cost.cbr) {
      toast.error(
        `Insufficient CBR. Required: ${formatTokenBalance(cost.cbr)} CBR`,
      );
      return;
    }
    if (selectedLand.cycleCharge < cost.charge) {
      toast.error(
        `Insufficient charge. Required: ${cost.charge}, available: ${selectedLand.cycleCharge}`,
      );
      return;
    }
    setDiscoveringTier(tier);
    try {
      const result: DiscoverCacheResult = await actor.discoverLootCache(
        BigInt(tier),
      );
      if (result.__kind__ === "success") {
        toast.success(`Tier ${tier} cache discovered!`);
        await loadCaches();
        await new Promise((resolve) => setTimeout(resolve, 500));
        queryClient.invalidateQueries({ queryKey: ["landData"] });
        queryClient.invalidateQueries({ queryKey: ["tokenBalance"] });
      } else if (result.__kind__ === "insufficientCharge") {
        toast.error(
          `Insufficient charge. Required: ${result.insufficientCharge.required}, available: ${result.insufficientCharge.current}`,
        );
      } else if (result.__kind__ === "insufficientTokens") {
        toast.error(
          `Insufficient CBR. Required: ${formatTokenBalance(result.insufficientTokens.required)} CBR`,
        );
      } else if (result.__kind__ === "paymentFailed") {
        toast.error(`Payment error: ${result.paymentFailed}`);
      }
    } catch (error: any) {
      toast.error(`Cache discovery error: ${error.message || "Unknown error"}`);
    } finally {
      setDiscoveringTier(null);
    }
  };

  const handleProcessCache = async (cacheId: bigint) => {
    if (!actor) {
      toast.error("Actor unavailable");
      return;
    }
    setProcessingCacheId(cacheId);
    try {
      const result: ModifierInstance = await actor.processCache(cacheId);
      toast.success(
        `Modifier received: ${result.modifierType} (Level ${result.rarity_tier})`,
      );

      const cat = getCatalogEntry(result.modifierType);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      setLootLog((prev) => [
        {
          id: Date.now().toString(),
          name: cat?.name ?? result.modifierType,
          itemType: "Modifier",
          time: timeStr,
          assetUrl: cat?.asset_url,
          rarityTier: cat?.rarity_tier ?? Number(result.rarity_tier),
        },
        ...prev,
      ]);

      await loadCaches();
      queryClient.invalidateQueries({ queryKey: ["modifierInventory"] });
    } catch (error: any) {
      toast.error(
        `Cache processing error: ${error.message || "Unknown error"}`,
      );
    } finally {
      setProcessingCacheId(null);
    }
  };

  const getTierConfig = (tier: number) => {
    switch (tier) {
      case 1:
        return {
          name: "COMMON CACHE",
          color: "text-[#00ffff]",
          glow: "box-glow-cyan",
          borderColor: "border-[#00ffff]/30",
        };
      case 2:
        return {
          name: "RARE CACHE",
          color: "text-blue-400",
          glow: "box-glow-cyan",
          borderColor: "border-blue-400/30",
        };
      case 3:
        return {
          name: "LEGENDARY CACHE",
          color: "text-[#9933ff]",
          glow: "box-glow-purple",
          borderColor: "border-[#9933ff]/30",
        };
      default:
        return {
          name: "CACHE",
          color: "text-white",
          glow: "",
          borderColor: "border-white/30",
        };
    }
  };

  const getTierName = (tier: number) => {
    switch (tier) {
      case 1:
        return "Common";
      case 2:
        return "Rare";
      case 3:
        return "Legendary";
      default:
        return "Unknown";
    }
  };

  const canOpenCache = (cache: LootCache) => {
    const fourHours = 4 * 60 * 60 * 1000000000;
    const timeSinceDiscovery =
      Date.now() * 1000000 - Number(cache.discovered_at);
    return timeSinceDiscovery >= fourHours;
  };

  const getTimeRemaining = (cache: LootCache) => {
    const fourHours = 4 * 60 * 60 * 1000000000;
    const timeSinceDiscovery =
      Date.now() * 1000000 - Number(cache.discovered_at);
    const remaining = fourHours - timeSinceDiscovery;
    if (remaining <= 0) return "Ready to open";
    const hours = Math.floor(remaining / (60 * 60 * 1000000000));
    const minutes = Math.floor(
      (remaining % (60 * 60 * 1000000000)) / (60 * 1000000000),
    );
    return `${hours}h ${minutes}m`;
  };

  if (landsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ff41]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CBR BALANCE */}
      <Card className="glassmorphism neon-border box-glow-green">
        <CardHeader>
          <CardTitle className="text-[#00ff41] flex items-center gap-2 font-orbitron text-glow-green">
            <Zap className="w-5 h-5" />
            CBR BALANCE
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00ff41]" />
              <span className="text-white/70 font-jetbrains">
                Loading balance...
              </span>
            </div>
          ) : balanceError ? (
            <p className="text-red-400 font-jetbrains">Balance unavailable</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-3xl font-bold text-white font-orbitron">
                {formatTokenBalance(tokenBalance || BigInt(0))} CBR
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-lg glassmorphism border border-[#00ffff]/30 text-[#00ffff] font-orbitron text-sm hover:border-[#00ffff]/60 transition-all flex-shrink-0"
                data-ocid="discovery.buy_cbr_button"
              >
                BUY CBR
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CACHE TIERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((tier) => {
          const cfg = getTierConfig(tier);
          return (
            <Card
              key={tier}
              className={`glassmorphism neon-border ${cfg.glow}`}
            >
              <CardHeader>
                <CardTitle className={`${cfg.color} font-orbitron`}>
                  {cfg.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-white/50 text-sm font-jetbrains">
                    Cost:{" "}
                    <span className="text-[#00ff41] font-bold font-jetbrains">
                      {tier === 1 ? "100" : tier === 2 ? "250" : "500"} CBR
                    </span>
                  </p>
                  <p className="text-white/50 text-sm font-jetbrains">
                    Charge:{" "}
                    <span className="text-[#00ffff] font-bold font-jetbrains">
                      {tier === 1 ? "200" : tier === 2 ? "500" : "1000"}
                    </span>
                  </p>
                  <p className="text-white/50 text-sm font-jetbrains">
                    LandToken Chance:{" "}
                    <span className="text-[#9933ff] font-bold font-jetbrains">
                      {tier === 1 ? "0.05%" : tier === 2 ? "0.2%" : "0.5%"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDiscoverCache(tier)}
                  disabled={discoveringTier !== null || !selectedLand}
                  className="w-full px-4 py-3 rounded-lg btn-gradient-green text-black font-bold font-orbitron disabled:opacity-50 disabled:cursor-not-allowed"
                  data-ocid={`discovery.discover_cache_button.${tier}`}
                >
                  {discoveringTier === tier ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                      DISCOVERING...
                    </>
                  ) : (
                    "DISCOVER CACHE"
                  )}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* LOOT HISTORY */}
      <Card className="glassmorphism neon-border box-glow-purple">
        <CardHeader>
          <CardTitle className="text-[#9933ff] flex items-center gap-2 font-orbitron text-glow-purple">
            <Sparkles className="w-5 h-5" />
            LOOT HISTORY
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lootLog.length === 0 ? (
            <p
              className="text-white/50 text-center py-4 font-jetbrains"
              data-ocid="loot_history.empty_state"
            >
              Open a cache to see your loot
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lootLog.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="glassmorphism rounded-lg p-3 border border-[#9933ff]/30 flex items-center gap-3"
                  data-ocid={`loot_history.item.${idx + 1}`}
                >
                  {entry.assetUrl ? (
                    <img
                      src={entry.assetUrl}
                      alt={entry.name}
                      className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                      style={{
                        filter: `drop-shadow(0 0 6px ${entry.rarityTier === 4 ? "rgba(250,204,21,0.6)" : entry.rarityTier === 3 ? "rgba(168,85,247,0.5)" : entry.rarityTier === 2 ? "rgba(96,165,250,0.4)" : "rgba(156,163,175,0.3)"})`,
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#9933ff]/20 border border-[#9933ff]/40 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-[#9933ff]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium font-jetbrains text-sm truncate">
                      {entry.name}
                    </p>
                    <p
                      className={`text-xs font-jetbrains ${RARITY_COLORS[entry.rarityTier ?? 1] ?? "text-gray-400"}`}
                    >
                      {entry.itemType}
                    </p>
                  </div>
                  <p className="text-white/50 text-xs font-jetbrains flex-shrink-0">
                    {entry.time}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MY CACHES */}
      <Card className="glassmorphism neon-border box-glow-cyan">
        <CardHeader>
          <CardTitle className="text-[#00ffff] flex items-center gap-2 font-orbitron text-glow-cyan">
            <Package className="w-5 h-5" />
            MY CACHES
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cachesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00ffff]" />
              <span className="text-white/70 font-jetbrains">
                Loading caches...
              </span>
            </div>
          ) : caches.length === 0 ? (
            <p
              className="text-white/50 text-center py-4 font-jetbrains"
              data-ocid="my_caches.empty_state"
            >
              No caches discovered
            </p>
          ) : (
            <div className="space-y-3">
              {caches.map((cache, idx) => {
                const tier = Number(cache.tier);
                const cfg = getTierConfig(tier);
                return (
                  <div
                    key={cache.cache_id.toString()}
                    className={`glassmorphism rounded-lg p-4 border ${cfg.borderColor}`}
                    data-ocid={`my_caches.item.${idx + 1}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium font-jetbrains">
                          {getTierName(tier)} Cache #{cache.cache_id.toString()}
                        </p>
                        <p className="text-white/50 text-sm flex items-center gap-1 font-jetbrains">
                          <Clock className="w-3 h-3" />
                          {cache.is_opened ? "Opened" : getTimeRemaining(cache)}
                        </p>
                      </div>
                      <div>
                        {cache.is_opened ? (
                          <span className="text-green-400 text-sm font-jetbrains">
                            ✓ Opened
                          </span>
                        ) : (
                          <Button
                            onClick={() => handleProcessCache(cache.cache_id)}
                            disabled={
                              !canOpenCache(cache) || processingCacheId !== null
                            }
                            size="sm"
                            className="bg-[#00ff41] hover:bg-[#00ff41]/80 text-black font-bold font-orbitron"
                            data-ocid={`my_caches.open_button.${idx + 1}`}
                          >
                            {processingCacheId === cache.cache_id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Opening...
                              </>
                            ) : (
                              <>
                                <Gift className="w-4 h-4 mr-2" />
                                OPEN
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
