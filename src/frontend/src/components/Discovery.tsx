import type { DiscoverCacheResult, LootCache } from "@/backend";
import type { CacheOpenResult } from "@/cacheTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import { useGetLandData, useGetTokenBalance } from "@/hooks/useQueries";
import { useTokenActor } from "@/hooks/useTokenActor";
import { formatTokenBalance } from "@/lib/tokenUtils";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Package, Sparkles, Zap } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { PLANNED_MODIFIER_CATALOG } from "../data/modifierCatalog";

export default function Discovery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: lands, isLoading: landsLoading } = useGetLandData();
  const {
    data: tokenBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetTokenBalance();
  const { isFetching: tokenIsFetching } = useTokenActor();

  const [caches, setCaches] = useState<LootCache[]>([]);
  const [cachesLoading, setCachesLoading] = useState(false);
  const [discoveringTier, setDiscoveringTier] = useState<number | null>(null);
  const [processingCacheId, setProcessingCacheId] = useState<bigint | null>(
    null,
  );
  type LootEntry = {
    id: string;
    time: string;
    items: Array<{
      label: string;
      sublabel: string;
      assetUrl?: string;
      color: string;
    }>;
  };
  const [lootLog, setLootLog] = useState<LootEntry[]>([]);

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
      2: { cbr: BigInt(25000000000), charge: 400 },
      3: { cbr: BigInt(50000000000), charge: 800 },
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
      const result: CacheOpenResult = await (actor as any).openCache(cacheId);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      const items = result.items.map((item) => {
        if (item.__kind__ === "mod") {
          const modId = Number(item.mod.modId);
          const cat =
            PLANNED_MODIFIER_CATALOG.find((c) => c.id === modId) ||
            PLANNED_MODIFIER_CATALOG[modId - 1];
          const rarityTier = Number(item.mod.rarityTier);
          const subtypeLabel =
            item.mod.subtype === "Ultra"
              ? " [ULTRA]"
              : item.mod.subtype === "Special"
                ? " [SPECIAL]"
                : "";
          return {
            label: cat?.name ?? `Modifier #${modId}`,
            sublabel: `${["", "Common", "Rare", "Legendary", "Mythic"][rarityTier] ?? "Mod"}${subtypeLabel}`,
            assetUrl: cat?.asset_url,
            color:
              rarityTier === 4
                ? "text-yellow-400"
                : rarityTier === 3
                  ? "text-purple-400"
                  : rarityTier === 2
                    ? "text-blue-400"
                    : "text-gray-400",
          };
        }
        if (item.__kind__ === "crystal") {
          const kindName = item.crystal.kind.__kind__;
          const tierName = item.crystal.tier.__kind__;
          const crystalColors: Record<string, string> = {
            Burnite: "text-amber-400",
            Synthex: "text-emerald-400",
            Cryonix: "text-cyan-400",
          };
          const crystalImages: Record<string, string> = {
            Burnite_T1:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_burnite_t1.webp",
            Burnite_T2:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_burnite_t2.webp",
            Burnite_T3:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_burnite_t3.webp",
            Synthex_T1:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_synthex_t1.webp",
            Synthex_T2:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_synthex_t2.webp",
            Synthex_T3:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_synthex_t3.webp",
            Cryonix_T1:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_cryonix_t1.webp",
            Cryonix_T2:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_cryonix_t2.webp",
            Cryonix_T3:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_cryonix_t3.webp",
            VoidNexus:
              "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_void.webp",
          };
          return {
            label: `${kindName} ${tierName === "T1" ? "Fragment" : "Core"}`,
            sublabel: "Crystal",
            assetUrl: crystalImages[`${kindName}_${tierName}`],
            color: crystalColors[kindName] ?? "text-cyan-400",
          };
        }
        if (item.__kind__ === "booster") {
          const boostMap: Record<string, string> = {
            B250: "+250",
            B500: "+500",
            B1000: "+1000",
          };
          const boostColors: Record<string, string> = {
            B250: "text-green-400",
            B500: "text-blue-400",
            B1000: "text-purple-400",
          };
          const kindName = item.booster.kind.__kind__;
          return {
            label: `Energy Booster ${boostMap[kindName] ?? ""}`,
            sublabel: "Booster",
            assetUrl: `https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/booster_${kindName === "B250" ? "250" : kindName === "B500" ? "500" : "1000"}.webp`,
            color: boostColors[kindName] ?? "text-green-400",
          };
        }
        if (item.__kind__ === "keeperHeart") {
          const biome = item.keeperHeart.biome;
          const biomeColors: Record<string, string> = {
            FOREST_VALLEY: "text-green-400",
            ISLAND_ARCHIPELAGO: "text-teal-400",
            SNOW_PEAK: "text-sky-400",
            DESERT_DUNE: "text-amber-400",
            VOLCANIC_CRAG: "text-red-400",
            MYTHIC_VOID: "text-violet-400",
            MYTHIC_AETHER: "text-yellow-400",
          };
          return {
            label: "Keeper Heart",
            sublabel: biome.replace(/_/g, " "),
            assetUrl: `https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/keeper_heart_${{ FOREST_VALLEY: "forest", ISLAND_ARCHIPELAGO: "island", SNOW_PEAK: "snow", DESERT_DUNE: "desert", VOLCANIC_CRAG: "volcanic", MYTHIC_VOID: "void", MYTHIC_AETHER: "aether" }[biome] ?? biome.toLowerCase()}.webp`,
            color: biomeColors[biome] ?? "text-fuchsia-400",
          };
        }
        return { label: "Unknown Drop", sublabel: "", color: "text-gray-400" };
      });

      toast.success(`Cache opened! ${result.items.length} item(s) received`);
      setLootLog((prev) =>
        [{ id: Date.now().toString(), time: timeStr, items }, ...prev].slice(
          0,
          25,
        ),
      );

      await loadCaches();
      queryClient.invalidateQueries({ queryKey: ["modifierInventory"] });
      queryClient.invalidateQueries({ queryKey: ["landData"] });
      queryClient.invalidateQueries({ queryKey: ["fullInventory"] });
    } catch (error: any) {
      toast.error(`Cache opening error: ${error.message || "Unknown error"}`);
    } finally {
      setProcessingCacheId(null);
    }
  };

  const getTierConfig = (tier: number) => {
    switch (tier) {
      case 1:
        return {
          rarityLabel: "COMMON",
          color: "text-[#00ffff]",
          glow: "box-glow-cyan",
          borderColor: "border-[#00ffff]/30",
          iconSrc: "/assets/uploads/common_cache-3.webp",
          iconGlow: "drop-shadow(0 0 14px rgba(0,255,255,0.9))",
          pulseColor: "rgba(0,255,255,0.5)",
        };
      case 2:
        return {
          rarityLabel: "RARE",
          color: "text-[#60baff]",
          glow: "box-glow-cyan",
          borderColor: "border-blue-400/30",
          iconSrc: "/assets/uploads/rare_cache-1.webp",
          iconGlow: "drop-shadow(0 0 14px rgba(96,165,250,0.9))",
          pulseColor: "rgba(96,165,250,0.5)",
        };
      case 3:
        return {
          rarityLabel: "LEGENDARY",
          color: "text-[#bb55ff]",
          glow: "box-glow-purple",
          borderColor: "border-[#9933ff]/30",
          iconSrc: "/assets/uploads/legendary_cache-2.webp",
          iconGlow: "drop-shadow(0 0 18px rgba(153,51,255,1))",
          pulseColor: "rgba(153,51,255,0.55)",
        };
      default:
        return {
          rarityLabel: "CACHE",
          color: "text-white",
          glow: "",
          borderColor: "border-white/30",
          iconSrc: "",
          iconGlow: "",
          pulseColor: "rgba(255,255,255,0.2)",
        };
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
      <style>{`
        @keyframes cache-pulse-glow {
          0%   { opacity: 0.45; transform: scale(0.85); }
          50%  { opacity: 0.9;  transform: scale(1.05); }
          100% { opacity: 0.45; transform: scale(0.85); }
        }
      `}</style>

      {/* CBR BALANCE */}
      <Card className="glassmorphism neon-border box-glow-green">
        <CardHeader>
          <CardTitle className="text-[#00ff41] flex items-center gap-2 font-orbitron text-glow-green">
            <Zap className="w-5 h-5" />
            CBR BALANCE
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading && tokenIsFetching ? (
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
                className="px-4 py-2 rounded-lg bg-[#00ffff]/15 border border-[#00ffff]/50 text-[#00ffff] font-orbitron text-sm transition-all duration-150 hover:bg-[#00ffff]/25 hover:border-[#00ffff]/80 hover:shadow-[0_0_12px_rgba(0,255,255,0.5)] active:scale-95 flex-shrink-0"
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
              <CardHeader className="pb-0 pt-0 px-4">
                {/* Title row: rarity label left + cache icon right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`${cfg.color} font-orbitron font-bold text-base tracking-wider`}
                    >
                      {cfg.rarityLabel}
                    </span>
                    <span
                      className={`${cfg.color} font-orbitron font-semibold text-sm tracking-wider opacity-80`}
                    >
                      CACHE
                    </span>
                  </div>
                  {cfg.iconSrc && (
                    <div className="relative flex-shrink-0 w-[130px] h-[130px]">
                      {/* Pulsating bloom glow behind image */}
                      <div
                        style={{
                          position: "absolute",
                          inset: "-8px",
                          borderRadius: "50%",
                          background: `radial-gradient(circle, ${cfg.pulseColor} 0%, transparent 70%)`,
                          filter: "blur(10px)",
                          animation:
                            "cache-pulse-glow 2.4s ease-in-out infinite",
                          pointerEvents: "none",
                        }}
                      />
                      <img
                        src={cfg.iconSrc}
                        alt={`${cfg.rarityLabel} Cache`}
                        style={{
                          position: "relative",
                          zIndex: 1,
                          width: "130px",
                          height: "130px",
                          objectFit: "contain",
                          filter: cfg.iconGlow,
                          background: "none",
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5 pt-0 pb-0 px-4">
                <div className="space-y-1">
                  <p className="text-white/50 text-sm font-jetbrains">
                    Cost:{" "}
                    <span className="text-[#00ff41] font-bold font-jetbrains">
                      {tier === 1 ? "100" : tier === 2 ? "250" : "500"} CBR
                    </span>
                  </p>
                  <p className="text-white/50 text-sm font-jetbrains">
                    Charge:{" "}
                    <span className="text-[#00ffff] font-bold font-jetbrains">
                      {tier === 1 ? "200" : tier === 2 ? "400" : "800"}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDiscoverCache(tier)}
                  disabled={discoveringTier !== null || !selectedLand}
                  className={
                    tier === 1
                      ? "w-full px-4 py-2 rounded-lg bg-[#00ffff]/15 border border-[#00ffff]/50 text-[#00ffff] font-bold font-orbitron text-sm transition-all duration-150 hover:bg-[#00ffff]/25 hover:border-[#00ffff]/80 hover:shadow-[0_0_14px_rgba(0,255,255,0.5)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      : tier === 2
                        ? "w-full px-4 py-2 rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/70 text-[#60baff] font-bold font-orbitron text-sm transition-all duration-150 hover:bg-[#3b82f6]/35 hover:border-[#3b82f6] hover:shadow-[0_0_16px_rgba(59,130,246,0.7)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        : "w-full px-4 py-2 rounded-lg bg-[#9933ff]/20 border border-[#9933ff]/70 text-[#bb55ff] font-bold font-orbitron text-sm transition-all duration-150 hover:bg-[#9933ff]/35 hover:border-[#9933ff] hover:shadow-[0_0_16px_rgba(153,51,255,0.7)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  }
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
                  className="glassmorphism rounded-lg p-3 border border-[#9933ff]/30"
                  data-ocid={`loot_history.item.${idx + 1}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/50 text-xs font-jetbrains">
                      {entry.time}
                    </span>
                    <span className="text-[#9933ff] text-xs font-jetbrains">
                      {entry.items.length} item
                      {entry.items.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.items.map((item, i) => (
                      <div
                        key={`${item.label}-${i}`}
                        className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1 border border-white/10"
                      >
                        {item.assetUrl ? (
                          <img
                            src={item.assetUrl}
                            alt={item.label}
                            className="w-6 h-6 rounded object-contain"
                          />
                        ) : (
                          <Sparkles className={`w-4 h-4 ${item.color}`} />
                        )}
                        <div>
                          <p
                            className={`text-xs font-jetbrains font-medium ${item.color}`}
                          >
                            {item.label}
                          </p>
                          {item.sublabel && (
                            <p className="text-[10px] text-white/40 font-jetbrains">
                              {item.sublabel}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {caches.map((cache, idx) => {
                const tier = Number(cache.tier);
                const cfg = getTierConfig(tier);
                const isOpened = cache.is_opened;
                const isProcessing = processingCacheId === cache.cache_id;
                const canOpen = canOpenCache(cache);

                return (
                  <div
                    key={cache.cache_id.toString()}
                    className={`glassmorphism rounded-lg p-3 border ${cfg.borderColor} flex items-center gap-3`}
                    data-ocid={`my_caches.item.${idx + 1}`}
                  >
                    {/* Left: icon + rarity label */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      {cfg.iconSrc && (
                        <img
                          src={cfg.iconSrc}
                          alt={cfg.rarityLabel}
                          style={{
                            width: "72px",
                            height: "72px",
                            objectFit: "contain",
                            filter: cfg.iconGlow,
                            background: "none",
                          }}
                        />
                      )}
                      <span
                        className={`${cfg.color} font-orbitron text-xs tracking-wider font-bold`}
                      >
                        {cfg.rarityLabel}
                      </span>
                    </div>

                    {/* Middle: cache ID + status */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 font-jetbrains text-sm">
                        #{cache.cache_id.toString()}
                      </p>
                      <p className="text-white/50 text-xs flex items-center gap-1 font-jetbrains">
                        <Clock className="w-3 h-3" />
                        {isOpened ? "Opened" : getTimeRemaining(cache)}
                      </p>
                    </div>

                    {/* Right: OPEN button or opened indicator */}
                    <div className="flex-shrink-0">
                      {isOpened ? (
                        <span className="text-green-400 text-sm font-jetbrains">
                          ✓ Opened
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleProcessCache(cache.cache_id)}
                          disabled={!canOpen || processingCacheId !== null}
                          className="px-4 py-2 rounded-lg bg-[#00ff41]/15 border border-[#00ff41]/50 text-[#00ff41] font-bold font-orbitron text-xs transition-all duration-150 hover:bg-[#00ff41]/25 hover:border-[#00ff41]/80 hover:shadow-[0_0_12px_rgba(0,255,65,0.5)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed min-w-[60px]"
                          data-ocid={`my_caches.open_button.${idx + 1}`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />
                              Opening...
                            </>
                          ) : (
                            "OPEN"
                          )}
                        </button>
                      )}
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
