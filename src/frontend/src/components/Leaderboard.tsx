import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTokenBalance } from "@/lib/tokenUtils";
import { Loader2, Trophy } from "lucide-react";
import React, { useEffect, useState } from "react";
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

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  // ICP standard: first 5 chars + ... + last 4 chars
  return `${p.slice(0, 5)}...${p.slice(-4)}`;
}

export default function Leaderboard() {
  const { data: topLands, isLoading, error } = useGetTopLands();
  const { identity } = useInternetIdentity();
  const { actor: tokenActor, isFetching: tokenIsFetching } = useTokenActor();
  const myPrincipal = identity?.getPrincipal().toString() ?? null;

  const [cbrBalances, setCbrBalances] = useState<Record<string, bigint>>({});
  const [cbrLoading, setCbrLoading] = useState(false);

  // Fetch CBR balances for all top-25 in parallel (tiebreaker)
  useEffect(() => {
    console.log(
      "[Leaderboard] tokenActor ready:",
      !!tokenActor,
      "topLands:",
      topLands?.length,
    );
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

  // When token canister confirmed unavailable, show 0 instead of "..."
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
  // Sort: level desc, then CBR tiebreaker desc
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
              const isMe = myPrincipal != null && principalStr === myPrincipal;
              const biome = entry.biome as string | undefined;
              const biomeColor =
                biome && BIOME_COLORS[biome] ? BIOME_COLORS[biome] : null;

              // Rank color: biome color for anyone with a biome, medals for top-3 without biome
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
                isMe && biomeColor
                  ? `border-[${biomeColor}]/40 shadow-[0_0_12px_${biomeColor}30]`
                  : index === 0
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
                <div
                  key={principalStr || String(index)}
                  className={`relative bg-white/5 rounded-lg p-3 border ${borderClass} ${isMe ? "pl-4" : ""}`}
                >
                  {/* Burning star for owner */}
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
                    {/* Left: rank + principal + biome */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="text-xl font-bold font-orbitron w-8 flex-shrink-0"
                        style={{
                          color: rankColor,
                          textShadow: rankShadow,
                        }}
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

                    {/* Right: level (green) + CBR (yellow) */}
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
