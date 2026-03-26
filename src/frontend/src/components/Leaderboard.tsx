import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTokenBalance } from "@/lib/tokenUtils";
import { Loader2, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetTopLands } from "../hooks/useQueries";
import { useTokenActor } from "../hooks/useTokenActor";

const BIOME_COLORS: Record<string, string> = {
  MYTHIC_VOID: "#cc00ff",
  MYTHIC_AETHER: "#0088ff",
  VOLCANIC_CRAG: "#ff2200",
  DESERT_DUNE: "#ffaa00",
  FOREST_VALLEY: "#00ff44",
  SNOW_PEAK: "#88ddff",
  ISLAND_ARCHIPELAGO: "#00ffcc",
};

const SLOT_COLORS = [
  "#9CA3AF", // Common tier 1 (slots 1-15)
  "#60A5FA", // Rare tier 2 (slots 16-30)
  "#A855F7", // Legendary tier 3 (slots 31-42)
  "#FACC15", // Mythic tier 4 (slots 43-48)
  "#cc44ff", // Keeper slot 49
];

function getSlotColor(slotIndex: number): string {
  if (slotIndex < 15) return SLOT_COLORS[0];
  if (slotIndex < 30) return SLOT_COLORS[1];
  if (slotIndex < 42) return SLOT_COLORS[2];
  if (slotIndex < 48) return SLOT_COLORS[3];
  return SLOT_COLORS[4];
}

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 5)}...${p.slice(-4)}`;
}

interface LandEntry {
  principal: { toString(): string };
  biome?: string;
  landId?: bigint;
  upgradeLevel: bigint;
}

function InspectorModal({
  entry,
  biomeColor,
  onClose,
}: {
  entry: LandEntry;
  biomeColor: string | null;
  onClose: () => void;
}) {
  const color = biomeColor ?? "#00ff41";
  const maxMods = Number(entry.upgradeLevel);
  const principalStr = entry.principal?.toString() ?? "";

  const slots = Array.from({ length: 49 }, (_, i) => ({
    index: i,
    filled: i < maxMods,
    color: getSlotColor(i),
  }));

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close inspector"
      />
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,3,30,0.98) 0%, rgba(5,0,20,0.99) 100%)",
          outline: `1px solid ${color}40`,
          outlineOffset: "-1px",
          boxShadow: `0 0 40px ${color}30, 0 8px 32px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          }}
        />

        <div className="px-5 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p
              className="font-orbitron font-black text-sm tracking-widest"
              style={{ color, textShadow: `0 0 12px ${color}80` }}
            >
              LAND PROFILE
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center font-orbitron text-sm transition-all hover:scale-110"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              ×
            </button>
          </div>

          {/* Principal */}
          <div
            className="rounded-xl px-3 py-2.5 mb-4"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              className="font-orbitron text-[9px] tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              OWNER
            </p>
            <p className="font-jetbrains text-xs text-white/70 break-all">
              {principalStr}
            </p>
          </div>

          {/* Biome + LandID */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
            <div className="flex-1">
              <p
                className="font-orbitron text-xs font-bold"
                style={{ color, textShadow: `0 0 8px ${color}60` }}
              >
                {entry.biome?.replace(/_/g, " ") ?? "UNKNOWN BIOME"}
              </p>
              {entry.landId !== undefined && (
                <p
                  className="font-jetbrains text-[9px]"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Land #{entry.landId.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Mod slots */}
          <div className="mb-4">
            <p
              className="font-orbitron text-[10px] tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              MOD SLOTS
            </p>
            <p
              className="font-orbitron text-lg font-black mb-3"
              style={{ color, textShadow: `0 0 12px ${color}60` }}
            >
              Lv. {maxMods}/49
            </p>
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "repeat(7, 20px)" }}
            >
              {slots.map((slot) => (
                <div
                  key={slot.index}
                  className="rounded-[3px]"
                  style={{
                    width: "20px",
                    height: "20px",
                    background: slot.filled
                      ? `${slot.color}35`
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      slot.filled ? `${slot.color}70` : "rgba(255,255,255,0.08)"
                    }`,
                    boxShadow:
                      slot.filled && slot.index >= 42
                        ? `0 0 4px ${slot.color}60`
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Upgrade level stat */}
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: `${color}10`,
              border: `1px solid ${color}30`,
            }}
          >
            <p
              className="font-orbitron text-[9px] tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              UPGRADE LEVEL
            </p>
            <p className="font-orbitron text-sm font-bold" style={{ color }}>
              {maxMods} / 49
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Leaderboard() {
  const { data: topLands, isLoading, error } = useGetTopLands();
  const { identity } = useInternetIdentity();
  const { actor: tokenActor, isFetching: tokenIsFetching } = useTokenActor();
  const myPrincipal = identity?.getPrincipal().toString() ?? null;

  const [cbrBalances, setCbrBalances] = useState<Record<string, bigint>>({});
  const [cbrLoading, setCbrLoading] = useState(false);
  const [inspectedEntry, setInspectedEntry] = useState<LandEntry | null>(null);

  useEffect(() => {
    if (!topLands || !tokenActor || topLands.length === 0) return;
    const fetchAll = async () => {
      setCbrLoading(true);
      try {
        const pairs = await Promise.all(
          topLands.map(async (entry) => {
            try {
              const timeoutPromise = new Promise<bigint>((resolve) =>
                setTimeout(() => resolve(BigInt(0)), 5000),
              );
              const balPromise = tokenActor.icrc1_balance_of({
                owner: entry.principal,
                subaccount: [],
              });
              const bal = await Promise.race([balPromise, timeoutPromise]);
              return [entry.principal.toString(), bal] as [string, bigint];
            } catch {
              return [entry.principal.toString(), BigInt(0)] as [
                string,
                bigint,
              ];
            }
          }),
        );
        setCbrBalances(Object.fromEntries(pairs));
      } catch (e) {
        console.warn("[Leaderboard] CBR fetch error:", e);
      } finally {
        setCbrLoading(false);
      }
    };
    fetchAll();
  }, [topLands, tokenActor]);

  useEffect(() => {
    if (!tokenActor && !tokenIsFetching && topLands && topLands.length > 0) {
      const zeroes: Record<string, bigint> = {};
      for (const entry of topLands) {
        const key = entry.principal?.toString() ?? "";
        zeroes[key] = BigInt(0);
      }
      setCbrBalances(zeroes);
      setCbrLoading(false);
    }
  }, [tokenActor, tokenIsFetching, topLands]);

  const sortedLands = topLands
    ? [...topLands].sort((a, b) => {
        const lvDiff = Number(b.upgradeLevel) - Number(a.upgradeLevel);
        if (lvDiff !== 0) return lvDiff;
        const balA = cbrBalances[a.principal.toString()] ?? BigInt(0);
        const balB = cbrBalances[b.principal.toString()] ?? BigInt(0);
        return balB > balA ? 1 : balB < balA ? -1 : 0;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00ff41]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error loading leaderboard</p>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-md border-[#00ff41]/30 shadow-[0_0_15px_rgba(0,255,65,0.3)]">
        <CardHeader>
          <CardTitle className="text-[#00ff41] flex items-center gap-2 font-orbitron">
            <Trophy className="w-6 h-6" />
            TOP-25 LANDS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!sortedLands || sortedLands.length === 0 ? (
            <p className="text-white/50 text-center py-8 font-jetbrains">
              No data to display
            </p>
          ) : (
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {sortedLands.map((entry, index) => {
                const principalStr = entry.principal?.toString() ?? "";
                const isMe =
                  myPrincipal != null && principalStr === myPrincipal;
                const biome = entry.biome as string | undefined;
                const biomeColor =
                  biome && BIOME_COLORS[biome] ? BIOME_COLORS[biome] : null;

                const rankColor = biomeColor
                  ? biomeColor
                  : index === 0
                    ? "#ffd700"
                    : index === 1
                      ? "#c0c0c0"
                      : index === 2
                        ? "#cd7f32"
                        : "rgba(255,255,255,0.35)";

                const rankShadow = biomeColor
                  ? `0 0 10px ${biomeColor}`
                  : index < 3
                    ? `0 0 6px ${rankColor}`
                    : "none";

                const borderClass =
                  index === 0
                    ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                    : index === 1
                      ? "border-gray-400/50 shadow-[0_0_10px_rgba(156,163,175,0.2)]"
                      : index === 2
                        ? "border-orange-600/50 shadow-[0_0_10px_rgba(234,88,12,0.2)]"
                        : "border-white/10";

                const cbr = cbrBalances[principalStr];
                const cbrDisplay =
                  cbrLoading || cbr === undefined
                    ? "..."
                    : formatTokenBalance(cbr);

                return (
                  <button
                    type="button"
                    key={principalStr || String(index)}
                    onClick={() =>
                      setInspectedEntry({
                        principal: entry.principal,
                        biome: entry.biome as string | undefined,
                        landId: entry.landId,
                        upgradeLevel: entry.upgradeLevel,
                      })
                    }
                    className={`relative w-full text-left bg-white/5 rounded-lg p-3 border ${borderClass} ${isMe ? "pl-4" : ""} hover:scale-[1.005] transition-transform cursor-pointer`}
                  >
                    {isMe && (
                      <span
                        className="absolute top-1 left-1 animate-pulse"
                        style={{
                          filter: "drop-shadow(0 0 6px #ffd700)",
                          fontSize: "14px",
                          lineHeight: 1,
                        }}
                      >
                        ⭐
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="text-xl font-bold font-orbitron w-8 flex-shrink-0"
                          style={{ color: rankColor, textShadow: rankShadow }}
                        >
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white/80 font-jetbrains text-sm font-medium tracking-wider">
                            {truncatePrincipal(principalStr)}
                          </p>
                          {biome && (
                            <p
                              className="text-xs font-jetbrains"
                              style={{
                                color: biomeColor
                                  ? `${biomeColor}cc`
                                  : "rgba(255,255,255,0.3)",
                              }}
                            >
                              {biome.replace(/_/g, " ")}
                              {entry.landId !== undefined && (
                                <span
                                  style={{
                                    color: "rgba(255,255,255,0.3)",
                                    marginLeft: "6px",
                                  }}
                                >
                                  · #{entry.landId.toString()}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p
                          className="font-bold font-jetbrains text-sm"
                          style={{ color: "#00ff41" }}
                        >
                          Lv. {entry.upgradeLevel.toString()}/49
                        </p>
                        <p
                          className="font-jetbrains text-xs"
                          style={{
                            color:
                              cbrLoading || cbr === undefined
                                ? "rgba(255,215,0,0.4)"
                                : "#ffd700",
                          }}
                        >
                          {cbrDisplay} CBR
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {inspectedEntry && (
        <InspectorModal
          entry={inspectedEntry}
          biomeColor={
            inspectedEntry.biome && BIOME_COLORS[inspectedEntry.biome]
              ? BIOME_COLORS[inspectedEntry.biome]
              : null
          }
          onClose={() => setInspectedEntry(null)}
        />
      )}
    </>
  );
}
