import { useState } from "react";
import type { GStakerLeaderboardEntry } from "../../governance-backend.d";
import { useGetLeaderboard } from "../../hooks/useQueries";
import {
  formatCBR,
  formatWeight,
  getBiomeColor,
  shortenPrincipal,
} from "./GovernanceTypes";

const RANK_COLORS = [
  {
    bg: "rgba(255,208,50,0.12)",
    border: "rgba(255,208,50,0.5)",
    glow: "rgba(255,208,50,0.3)",
  }, // gold
  {
    bg: "rgba(180,188,200,0.12)",
    border: "rgba(180,188,200,0.5)",
    glow: "rgba(180,188,200,0.3)",
  }, // silver
  {
    bg: "rgba(205,127,50,0.12)",
    border: "rgba(205,127,50,0.5)",
    glow: "rgba(205,127,50,0.3)",
  }, // bronze
];

// Slot color map for inspector grid
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
  return SLOT_COLORS[4]; // slot 49
}

function LeaderboardRow({
  entry,
  rank,
  onClick,
}: { entry: GStakerLeaderboardEntry; rank: number; onClick: () => void }) {
  const biomeColor = getBiomeColor(entry.topBiome);
  const rankStyle = rank <= 3 ? RANK_COLORS[rank - 1] : null;

  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.005] cursor-pointer text-left"
      style={{
        background: rankStyle ? rankStyle.bg : "rgba(255,255,255,0.03)",
        border: rankStyle
          ? `1px solid ${rankStyle.border}`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: rankStyle ? `0 0 16px ${rankStyle.glow}` : "none",
      }}
      data-ocid={`leaderboard.item.${rank}`}
      onClick={onClick}
    >
      {/* Rank */}
      <div
        className="w-7 font-orbitron font-bold text-sm text-center flex-shrink-0"
        style={{
          color: rankStyle
            ? rank === 1
              ? "#ffd032"
              : rank === 2
                ? "#b4bcc8"
                : "#cd7f32"
            : "rgba(255,255,255,0.25)",
        }}
      >
        {rank}
      </div>

      {/* Principal */}
      <div className="flex-1 min-w-0">
        <p className="font-jetbrains text-xs text-white/70 truncate">
          {shortenPrincipal(entry.principal.toString())}
        </p>
      </div>

      {/* Biome — hidden on portrait mobile */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: biomeColor,
            boxShadow: `0 0 6px ${biomeColor}`,
          }}
        />
        <span
          className="font-jetbrains text-[10px]"
          style={{ color: biomeColor }}
        >
          {entry.topBiome.replace("_", " ")}
        </span>
      </div>

      {/* Mods */}
      <div
        className="w-8 text-center font-jetbrains text-xs flex-shrink-0"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {entry.maxMods.toString()}
      </div>

      {/* Stake */}
      <div className="flex-shrink-0 text-right min-w-[60px]">
        <p className="font-orbitron text-xs font-bold text-white/80">
          {formatCBR(entry.stake)}
        </p>
        <p className="font-jetbrains text-[9px] text-white/25">CBR</p>
      </div>

      {/* Weight */}
      <div
        className="flex-shrink-0 text-right min-w-[44px]"
        style={{ color: biomeColor }}
      >
        <p className="font-orbitron text-xs font-bold">
          {formatWeight(entry.weight)}
        </p>
        <p className="font-jetbrains text-[9px] text-white/25">WGT</p>
      </div>
    </button>
  );
}

function InspectorModal({
  entry,
  onClose,
}: { entry: GStakerLeaderboardEntry; onClose: () => void }) {
  const biomeColor = getBiomeColor(entry.topBiome);
  const maxMods = Number(entry.maxMods);

  // Build 49-slot grid
  const slots = Array.from({ length: 49 }, (_, i) => ({
    index: i,
    filled: i < maxMods,
    color: getSlotColor(i),
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      {/* Backdrop click area */}
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
          outline: `1px solid ${biomeColor}40`,
          outlineOffset: "-1px",
          boxShadow: `0 0 40px ${biomeColor}30, 0 8px 32px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${biomeColor} 30%, ${biomeColor} 70%, transparent 100%)`,
            boxShadow: `0 0 8px ${biomeColor}`,
          }}
        />

        <div className="px-5 py-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <p
              className="font-orbitron font-black text-sm tracking-widest"
              style={{
                color: biomeColor,
                textShadow: `0 0 12px ${biomeColor}80`,
              }}
            >
              STAKER PROFILE
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
              data-ocid="leaderboard.inspector.close_button"
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
              PRINCIPAL
            </p>
            <p className="font-jetbrains text-xs text-white/70 break-all">
              {entry.principal.toString()}
            </p>
          </div>

          {/* Biome */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                background: biomeColor,
                boxShadow: `0 0 10px ${biomeColor}`,
              }}
            />
            <div>
              <p
                className="font-orbitron text-xs font-bold"
                style={{
                  color: biomeColor,
                  textShadow: `0 0 8px ${biomeColor}60`,
                }}
              >
                {entry.topBiome.replace(/_/g, " ")}
              </p>
              <p
                className="font-jetbrains text-[9px]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Top biome
              </p>
            </div>
          </div>

          {/* Lv. X/49 + grid */}
          <div className="mb-4">
            <p
              className="font-orbitron text-[10px] tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              MOD SLOTS
            </p>
            <p
              className="font-orbitron text-lg font-black mb-3"
              style={{
                color: biomeColor,
                textShadow: `0 0 12px ${biomeColor}60`,
              }}
            >
              Lv. {maxMods}/49
            </p>
            {/* 7×7 compact grid */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="font-orbitron text-[9px] tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                STAKE
              </p>
              <p className="font-orbitron text-sm font-bold text-white/80">
                {formatCBR(entry.stake)}
              </p>
              <p
                className="font-jetbrains text-[9px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                CBR
              </p>
            </div>
            <div
              className="rounded-xl px-3 py-2.5"
              style={{
                background: `${biomeColor}10`,
                border: `1px solid ${biomeColor}30`,
              }}
            >
              <p
                className="font-orbitron text-[9px] tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                WEIGHT
              </p>
              <p
                className="font-orbitron text-sm font-bold"
                style={{ color: biomeColor }}
              >
                {formatWeight(entry.weight)}
              </p>
              <p
                className="font-jetbrains text-[9px]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                voting power
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeaderboardTab() {
  const { data: entries = [], isLoading } = useGetLeaderboard(BigInt(50));
  const [inspectedEntry, setInspectedEntry] =
    useState<GStakerLeaderboardEntry | null>(null);

  return (
    <>
      <div
        className="flex flex-col gap-3"
        style={{ animation: "govCardIn 0.2s ease-out forwards" }}
      >
        {/* Title */}
        <p
          className="font-orbitron font-bold text-sm tracking-widest"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          STAKING LEADERBOARD
        </p>

        {/* Column headers */}
        <div
          className="flex items-center gap-3 px-4 py-2"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-7 font-orbitron text-[9px] tracking-widest text-white/25">
            #
          </div>
          <div className="flex-1 font-orbitron text-[9px] tracking-widest text-white/25">
            PRINCIPAL
          </div>
          <div className="hidden sm:block w-20 font-orbitron text-[9px] tracking-widest text-white/25">
            BIOME
          </div>
          <div className="w-8 font-orbitron text-[9px] tracking-widest text-white/25 text-center">
            MODS
          </div>
          <div className="min-w-[60px] font-orbitron text-[9px] tracking-widest text-white/25 text-right">
            STAKE
          </div>
          <div className="min-w-[44px] font-orbitron text-[9px] tracking-widest text-white/25 text-right">
            WGT
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className="flex justify-center py-10"
            data-ocid="leaderboard.loading_state"
          >
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-yellow-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && entries.length === 0 && (
          <div
            className="flex flex-col items-center gap-3 py-10 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            data-ocid="leaderboard.empty_state"
          >
            <p className="font-orbitron text-sm text-white/25 tracking-wider">
              NO STAKERS YET
            </p>
          </div>
        )}

        {/* Rows */}
        {entries.map((entry, i) => (
          <LeaderboardRow
            key={entry.principal.toString()}
            entry={entry}
            rank={i + 1}
            onClick={() => setInspectedEntry(entry)}
          />
        ))}
      </div>

      {/* Inspector Modal */}
      {inspectedEntry && (
        <InspectorModal
          entry={inspectedEntry}
          onClose={() => setInspectedEntry(null)}
        />
      )}
    </>
  );
}
