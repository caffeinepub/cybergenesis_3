import type { LandData } from "@/backend";
import type { BoosterKind, FullInventory } from "@/cacheTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import {
  useApplyModifier,
  useClaimRewards,
  useGetLandData,
  useGetModifierInventory,
  useGetTokenBalance,
  useRemoveModifier,
  useUpgradePlot,
} from "@/hooks/useQueries";
import { useTokenActor } from "@/hooks/useTokenActor";
import { formatTokenBalance } from "@/lib/tokenUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  Gem,
  Loader2,
  MapPin,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  KEEPER_CATALOG,
  PLANNED_MODIFIER_CATALOG,
} from "../data/modifierCatalog";

interface LandDashboardProps {
  selectedLandIndex: number;
  onSelectLand: (index: number) => void;
}

const CHARGE_RATES_BY_LEVEL = [83, 83, 83, 89, 88]; // per hour

const RARITY_NAMES: Record<string, string> = {
  "1": "Common",
  "2": "Rare",
  "3": "Legendary",
  "4": "Mythic",
  "5": "Keeper",
};

const RARITY_COLORS: Record<string, string> = {
  "1": "text-gray-400",
  "2": "text-blue-400",
  "3": "text-purple-400",
  "4": "text-yellow-400",
  "5": "text-fuchsia-400",
};

function getCatalogEntry(modifierType: string) {
  const found = PLANNED_MODIFIER_CATALOG.find(
    (c) => c.name.toLowerCase() === modifierType.toLowerCase(),
  );
  if (found) return found;
  // Also check keeper catalog
  const keeper = KEEPER_CATALOG.find(
    (k) => k.name.toLowerCase() === modifierType.toLowerCase(),
  );
  if (keeper)
    return { ...keeper, rarity_tier: 5 as const, asset_url: keeper.asset_url };
  return undefined;
}

export default function LandDashboard({
  selectedLandIndex,
  onSelectLand,
}: LandDashboardProps) {
  const { data: lands, isLoading: landsLoading } = useGetLandData();
  const {
    data: tokenBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useGetTokenBalance();
  const { data: modifierInventory, isLoading: inventoryLoading } =
    useGetModifierInventory();
  const { isFetching: tokenIsFetching } = useTokenActor();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: fullInventory, refetch: refetchInventory } = useQuery({
    queryKey: ["fullInventory"],
    queryFn: async () => {
      if (!actor) return null;
      return (await (actor as any).getFullInventory()) as FullInventory;
    },
    enabled: !!actor,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  const claimRewardsMutation = useClaimRewards();
  const upgradePlotMutation = useUpgradePlot();
  const applyModifierMutation = useApplyModifier();
  const removeModifierMutation = useRemoveModifier();

  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(
    null,
  );
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [liveCharge, setLiveCharge] = useState(0);

  const handleUseBooster = async (kind: BoosterKind) => {
    if (!actor) return;
    try {
      // biome-ignore lint/correctness/useHookAtTopLevel: actor.useBooster is not a React hook
      await (actor as any).useBooster(kind);
      toast.success("Booster used! Energy restored.");
      refetchInventory();
      queryClient.invalidateQueries({ queryKey: ["landData"] });
    } catch (error: any) {
      toast.error(`Booster error: ${error.message || "Unknown error"}`);
    }
  };

  const totalLands = lands?.length ?? 1;
  const handlePrev = () =>
    onSelectLand((selectedLandIndex - 1 + totalLands) % totalLands);
  const handleNext = () => onSelectLand((selectedLandIndex + 1) % totalLands);
  const showNav = totalLands > 1;

  const selectedLand: LandData | undefined = lands?.[selectedLandIndex];

  useEffect(() => {
    if (!selectedLand) return;
    const update = () => {
      const currentTime = Date.now() * 1_000_000;
      const lastClaimTime = Number(selectedLand.lastClaimTime);
      const dayInNanos = 86_400_000_000_000;
      const nextClaimTime = lastClaimTime + dayInNanos;
      const remaining = nextClaimTime - currentTime;
      if (remaining > 0) {
        setCooldownRemaining(remaining);
        setIsCooldownActive(true);
      } else {
        setCooldownRemaining(null);
        setIsCooldownActive(false);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedLand]);

  useEffect(() => {
    if (!selectedLand) return;
    const chargerLvl = Math.min(Number(selectedLand.upgradeLevel), 4);
    const rate = CHARGE_RATES_BY_LEVEL[chargerLvl];
    const cap = Number(selectedLand.chargeCap);
    const update = () => {
      const nowMs = Date.now();
      const lastMs = Number(selectedLand.lastChargeUpdate) / 1_000_000;
      const elapsedHrs = Math.max(0, (nowMs - lastMs) / 3_600_000);
      const estimated = Math.min(
        Number(selectedLand.cycleCharge) + Math.floor(elapsedHrs * rate),
        cap,
      );
      setLiveCharge(Math.max(0, estimated));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [selectedLand]);

  const formatCooldownTime = (nanoseconds: number): string => {
    const totalSeconds = Math.floor(nanoseconds / 1_000_000_000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleClaimRewards = async () => {
    if (!selectedLand) return;
    try {
      const result = await claimRewardsMutation.mutateAsync(
        selectedLand.landId,
      );
      if (result.__kind__ === "success") {
        toast.success(
          `Claimed ${formatTokenBalance(result.success.tokensClaimed)} CBR!`,
        );
      } else if (result.__kind__ === "cooldown") {
        const hours = Math.floor(
          Number(result.cooldown.remainingTime) / 3600000000000,
        );
        const minutes = Math.floor(
          (Number(result.cooldown.remainingTime) % 3600000000000) / 60000000000,
        );
        toast.error(`Wait ${hours}h ${minutes}m more`);
      } else if (result.__kind__ === "insufficientCharge") {
        toast.error(
          `Insufficient charge. Required: ${result.insufficientCharge.required}`,
        );
      } else if (result.__kind__ === "mintFailed") {
        toast.error(`Mint error: ${result.mintFailed}`);
      }
    } catch (error: any) {
      toast.error(`Claim error: ${error.message || "Unknown error"}`);
    }
  };

  const handleUpgradePlot = async () => {
    if (!selectedLand) return;
    const cost = BigInt(1000);
    if (!tokenBalance || tokenBalance < cost) {
      toast.error(
        `Insufficient tokens. Required: ${formatTokenBalance(cost)} CBR`,
      );
      return;
    }
    try {
      const result = await upgradePlotMutation.mutateAsync({
        landId: selectedLand.landId,
        cost,
      });
      if (result.__kind__ === "success") {
        const newDisplayLevel = Number(result.success.newLevel) + 1;
        toast.success(`Charger upgraded to level ${newDisplayLevel}!`);
      } else if (result.__kind__ === "maxLevelReached") {
        toast.error("Maximum level reached");
      } else if (result.__kind__ === "insufficientTokens") {
        toast.error(
          `Insufficient tokens. Required: ${formatTokenBalance(result.insufficientTokens.required)} CBR`,
        );
      }
    } catch (error: any) {
      toast.error(`Upgrade error: ${error.message || "Unknown error"}`);
    }
  };

  const handleApplyModifier = async (modifierInstanceId: bigint) => {
    if (!selectedLand) return;
    try {
      await applyModifierMutation.mutateAsync({
        modifierInstanceId,
        landId: selectedLand.landId,
      });
    } catch (error: any) {
      console.error("Apply modifier error:", error);
    }
  };

  const handleRemoveModifier = async (modifierInstanceId: bigint) => {
    if (!selectedLand) return;
    try {
      await removeModifierMutation.mutateAsync({
        landId: selectedLand.landId,
        modifierInstanceId,
      });
    } catch (error: any) {
      console.error("Remove modifier error:", error);
    }
  };

  if (landsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ffff] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
      </div>
    );
  }

  if (!selectedLand) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 font-jetbrains">Land not found</p>
      </div>
    );
  }

  const biomeNames: Record<string, string> = {
    FOREST_VALLEY: "Forest Valley",
    ISLAND_ARCHIPELAGO: "Island Archipelago",
    SNOW_PEAK: "Snow Peak",
    DESERT_DUNE: "Desert Dune",
    VOLCANIC_CRAG: "Volcanic Crag",
    MYTHIC_VOID: "Mythic Void",
    MYTHIC_AETHER: "Mythic Aether",
  };

  const chargerLevel = Math.min(Number(selectedLand.upgradeLevel), 4);
  const displayChargerLevel = chargerLevel + 1;
  const isMaxChargerLevel = chargerLevel >= 4;
  const chargeRate = CHARGE_RATES_BY_LEVEL[chargerLevel];
  const maxCharge = Number(selectedLand.chargeCap);
  const chargePercent =
    maxCharge > 0 ? Math.min((liveCharge / maxCharge) * 100, 100) : 0;
  const installedModsCount = selectedLand.attachedModifications?.length ?? 0;

  const _typeCounts =
    modifierInventory?.reduce((acc: Record<string, number>, m) => {
      acc[m.modifierType] = (acc[m.modifierType] || 0) + 1;
      return acc;
    }, {}) ?? {};

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
            <div className="space-y-3">
              <p className="text-3xl font-bold text-white font-orbitron">
                {formatTokenBalance(tokenBalance || BigInt(0))} CBR
              </p>
              <button
                type="button"
                onClick={handleClaimRewards}
                disabled={claimRewardsMutation.isPending || isCooldownActive}
                className="w-full px-6 py-3 rounded-lg btn-gradient-green text-black font-bold font-orbitron disabled:opacity-50 disabled:cursor-not-allowed"
                data-ocid="cbr_balance.claim_button"
              >
                {claimRewardsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                    Claiming...
                  </>
                ) : isCooldownActive && cooldownRemaining ? (
                  <>GET 100 CBR ({formatCooldownTime(cooldownRemaining)})</>
                ) : (
                  "GET 100 CBR"
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LAND INFORMATION */}
      <Card className="glassmorphism neon-border box-glow-cyan">
        <CardHeader>
          <CardTitle className="text-[#00ffff] flex items-center gap-2 w-full font-orbitron text-glow-cyan">
            <MapPin className="w-5 h-5" />
            LAND INFORMATION
            {showNav && (
              <div className="flex items-center gap-1 ml-auto">
                <button
                  type="button"
                  onClick={handlePrev}
                  data-ocid="land.pagination_prev"
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00ffff]/10 border border-[#00ffff]/40 text-[#00ffff] hover:bg-[#00ffff]/25 hover:border-[#00ffff]/80 hover:shadow-[0_0_10px_rgba(0,255,255,0.5)] active:scale-95 transition-all duration-150"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[#00ffff]/70 font-jetbrains text-xs px-1 min-w-[32px] text-center tabular-nums">
                  {selectedLandIndex + 1}/{totalLands}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  data-ocid="land.pagination_next"
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#00ffff]/10 border border-[#00ffff]/40 text-[#00ffff] hover:bg-[#00ffff]/25 hover:border-[#00ffff]/80 hover:shadow-[0_0_10px_rgba(0,255,255,0.5)] active:scale-95 transition-all duration-150"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/50 text-sm font-jetbrains">LandID</p>
              <p className="text-white font-medium font-jetbrains">
                {selectedLand.landId.toString()}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-sm font-jetbrains">Biome</p>
              <p className="text-white font-medium font-jetbrains">
                {biomeNames[selectedLand.biome] || selectedLand.biome}
              </p>
            </div>
            <div>
              <p className="text-white/50 text-sm font-jetbrains">Level</p>
              <p className="text-white font-medium font-jetbrains">
                {installedModsCount}/49
              </p>
            </div>
            <div>
              <p className="text-white/50 text-sm font-jetbrains">
                Staking Boost
              </p>
              <p className="text-white font-medium font-jetbrains">
                {(() => {
                  const biomeBP =
                    selectedLand.biome === "MYTHIC_VOID" ||
                    selectedLand.biome === "MYTHIC_AETHER"
                      ? 140
                      : selectedLand.biome === "SNOW_PEAK" ||
                          selectedLand.biome === "DESERT_DUNE" ||
                          selectedLand.biome === "VOLCANIC_CRAG"
                        ? 115
                        : 100;
                  const modCount =
                    selectedLand.attachedModifications?.length ?? 0;
                  const hasKeeper =
                    selectedLand.attachedModifications?.some(
                      (m) => Number(m.rarity_tier) === 5,
                    ) ?? false;
                  const baseBP = 100 + Math.floor((modCount * 50) / 99);
                  const keeperBP = hasKeeper ? 10 : 0;
                  const modBP = baseBP + keeperBP;
                  const finalMultiplier = (biomeBP * modBP) / 10000;
                  return `×${finalMultiplier.toFixed(2)}`;
                })()}
              </p>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-white/50 text-sm font-jetbrains flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-[#00ff41]" />
              Charge{" "}
              <span className="text-[#00ff41]/60 text-[9px]">
                (+{chargeRate}/hr)
              </span>
            </p>
            <p className="text-[#00ff41] font-medium font-jetbrains font-bold">
              {liveCharge} / {maxCharge}
            </p>
            <div className="mt-1 w-full bg-white/10 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-[#00ff41] to-[#00ffff] transition-all duration-1000"
                style={{ width: `${chargePercent}%` }}
              />
            </div>
          </div>

          {selectedLand.attachedModifications &&
            selectedLand.attachedModifications.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/70 text-sm mb-2 font-jetbrains">
                  Attached modifiers:
                </p>
                <div className="space-y-2">
                  {selectedLand.attachedModifications.map((mod) => {
                    const cat = getCatalogEntry(mod.modifierType);
                    const rarityKey = (
                      cat?.rarity_tier ?? mod.rarity_tier
                    ).toString();
                    return (
                      <div
                        key={mod.modifierInstanceId.toString()}
                        className="glassmorphism rounded-lg p-3 border border-[#9933ff]/30"
                      >
                        <div className="flex items-center gap-3">
                          {cat?.asset_url ? (
                            <img
                              src={cat.asset_url}
                              alt={cat.name}
                              className="w-9 h-9 rounded-lg object-contain flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-[#9933ff]/20 border border-[#9933ff]/40 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-4 h-4 text-[#9933ff]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium font-jetbrains text-sm truncate">
                              {mod.modifierType}
                            </p>
                            <p
                              className={`text-xs font-jetbrains ${RARITY_COLORS[rarityKey] ?? "text-gray-400"}`}
                            >
                              {RARITY_NAMES[rarityKey] ?? `Tier ${rarityKey}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveModifier(mod.modifierInstanceId)
                            }
                            disabled={removeModifierMutation.isPending}
                            className="px-2 py-2 rounded-lg bg-[#ff3344]/20 border border-[#ff3344]/50 text-[#ff3344] text-xs font-orbitron hover:bg-[#ff3344]/30 transition-all disabled:opacity-50 min-w-[60px]"
                            data-ocid="land_info.modifier.remove_button"
                          >
                            {removeModifierMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                            ) : (
                              "REMOVE"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          <div className="flex gap-3 pt-2 items-center">
            <button
              type="button"
              onClick={handleUpgradePlot}
              disabled={upgradePlotMutation.isPending || isMaxChargerLevel}
              className="flex-1 px-4 py-3 rounded-lg btn-gradient-green text-black font-bold font-orbitron disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              data-ocid="land_info.upgrade_charger_button"
            >
              {upgradePlotMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                  Upgrading...
                </>
              ) : isMaxChargerLevel ? (
                "MAX LEVEL"
              ) : (
                `UPGRADE CHARGER ${displayChargerLevel}/5`
              )}
            </button>
            <div className="flex-1 space-y-1">
              <p className="text-white/70 text-sm font-jetbrains">
                Current level:{" "}
                <span className="text-white font-bold">
                  {displayChargerLevel}
                </span>
              </p>
              <p className="text-white/70 text-sm font-jetbrains">
                Upgrade cost:{" "}
                <span className="text-[#00ff41] font-bold">1000 CBR</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODIFIER INVENTORY */}
      <Card className="glassmorphism neon-border box-glow-purple">
        <CardHeader>
          <CardTitle className="text-[#9933ff] flex items-center gap-2 font-orbitron text-glow-purple">
            <TrendingUp className="w-5 h-5" />
            MODIFIER INVENTORY
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#9933ff]" />
              <span className="text-white/70 font-jetbrains">
                Loading inventory...
              </span>
            </div>
          ) : !modifierInventory || modifierInventory.length === 0 ? (
            <p
              className="text-white/50 text-center py-4 font-jetbrains"
              data-ocid="modifier_inventory.empty_state"
            >
              No available modifiers
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(() => {
                const groupedMods = new Map<string, typeof modifierInventory>();
                for (const mod of modifierInventory) {
                  const key = mod.modifierType;
                  if (!groupedMods.has(key)) groupedMods.set(key, []);
                  groupedMods.get(key)!.push(mod);
                }
                return Array.from(groupedMods.entries()).map(
                  ([modType, instances], idx) => {
                    const cat = getCatalogEntry(modType);
                    const rarityTier =
                      cat?.rarity_tier ?? Number(instances[0].rarity_tier);
                    const rarityKey = rarityTier.toString();
                    const rarityName =
                      RARITY_NAMES[rarityKey] || `Tier ${rarityKey}`;
                    const rarityColor =
                      RARITY_COLORS[rarityKey] || "text-gray-400";
                    const count = instances.length;

                    // Find if any instance of this type is installed on current land
                    const installedInstance = instances.find((m) =>
                      selectedLand?.attachedModifications?.some(
                        (a) => a.modifierInstanceId === m.modifierInstanceId,
                      ),
                    );
                    const isInstalled = !!installedInstance;

                    // For install: use the first non-installed instance
                    const installableInstance = instances.find(
                      (m) =>
                        !selectedLand?.attachedModifications?.some(
                          (a) => a.modifierInstanceId === m.modifierInstanceId,
                        ),
                    );

                    // Keeper biome check
                    const isKeeperMod = rarityTier === 5;
                    const keeperEntry = isKeeperMod
                      ? KEEPER_CATALOG.find(
                          (k) =>
                            k.region === modType ||
                            k.name.toLowerCase() === modType.toLowerCase(),
                        )
                      : undefined;
                    const keeperBiomeMismatch =
                      isKeeperMod &&
                      keeperEntry !== undefined &&
                      selectedLand?.biome !== keeperEntry.region;

                    const installDisabled =
                      applyModifierMutation.isPending ||
                      !selectedLand ||
                      !installableInstance ||
                      keeperBiomeMismatch;

                    const installTitle = keeperBiomeMismatch
                      ? `${keeperEntry!.name} can only be installed on ${keeperEntry!.biome} land`
                      : undefined;

                    return (
                      <div
                        key={modType}
                        className="glassmorphism rounded-lg p-3 border border-[#9933ff]/30 hover:border-[#9933ff]/60 hover:shadow-[0_0_8px_rgba(153,51,255,0.2)] transition-all duration-150"
                        data-ocid={`modifier_inventory.item.${idx + 1}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Catalog image */}
                          {cat?.asset_url ? (
                            <img
                              src={cat.asset_url}
                              alt={cat.name}
                              className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                              style={{
                                filter: `drop-shadow(0 0 6px ${
                                  rarityTier === 5
                                    ? "rgba(204,68,255,0.7)"
                                    : rarityTier === 4
                                      ? "rgba(250,204,21,0.6)"
                                      : rarityTier === 3
                                        ? "rgba(168,85,247,0.5)"
                                        : rarityTier === 2
                                          ? "rgba(96,165,250,0.4)"
                                          : "rgba(156,163,175,0.3)"
                                })`,
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#9933ff]/20 border border-[#9933ff]/40 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-5 h-5 text-[#9933ff]" />
                            </div>
                          )}
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium font-jetbrains text-sm truncate">
                                {cat?.name ?? modType}
                              </p>
                              {count >= 2 && (
                                <span className="text-[10px] font-jetbrains text-[#9933ff] bg-[#9933ff]/15 border border-[#9933ff]/30 px-1.5 py-0.5 rounded flex-shrink-0 font-bold">
                                  ×{count}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs font-jetbrains ${rarityColor}`}
                            >
                              {rarityName}
                            </p>
                          </div>
                          {/* Toggle button */}
                          {isInstalled ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveModifier(
                                  installedInstance!.modifierInstanceId,
                                )
                              }
                              disabled={
                                removeModifierMutation.isPending ||
                                !selectedLand
                              }
                              className="px-3 py-2 rounded-lg bg-[#ff3344]/15 border border-[#ff3344]/50 text-[#ff3344] text-xs font-orbitron transition-all duration-150 hover:bg-[#ff3344]/25 hover:border-[#ff3344]/80 hover:shadow-[0_0_12px_rgba(255,51,68,0.5)] active:scale-95 min-w-[70px] disabled:opacity-40 disabled:cursor-not-allowed"
                              data-ocid={`modifier_inventory.remove_button.${idx + 1}`}
                            >
                              {removeModifierMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : (
                                "REMOVE"
                              )}
                            </button>
                          ) : keeperBiomeMismatch ? (
                            <button
                              type="button"
                              disabled
                              title={installTitle}
                              className="px-3 py-2 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/50 text-[#f59e0b] text-xs font-orbitron transition-all duration-150 cursor-not-allowed opacity-70 min-w-[70px]"
                              data-ocid={`modifier_inventory.button.${idx + 1}`}
                            >
                              WRONG BIOME
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                installableInstance &&
                                handleApplyModifier(
                                  installableInstance.modifierInstanceId,
                                )
                              }
                              disabled={installDisabled}
                              title={installTitle}
                              className="px-3 py-2 rounded-lg bg-[#00ff41]/15 border border-[#00ff41]/50 text-[#00ff41] text-xs font-orbitron transition-all duration-150 hover:bg-[#00ff41]/25 hover:border-[#00ff41]/80 hover:shadow-[0_0_12px_rgba(0,255,65,0.5)] active:scale-95 min-w-[70px] disabled:opacity-40 disabled:cursor-not-allowed"
                              data-ocid={`modifier_inventory.button.${idx + 1}`}
                            >
                              {applyModifierMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                              ) : (
                                "INSTALL"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOOSTERS */}
      <Card className="glassmorphism neon-border box-glow-cyan">
        <CardHeader>
          <CardTitle className="text-[#00ffff] flex items-center gap-2 font-orbitron text-glow-cyan">
            <Zap className="w-5 h-5" />
            BOOSTERS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[#00ffff]/50 text-xs font-jetbrains uppercase tracking-wider mb-3">
            Energy Boosters
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {!fullInventory || fullInventory.boosters.length === 0 ? (
              <p
                className="text-white/50 text-center py-4 font-jetbrains"
                data-ocid="boosters.empty_state"
              >
                No boosters. Open caches!
              </p>
            ) : (
              (() => {
                const boosterConfig = [
                  {
                    kind: { __kind__: "B250" } as BoosterKind,
                    label: "+250 Energy",
                    color: "text-green-400",
                    border: "border-green-400/30",
                    bg: "bg-green-400/10",
                    glow: "hover:shadow-[0_0_12px_rgba(74,222,128,0.4)]",
                    btnBorder: "border-green-400/50",
                    btnBg: "bg-green-400/15",
                    btnHover:
                      "hover:bg-green-400/25 hover:border-green-400/80 hover:shadow-[0_0_10px_rgba(74,222,128,0.5)]",
                  },
                  {
                    kind: { __kind__: "B500" } as BoosterKind,
                    label: "+500 Energy",
                    color: "text-blue-400",
                    border: "border-blue-400/30",
                    bg: "bg-blue-400/10",
                    glow: "hover:shadow-[0_0_12px_rgba(96,165,250,0.4)]",
                    btnBorder: "border-blue-400/50",
                    btnBg: "bg-blue-400/15",
                    btnHover:
                      "hover:bg-blue-400/25 hover:border-blue-400/80 hover:shadow-[0_0_10px_rgba(96,165,250,0.5)]",
                  },
                  {
                    kind: { __kind__: "B1000" } as BoosterKind,
                    label: "+1000 Energy",
                    color: "text-purple-400",
                    border: "border-purple-400/30",
                    bg: "bg-purple-400/10",
                    glow: "hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]",
                    btnBorder: "border-purple-400/50",
                    btnBg: "bg-purple-400/15",
                    btnHover:
                      "hover:bg-purple-400/25 hover:border-purple-400/80 hover:shadow-[0_0_10px_rgba(168,85,247,0.5)]",
                  },
                ];
                return boosterConfig
                  .map((cfg) => {
                    const entry = fullInventory.boosters.find(
                      (b) => b.kind.__kind__ === cfg.kind.__kind__,
                    );
                    if (!entry || Number(entry.quantity) === 0) return null;
                    const qty = Number(entry.quantity);
                    return (
                      <div
                        key={cfg.kind.__kind__}
                        className={`glassmorphism rounded-lg p-3 border ${cfg.border} flex items-center gap-3 transition-all duration-150 ${cfg.glow}`}
                      >
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/booster_${cfg.kind.__kind__ === "B250" ? "250" : cfg.kind.__kind__ === "B500" ? "500" : "1000"}.webp`}
                            alt={cfg.label}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-jetbrains font-medium ${cfg.color}`}
                            >
                              {cfg.label}
                            </p>
                            {qty >= 2 && (
                              <span
                                className={`text-[10px] font-jetbrains ${cfg.color} ${cfg.bg} border ${cfg.border} px-1.5 py-0.5 rounded flex-shrink-0 font-bold`}
                              >
                                ×{qty}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs font-jetbrains">
                            Instant energy refill
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUseBooster(cfg.kind)}
                          className={`px-3 py-1.5 rounded-lg ${cfg.btnBg} border ${cfg.btnBorder} ${cfg.color} text-xs font-orbitron font-bold transition-all duration-150 ${cfg.btnHover} active:scale-95`}
                          data-ocid={`boosters.${cfg.kind.__kind__}.button`}
                        >
                          USE
                        </button>
                      </div>
                    );
                  })
                  .filter(Boolean);
              })()
            )}
          </div>
        </CardContent>
      </Card>

      {/* CRYSTALS */}
      <Card className="glassmorphism neon-border box-glow-purple">
        <CardHeader>
          <CardTitle className="text-[#9933ff] flex items-center gap-2 font-orbitron text-glow-purple">
            <Gem className="w-5 h-5" />
            CRYSTALS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {!fullInventory ||
            (fullInventory.crystals.length === 0 &&
              fullInventory.keeperHearts.length === 0) ? (
              <p
                className="text-white/50 text-center py-4 font-jetbrains"
                data-ocid="crystals.empty_state"
              >
                No crystals. Open caches!
              </p>
            ) : (
              <>
                {(() => {
                  const crystalConfig = [
                    {
                      kind: "Burnite",
                      t1Label: "Burnite Fragment",
                      t2Label: "Burnite Core",
                      color: "text-amber-400",
                      border: "border-amber-400/30",
                      bg: "bg-amber-400/10",
                    },
                    {
                      kind: "Synthex",
                      t1Label: "Synthex Fragment",
                      t2Label: "Synthex Core",
                      color: "text-emerald-400",
                      border: "border-emerald-400/30",
                      bg: "bg-emerald-400/10",
                    },
                    {
                      kind: "Cryonix",
                      t1Label: "Cryonix Fragment",
                      t2Label: "Cryonix Core",
                      color: "text-cyan-400",
                      border: "border-cyan-400/30",
                      bg: "bg-cyan-400/10",
                    },
                  ];
                  return crystalConfig.flatMap((cfg) =>
                    ["T1", "T2"]
                      .map((tier) => {
                        const entry = fullInventory?.crystals.find(
                          (c) =>
                            c.kind.__kind__ === cfg.kind &&
                            c.tier.__kind__ === tier,
                        );
                        if (!entry || Number(entry.quantity) === 0) return null;
                        const qty = Number(entry.quantity);
                        const label = tier === "T1" ? cfg.t1Label : cfg.t2Label;
                        const tierBadge = tier === "T1" ? "FRAGMENT" : "CORE";
                        return (
                          <div
                            key={`${cfg.kind}_${tier}`}
                            className={`glassmorphism rounded-lg p-3 border ${cfg.border} flex items-center gap-3`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={`https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_${cfg.kind.toLowerCase()}_${tier.toLowerCase()}.webp`}
                                alt={label}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-sm font-jetbrains font-medium ${cfg.color}`}
                                >
                                  {label}
                                </p>
                                {qty >= 2 && (
                                  <span
                                    className={`text-[10px] font-jetbrains ${cfg.color} ${cfg.bg} border ${cfg.border} px-1.5 py-0.5 rounded flex-shrink-0 font-bold`}
                                  >
                                    ×{qty}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-orbitron ${cfg.color} opacity-60 uppercase tracking-wider`}
                              >
                                {tierBadge}
                              </span>
                            </div>
                          </div>
                        );
                      })
                      .filter(Boolean),
                  );
                })()}
                {/* Void Nexus — coming in Crafting */}
                <div className="glassmorphism rounded-lg p-3 border border-purple-400/30 flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/crystal_void.webp"
                      alt="Void Nexus"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-jetbrains font-medium text-purple-400">
                        Void Nexus
                      </p>
                    </div>
                    <span className="text-[10px] font-orbitron text-purple-400 opacity-60 uppercase tracking-wider">
                      Coming in Crafting
                    </span>
                  </div>
                </div>
                {fullInventory?.keeperHearts &&
                  fullInventory.keeperHearts.length > 0 &&
                  (() => {
                    const grouped = new Map<string, number>();
                    for (const h of fullInventory.keeperHearts) {
                      grouped.set(h.biome, (grouped.get(h.biome) ?? 0) + 1);
                    }
                    const biomeColors: Record<string, string> = {
                      FOREST_VALLEY: "text-green-400",
                      ISLAND_ARCHIPELAGO: "text-teal-400",
                      SNOW_PEAK: "text-sky-400",
                      DESERT_DUNE: "text-amber-400",
                      VOLCANIC_CRAG: "text-red-400",
                      MYTHIC_VOID: "text-violet-400",
                      MYTHIC_AETHER: "text-yellow-400",
                    };
                    const biomeBorders: Record<string, string> = {
                      FOREST_VALLEY: "border-green-400/30",
                      ISLAND_ARCHIPELAGO: "border-teal-400/30",
                      SNOW_PEAK: "border-sky-400/30",
                      DESERT_DUNE: "border-amber-400/30",
                      VOLCANIC_CRAG: "border-red-400/30",
                      MYTHIC_VOID: "border-violet-400/30",
                      MYTHIC_AETHER: "border-yellow-400/30",
                    };
                    return Array.from(grouped.entries()).map(([biome, qty]) => (
                      <div
                        key={`heart_${biome}`}
                        className={`glassmorphism rounded-lg p-3 border ${biomeBorders[biome] ?? "border-fuchsia-400/30"} flex items-center gap-3`}
                      >
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={`https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Caches/${({ FOREST_VALLEY: "keeper_heart_forest", ISLAND_ARCHIPELAGO: "keeper_heart_island", SNOW_PEAK: "keeper_heart_snow", DESERT_DUNE: "keeper_heart_desert", VOLCANIC_CRAG: "keeper_heart_volcanic", MYTHIC_VOID: "keeper_heart_void", MYTHIC_AETHER: "keeper_heart_aether" } as Record<string, string>)[biome] ?? "keeper_heart_forest"}.webp`}
                            alt={`Keeper Heart ${biome}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-jetbrains font-medium ${biomeColors[biome] ?? "text-fuchsia-400"}`}
                            >
                              Keeper Heart
                            </p>
                            {qty >= 2 && (
                              <span className="text-[10px] font-jetbrains text-fuchsia-400 bg-fuchsia-400/10 border border-fuchsia-400/30 px-1.5 py-0.5 rounded flex-shrink-0 font-bold">
                                ×{qty}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs font-jetbrains">
                            {biome.replace(/_/g, " ")}
                          </p>
                        </div>
                        <span className="text-[10px] font-orbitron text-fuchsia-400 opacity-60 uppercase tracking-wider">
                          KEEPER
                        </span>
                      </div>
                    ));
                  })()}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
