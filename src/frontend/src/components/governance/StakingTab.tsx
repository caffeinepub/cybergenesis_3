import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useClaimVestedRewards,
  useGetMyStakeInfo,
  useGetTokenBalance,
  useStakeTokens,
  useUnstakeTokens,
} from "../../hooks/useQueries";
import { formatCBR, formatWeight, getBiomeColor } from "./GovernanceTypes";

export function StakingTab() {
  const [amount, setAmount] = useState("");
  const { data: stakeInfo, isLoading } = useGetMyStakeInfo();
  const { data: tokenBalance } = useGetTokenBalance();
  const stakeTokens = useStakeTokens();
  const unstakeTokens = useUnstakeTokens();
  const claimVested = useClaimVestedRewards();

  const biomeColor = "#00e5ff";

  const lockDays = stakeInfo?.lockEndsAt
    ? Math.ceil(
        (Number(stakeInfo.lockEndsAt / BigInt(1_000_000)) - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const lockLabel = lockDays > 0 ? `${lockDays} days remaining` : "UNLOCKED";

  const handleStake = async () => {
    const raw = Number.parseFloat(amount);
    if (!raw || Number.isNaN(raw)) return;
    await stakeTokens.mutateAsync(BigInt(Math.floor(raw * 100_000_000)));
    setAmount("");
  };

  const handleUnstake = async () => {
    const raw = Number.parseFloat(amount);
    if (!raw || Number.isNaN(raw)) return;
    await unstakeTokens.mutateAsync(BigInt(Math.floor(raw * 100_000_000)));
    setAmount("");
  };

  const handleClaim = async () => {
    await claimVested.mutateAsync();
  };

  return (
    <div
      className="flex flex-col gap-4"
      style={{ animation: "govCardIn 0.2s ease-out forwards" }}
    >
      {/* Stake info card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${biomeColor}40`,
          boxShadow: `0 0 20px ${biomeColor}15, 0 4px 24px rgba(0,0,0,0.6)`,
        }}
        data-ocid="staking.card"
      >
        <div className="px-5 pt-5 pb-4">
          <p
            className="font-orbitron text-xs font-bold tracking-widest mb-3"
            style={{ color: biomeColor, textShadow: `0 0 8px ${biomeColor}80` }}
          >
            YOUR STAKE
          </p>

          {isLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={16} className="animate-spin text-white/40" />
              <span className="font-jetbrains text-sm text-white/40">
                Loading...
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-1">
                <div>
                  <span
                    className="font-orbitron font-bold text-2xl"
                    style={{
                      color: biomeColor,
                      textShadow: `0 0 12px ${biomeColor}80`,
                    }}
                  >
                    {formatCBR(stakeInfo?.stake ?? BigInt(0))}
                  </span>
                  <span className="font-jetbrains text-sm text-white/40 ml-2">
                    CBR
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-jetbrains text-xs text-white/35 tracking-widest">
                    WEIGHT
                  </p>
                  <p
                    className="font-orbitron font-bold text-sm"
                    style={{ color: biomeColor }}
                  >
                    {formatWeight(stakeInfo?.weight ?? BigInt(0))}
                  </p>
                </div>
              </div>
              <p className="font-jetbrains text-xs text-white/35 mt-1">
                Lock: {lockLabel}
              </p>
            </>
          )}
        </div>

        <div
          style={{
            height: "1px",
            background: `linear-gradient(to right, transparent, ${biomeColor}30, transparent)`,
          }}
        />

        {/* Rewards row */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-orbitron text-xs tracking-widest text-white/35 mb-1">
              UNCLAIMED REWARDS
            </p>
            <p
              className="font-orbitron font-bold text-lg"
              style={{ color: "#ffd060" }}
            >
              {formatCBR(stakeInfo?.claimableVest ?? BigInt(0))}{" "}
              <span className="text-sm font-normal text-white/40">CBR</span>
            </p>
            <p className="font-jetbrains text-xs text-white/25 mt-0.5">
              Pending vest: {formatCBR(stakeInfo?.pendingVest ?? BigInt(0))} CBR
            </p>
          </div>
          <button
            type="button"
            onClick={handleClaim}
            disabled={claimVested.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-orbitron text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,208,96,0.15)",
              border: "1px solid rgba(255,208,96,0.5)",
              color: "#ffd060",
              boxShadow: claimVested.isPending
                ? "none"
                : "0 0 12px rgba(255,208,96,0.3)",
            }}
            data-ocid="staking.primary_button"
          >
            {claimVested.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            CLAIM
          </button>
        </div>
      </div>

      {/* Stake / Unstake form */}
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}
      >
        <p className="font-orbitron text-xs tracking-widest text-white/40 mb-3">
          AVAILABLE:{" "}
          <span className="text-white/70">
            {formatCBR(tokenBalance ?? BigInt(0))} CBR
          </span>
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex-1 flex items-center rounded-xl px-4 py-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent font-jetbrains text-sm text-white outline-none placeholder-white/25"
              data-ocid="staking.input"
            />
            <span className="font-jetbrains text-xs text-white/35 ml-2">
              CBR
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStake}
            disabled={stakeTokens.isPending || !amount}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all disabled:opacity-50"
            style={{
              background: `${biomeColor}20`,
              border: `1px solid ${biomeColor}60`,
              color: biomeColor,
              boxShadow: stakeTokens.isPending
                ? "none"
                : `0 0 12px ${biomeColor}30`,
            }}
            data-ocid="staking.submit_button"
          >
            {stakeTokens.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            STAKE TOKENS
          </button>
          <button
            type="button"
            onClick={handleUnstake}
            disabled={unstakeTokens.isPending || !amount}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
            }}
            data-ocid="staking.secondary_button"
          >
            {unstakeTokens.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            UNSTAKE
          </button>
        </div>
      </div>

      {/* Advisory notice */}
      <div
        className="rounded-2xl px-5 py-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          className="font-jetbrains text-xs leading-relaxed"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          Voting results are advisory. The development team reviews all
          proposals and implements those aligned with the game&apos;s vision.
        </p>
      </div>
    </div>
  );
}
