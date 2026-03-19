import type { LandData } from "@/backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  BatteryCharging,
  Gem,
  Loader2,
  MapPin,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { PLANNED_MODIFIER_CATALOG } from "../data/modifierCatalog";

interface LandDashboardProps {
  selectedLandIndex: number;
}

const CHARGE_RATES_BY_LEVEL = [100, 200, 300, 400, 500];

const RARITY_NAMES: Record<string, string> = {
  "1": "Common",
  "2": "Rare",
  "3": "Legendary",
  "4": "Mythic",
};

const RARITY_COLORS: Record<string, string> = {
  "1": "text-gray-400",
  "2": "text-blue-400",
  "3": "text-purple-400",
  "4": "text-yellow-400",
};

function getCatalogEntry(modifierType: string) {
  return PLANNED_MODIFIER_CATALOG.find(
    (c) => c.name.toLowerCase() === modifierType.toLowerCase(),
  );
}

export default function LandDashboard({
  selectedLandIndex,
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
  const claimRewardsMutation = useClaimRewards();
  const upgradePlotMutation = useUpgradePlot();
  const applyModifierMutation = useApplyModifier();
  const removeModifierMutation = useRemoveModifier();

  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(
    null,
  );
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [liveCharge, setLiveCharge] = useState(0);

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
      const elapsedMin = Math.max(0, (nowMs - lastMs) / 60_000);
      const estimated = Math.min(
        Number(selectedLand.cycleCharge) + Math.floor(elapsedMin * rate),
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

  const typeCounts =
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
          <CardTitle className="text-[#00ffff] flex items-center gap-2 font-orbitron text-glow-cyan">
            <MapPin className="w-5 h-5" />
            LAND INFORMATION
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
              <p className="text-white/50 text-sm font-jetbrains">Multiplier</p>
              <p className="text-white font-medium font-jetbrains">
                {selectedLand.baseTokenMultiplier}x
              </p>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-white/50 text-sm font-jetbrains flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-[#00ff41]" />
              Charge{" "}
              <span className="text-[#00ff41]/60 text-[9px]">
                (+{chargeRate}/min)
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
              {modifierInventory.map((modifier, idx) => {
                const cat = getCatalogEntry(modifier.modifierType);
                const rarityTier =
                  cat?.rarity_tier ?? Number(modifier.rarity_tier);
                const rarityKey = rarityTier.toString();
                const rarityName =
                  RARITY_NAMES[rarityKey] || `Tier ${rarityKey}`;
                const rarityColor = RARITY_COLORS[rarityKey] || "text-gray-400";
                const countOfThisType = typeCounts[modifier.modifierType] || 1;
                const isInstalled =
                  selectedLand?.attachedModifications?.some(
                    (m) => m.modifierInstanceId === modifier.modifierInstanceId,
                  ) ?? false;

                return (
                  <div
                    key={modifier.modifierInstanceId.toString()}
                    className="glassmorphism rounded-lg p-3 border border-[#9933ff]/30 hover:border-[#9933ff]/50 transition-colors"
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
                            filter: `drop-shadow(0 0 6px ${rarityTier === 4 ? "rgba(250,204,21,0.6)" : rarityTier === 3 ? "rgba(168,85,247,0.5)" : rarityTier === 2 ? "rgba(96,165,250,0.4)" : "rgba(156,163,175,0.3)"})`,
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
                            {cat?.name ?? modifier.modifierType}
                          </p>
                          {countOfThisType >= 2 && (
                            <span className="text-[10px] font-jetbrains text-[#9933ff]/70 bg-[#9933ff]/10 px-1 rounded flex-shrink-0">
                              x{countOfThisType}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-jetbrains ${rarityColor}`}>
                          {rarityName}
                        </p>
                        <p className="text-[#9933ff]/60 text-[10px] font-jetbrains">
                          ID: {modifier.modifierInstanceId.toString()}
                        </p>
                      </div>
                      {/* Toggle button */}
                      {isInstalled ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveModifier(modifier.modifierInstanceId)
                          }
                          disabled={
                            removeModifierMutation.isPending || !selectedLand
                          }
                          className="px-2 py-2 rounded-lg bg-[#ff3344]/20 border border-[#ff3344]/50 text-[#ff3344] text-xs font-orbitron hover:bg-[#ff3344]/30 transition-all disabled:opacity-50 min-w-[60px]"
                          data-ocid={`modifier_inventory.remove_button.${idx + 1}`}
                        >
                          {removeModifierMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                          ) : (
                            "REMOVE"
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyModifier(modifier.modifierInstanceId)
                          }
                          disabled={
                            applyModifierMutation.isPending || !selectedLand
                          }
                          className="px-2 py-2 rounded-lg bg-[#00ff41]/20 border border-[#00ff41]/50 text-[#00ff41] text-xs font-orbitron hover:bg-[#00ff41]/30 transition-all disabled:opacity-50 min-w-[60px]"
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
              })}
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
          <div className="max-h-64 overflow-y-auto pr-1">
            <p
              className="text-white/50 text-center py-4 font-jetbrains"
              data-ocid="boosters.empty_state"
            >
              No boosters. Open caches!
            </p>
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
            <p
              className="text-white/50 text-center py-4 font-jetbrains"
              data-ocid="crystals.empty_state"
            >
              No crystals. Open caches!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
