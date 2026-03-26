import React, { useRef } from "react";
import { TechnicalDetails } from "./TechnicalDetails";

// ─── Constants ────────────────────────────────────────────────────────────────────────────────────

const BIOMES = [
  { name: "Forest Valley", tier: "Common", mult: "×1.0", color: "#4ade80" },
  {
    name: "Island Archipelago",
    tier: "Common",
    mult: "×1.0",
    color: "#22d3ee",
  },
  { name: "Snow Peak", tier: "Rare", mult: "×1.2", color: "#60a5fa" },
  { name: "Desert Dune", tier: "Rare", mult: "×1.2", color: "#f59e0b" },
  { name: "Volcanic Crag", tier: "Rare", mult: "×1.2", color: "#f87171" },
  { name: "Mythic Void", tier: "Mythic", mult: "×1.5", color: "#a855f7" },
  { name: "Mythic Aether", tier: "Mythic", mult: "×1.5", color: "#cc44ff" },
];

// Correct tier structure: Common / Rare / Legendary / Mythic / Keeper
const RARITY_BADGES = [
  { label: "Common", color: "#9CA3AF", slots: "Slots 1–15 · 15 mods" },
  { label: "Rare", color: "#60A5FA", slots: "Slots 16–30 · 15 mods" },
  { label: "Legendary", color: "#A855F7", slots: "Slots 31–42 · 12 mods" },
  { label: "Mythic", color: "#FACC15", slots: "Slots 43–48 · 6 mods" },
  { label: "Keeper", color: "#cc44ff", slots: "Slot 49 · Region-bound" },
];

// Full 49-slot grid: all slots colored by their tier
const GRID_CELLS = [
  ...Array.from({ length: 15 }, (_, i) => ({
    key: `c${i}`,
    color: "#9CA3AF",
    tier: 1,
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    key: `r${i}`,
    color: "#60A5FA",
    tier: 2,
  })),
  ...Array.from({ length: 12 }, (_, i) => ({
    key: `l${i}`,
    color: "#A855F7",
    tier: 3,
  })),
  ...Array.from({ length: 6 }, (_, i) => ({
    key: `m${i}`,
    color: "#FACC15",
    tier: 4,
  })),
  { key: "keeper", color: "#cc44ff", tier: 5 },
];

const MOD_BASE =
  "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Mods/";

// Sample mods: ids 15, 30, 37, 42, 47, 48
const SAMPLE_MODS = [
  { img: "modifier_15.webp", name: "GLDT", rarity: "Common", color: "#9CA3AF" },
  {
    img: "modifier_30.webp",
    name: "TabbyPOS",
    rarity: "Rare",
    color: "#60A5FA",
  },
  {
    img: "modifier_37.webp",
    name: "TokoApp",
    rarity: "Legendary",
    color: "#A855F7",
  },
  {
    img: "modifier_42.webp",
    name: "ICPanda",
    rarity: "Legendary",
    color: "#A855F7",
  },
  {
    img: "modifier_47.webp",
    name: "caffeine",
    rarity: "Mythic",
    color: "#FACC15",
  },
  {
    img: "modifier_48.webp",
    name: "InternetComputer",
    rarity: "Mythic",
    color: "#FACC15",
  },
];

const CACHE_TYPES = [
  {
    img: "/assets/uploads/common_cache-3.webp",
    label: "COMMON CACHE",
    cost: "CBR cost: Low",
    reward: "Common mods",
    glowColor: "#9CA3AF",
  },
  {
    img: "/assets/uploads/rare_cache-1.webp",
    label: "RARE CACHE",
    cost: "CBR cost: Medium",
    reward: "Common & Rare mods",
    glowColor: "#60a5fa",
  },
  {
    img: "/assets/uploads/legendary_cache-2.webp",
    label: "LEGENDARY CACHE",
    cost: "CBR cost: High",
    reward: "Rare, Legendary & Mythic mods",
    glowColor: "#FACC15",
  },
];

const ECONOMY_NODES = [
  { label: "DAILY CLAIM", color: "#00e5ff", sub: "" },
  { label: "SPEND", color: "#ffd060", sub: "caches · marketplace" },
  { label: "FEES COLLECTED", color: "#00ff88", sub: "" },
];

const INCOME_SPLITS = [
  { label: "40% STAKERS", color: "#a855f7" },
  { label: "25% TREASURY", color: "#60a5fa" },
  { label: "15% DEV", color: "#00ff88" },
  { label: "20% BURN", color: "#f87171" },
];

const NAV_ITEMS = [
  { label: "LAND NFT", id: "guide-land" },
  { label: "MODS", id: "guide-mods" },
  { label: "CACHES", id: "guide-caches" },
  { label: "CBR TOKEN", id: "guide-cbr" },
  { label: "MARKETPLACE", id: "guide-marketplace" },
  { label: "GOVERNANCE", id: "guide-governance" },
  { label: "TECH", id: "guide-tech" },
];

// ─── Reusable card shell ─────────────────────────────────────────────────────────────────────────

function SectionCard({
  id,
  accent,
  children,
}: {
  id: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        outline: `1px solid ${accent}30`,
        outlineOffset: "-1px",
        boxShadow: `0 0 20px ${accent}15, 0 4px 24px rgba(0,0,0,0.6)`,
        animation: "govCardIn 0.25s ease-out forwards",
        scrollMarginTop: "80px",
        transform: "translateZ(0)",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: "2px",
          background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
          boxShadow: `0 0 8px ${accent}`,
        }}
      />
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  accent,
}: {
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div className="mb-4">
      <h2
        className="font-orbitron font-black text-2xl tracking-widest mb-1"
        style={{ color: accent, textShadow: `0 0 24px ${accent}80` }}
      >
        {title}
      </h2>
      <p
        className="font-jetbrains text-xs tracking-wider"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ─── Main Guide component ──────────────────────────────────────────────────────────────────────

export default function Guide() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="min-h-screen w-full"
      ref={containerRef}
      style={{ background: "transparent" }}
    >
      <style>{`
        @keyframes govCardIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <h1
          className="font-orbitron font-black text-2xl md:text-3xl tracking-widest mb-1"
          style={{ color: "#cc44ff", textShadow: "0 0 24px #cc44ff80" }}
        >
          GUIDE
        </h1>
        <p
          className="font-jetbrains text-xs tracking-wider"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Everything you need to know about CyberGenesis
        </p>
      </div>

      {/* Sticky anchor nav */}
      <div
        className="sticky top-0 z-20 px-4 mb-6"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,0,12,0.97) 80%, transparent 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          className="flex gap-1.5 py-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl font-orbitron text-[10px] font-bold tracking-wider transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.55)",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content sections */}
      <div className="px-4 pb-10 flex flex-col gap-5">
        {/* ── 1. LAND NFT ────────────────────────────────────────── */}
        <SectionCard id="guide-land" accent="#cc44ff">
          <div className="relative px-5 py-5 overflow-hidden">
            <img
              src="/assets/uploads/mythic.WEBP"
              alt=""
              aria-hidden="true"
              className="absolute inset-y-0 right-0 h-full w-1/2"
              style={{
                objectFit: "contain",
                objectPosition: "right center",
                opacity: 0.18,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
            {/* Full-width content — equal padding both sides */}
            <div className="relative z-10">
              <SectionTitle
                title="LAND NFT"
                subtitle="The Core Asset of CyberGenesis"
                accent="#cc44ff"
              />
              <p
                className="font-jetbrains text-sm leading-relaxed mb-4"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Each LAND is a unique on-chain plot permanently bound to your
                Internet Identity principal. There are 7 biomes across 3 rarity
                tiers — each with its own staking multiplier:
              </p>

              {/* Biome table — full width, equal padding */}
              <div className="flex flex-col gap-1 mb-5">
                {BIOMES.map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center gap-3 py-1.5 px-3 rounded-lg"
                    style={{
                      background: `${b.color}08`,
                      border: `1px solid ${b.color}20`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: b.color,
                        boxShadow: `0 0 6px ${b.color}`,
                      }}
                    />
                    <span
                      className="font-jetbrains text-xs flex-1 min-w-0"
                      style={{ color: b.color }}
                    >
                      {b.name}
                    </span>
                    <span
                      className="font-jetbrains text-[10px] px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: `${b.color}18`,
                        color: b.color,
                        border: `1px solid ${b.color}30`,
                        minWidth: "64px",
                        textAlign: "left",
                      }}
                    >
                      {b.tier}
                    </span>
                    <span
                      className="font-orbitron text-xs font-bold flex-shrink-0"
                      style={{
                        color: b.color,
                        textShadow: `0 0 8px ${b.color}80`,
                        minWidth: "36px",
                        textAlign: "right",
                      }}
                    >
                      {b.mult}
                    </span>
                  </div>
                ))}
              </div>

              {/* Composable callout */}
              <div
                className="rounded-xl px-4 py-4"
                style={{
                  background: "rgba(204,68,255,0.08)",
                  border: "1px solid #cc44ff60",
                  boxShadow: "0 0 16px #cc44ff18",
                }}
              >
                <p
                  className="font-orbitron text-xs font-bold tracking-widest mb-2"
                  style={{ color: "#cc44ff", textShadow: "0 0 10px #cc44ff80" }}
                >
                  COMPOSABLE NFT — UNIQUE IN THE METAVERSE
                </p>
                <p
                  className="font-jetbrains text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  Unlike standard NFTs that are just images with an ID, each
                  LAND has{" "}
                  <span style={{ color: "#cc44ff" }}>49 live mod slots</span>{" "}
                  encoded on-chain. Modifiers are real independent objects you
                  can install, remove, buy or sell at any time. The land
                  evolves. This architecture —{" "}
                  <code
                    className="px-1.5 py-0.5 rounded text-[11px]"
                    style={{
                      background: "rgba(204,68,255,0.15)",
                      color: "#cc44ff",
                      fontFamily: "JetBrains Mono, monospace",
                    }}
                  >
                    LAND ID → MODS [slot…01…slot…49]
                  </code>{" "}
                  — does not exist anywhere else in the metaverse.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. MODS ─────────────────────────────────────────────── */}
        <SectionCard id="guide-mods" accent="#ffd060">
          <div className="relative px-5 py-5 overflow-hidden">
            <img
              src="/assets/uploads/forest_valley.WEBP"
              alt=""
              aria-hidden="true"
              className="absolute inset-y-0 left-0 h-full w-1/3"
              style={{
                objectFit: "contain",
                objectPosition: "left center",
                opacity: 0.15,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
            <div className="relative z-10">
              <SectionTitle
                title="MODIFIERS"
                subtitle="48 + 7 Keeper · On-Chain Objects"
                accent="#ffd060"
              />
              <p
                className="font-jetbrains text-sm leading-relaxed mb-5"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                48 modifiers across 4 rarity tiers + 1 exclusive Keeper per
                region. Each mod is a real on-chain asset — not metadata.
                Install up to{" "}
                <span style={{ color: "#ffd060" }}>49 mods per LAND</span>,
                increasing its staking weight and marketplace value.
              </p>

              {/* Rarity badges — correct tier names */}
              <div className="flex flex-wrap gap-2 mb-5">
                {RARITY_BADGES.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{
                      background: `${r.color}14`,
                      border: `1px solid ${r.color}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: r.color,
                        boxShadow: `0 0 6px ${r.color}`,
                      }}
                    />
                    <span
                      className="font-orbitron text-[10px] font-bold tracking-wider"
                      style={{ color: r.color }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="font-jetbrains text-[9px]"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {r.slots}
                    </span>
                  </div>
                ))}
              </div>

              {/* 7×7 grid — all 49 slots colored by tier */}
              <div className="mb-5">
                <p
                  className="font-orbitron text-[10px] tracking-widest mb-2"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  MOD SLOTS — 49 per LAND
                </p>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: "repeat(7, 28px)" }}
                >
                  {GRID_CELLS.map((cell) => (
                    <div
                      key={cell.key}
                      className="rounded-sm"
                      style={{
                        width: "28px",
                        height: "28px",
                        background: `${cell.color}28`,
                        border: `1px solid ${cell.color}60`,
                        boxShadow:
                          cell.tier >= 4 ? `0 0 5px ${cell.color}60` : "none",
                      }}
                    />
                  ))}
                </div>
                {/* Tier legend */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {RARITY_BADGES.map((r) => (
                    <div key={r.label} className="flex items-center gap-1">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 2,
                          background: `${r.color}28`,
                          border: `1px solid ${r.color}60`,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          color: r.color,
                        }}
                      >
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample mod cards — ids 15, 30, 37, 42, 47, 48 */}
              <div className="flex gap-3 mb-5 flex-wrap">
                {SAMPLE_MODS.map((m) => (
                  <div
                    key={m.name}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{
                        width: "58px",
                        height: "58px",
                        border: `1px solid ${m.color}60`,
                        boxShadow: `0 0 10px ${m.color}40`,
                        background: "rgba(0,0,0,0.5)",
                      }}
                    >
                      <img
                        src={`${MOD_BASE}${m.img}`}
                        alt={m.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <span
                      className="font-orbitron text-[8px] font-bold tracking-wider"
                      style={{ color: m.color }}
                    >
                      {m.rarity}
                    </span>
                    <span
                      className="font-jetbrains text-[9px]"
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        textAlign: "center",
                      }}
                    >
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,208,96,0.06)",
                  border: "1px solid rgba(255,208,96,0.25)",
                }}
              >
                <p
                  className="font-jetbrains text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  The more mods installed on your best land, the higher your
                  staking weight in Governance. Keeper (slot 49) is crafted and
                  region-bound. Install it only on the matching biome LAND.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 3. CACHES ────────────────────────────────────────────── */}
        <SectionCard id="guide-caches" accent="#00ff88">
          <div className="px-5 py-5">
            <SectionTitle
              title="CACHES"
              subtitle="Open. Discover. Earn."
              accent="#00ff88"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {CACHE_TYPES.map((c) => (
                <div
                  key={c.label}
                  className="flex flex-col rounded-xl overflow-hidden"
                  style={{
                    background: "rgba(0,0,0,0.45)",
                    border: `1px solid ${c.glowColor}40`,
                    boxShadow: `0 0 16px ${c.glowColor}18`,
                  }}
                >
                  <div
                    className="flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <img
                      src={c.img}
                      alt={c.label}
                      style={{
                        width: "80px",
                        height: "80px",
                        objectFit: "contain",
                        filter: `drop-shadow(0 0 8px ${c.glowColor}80)`,
                      }}
                    />
                  </div>
                  <div className="px-3 py-3 flex-1">
                    <p
                      className="font-orbitron text-[10px] font-bold tracking-widest mb-1"
                      style={{
                        color: c.glowColor,
                        textShadow: `0 0 8px ${c.glowColor}80`,
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="font-jetbrains text-xs mb-0.5"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {c.cost}
                    </p>
                    <p
                      className="font-jetbrains text-xs"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {c.reward}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(0,255,136,0.05)",
                border: "1px solid rgba(0,255,136,0.2)",
              }}
            >
              <p
                className="font-jetbrains text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                A share of every cache opening fee flows to stakers and treasury
                — keeping the economy sustainable.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── 4. CBR TOKEN ──────────────────────────────────────────── */}
        <SectionCard id="guide-cbr" accent="#00e5ff">
          <div className="px-5 py-5">
            <SectionTitle
              title="CBR TOKEN"
              subtitle="The CyberGenesis Economy"
              accent="#00e5ff"
            />

            <div
              className="rounded-xl px-4 py-4 mb-5 text-center"
              style={{
                background: "rgba(0,229,255,0.08)",
                border: "1px solid #00e5ff50",
                boxShadow: "0 0 20px #00e5ff18",
              }}
            >
              <p
                className="font-orbitron font-black text-lg tracking-widest mb-1"
                style={{ color: "#00e5ff", textShadow: "0 0 16px #00e5ff80" }}
              >
                100 CBR FREE DAILY
              </p>
              <p
                className="font-jetbrains text-xs"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Log in and claim every day to build your balance.
              </p>
            </div>

            <p
              className="font-orbitron text-[10px] tracking-widest mb-2"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              CBR USES
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {[
                "Open Caches",
                "Buy Lands & Mods on the Marketplace",
                "Stake in Governance to earn protocol income",
              ].map((use) => (
                <div key={use} className="flex items-center gap-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: "#00e5ff",
                      boxShadow: "0 0 6px #00e5ff",
                    }}
                  />
                  <span
                    className="font-jetbrains text-sm"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {use}
                  </span>
                </div>
              ))}
            </div>

            <p
              className="font-orbitron text-[10px] tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ECONOMY FLOW
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {ECONOMY_NODES.map((n, i) => (
                <React.Fragment key={n.label}>
                  <div
                    className="flex flex-col items-center px-3 py-1.5 rounded-xl"
                    style={{
                      background: `${n.color}12`,
                      border: `1px solid ${n.color}40`,
                    }}
                  >
                    <span
                      className="font-orbitron text-[9px] font-bold tracking-wider"
                      style={{ color: n.color }}
                    >
                      {n.label}
                    </span>
                    {n.sub && (
                      <span
                        className="font-jetbrains text-[8px] mt-0.5"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {n.sub}
                      </span>
                    )}
                  </div>
                  {i < ECONOMY_NODES.length - 1 && (
                    <span
                      className="font-jetbrains text-xs"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    >
                      →
                    </span>
                  )}
                </React.Fragment>
              ))}
              <span
                className="font-jetbrains text-xs"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                → SPLIT:
              </span>
              {INCOME_SPLITS.map((s) => (
                <div
                  key={s.label}
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: `${s.color}12`,
                    border: `1px solid ${s.color}40`,
                  }}
                >
                  <span
                    className="font-orbitron text-[9px] font-bold"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(0,229,255,0.04)",
                border: "1px solid rgba(0,229,255,0.15)",
              }}
            >
              <p
                className="font-jetbrains text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                30% of treasury returns monthly to the daily claim pool —
                keeping the economy self-sustaining.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── 5. MARKETPLACE ────────────────────────────────────────── */}
        <SectionCard id="guide-marketplace" accent="#60a5fa">
          <div className="px-5 py-5">
            <SectionTitle
              title="MARKETPLACE"
              subtitle="Trade Lands & Modifiers"
              accent="#60a5fa"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p
                  className="font-orbitron text-xs font-bold tracking-widest mb-3"
                  style={{ color: "#60a5fa", textShadow: "0 0 8px #60a5fa80" }}
                >
                  HOW TO BUY
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    "Browse Lands or Mods tabs",
                    "Use filters: biome, rarity, price range",
                    "Click a listing to inspect",
                    "Confirm purchase with CBR",
                  ].map((step, i) => (
                    <div key={step} className="flex items-start gap-3">
                      <span
                        className="font-orbitron text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: "rgba(96,165,250,0.15)",
                          border: "1px solid rgba(96,165,250,0.4)",
                          color: "#60a5fa",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="font-jetbrains text-sm"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p
                  className="font-orbitron text-xs font-bold tracking-widest mb-3"
                  style={{ color: "#60a5fa", textShadow: "0 0 8px #60a5fa80" }}
                >
                  HOW TO SELL
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    "Go to Marketplace → click SELL",
                    "Select your land or mod",
                    "Set your price in CBR",
                    "Listing goes live instantly",
                  ].map((step, i) => (
                    <div key={step} className="flex items-start gap-3">
                      <span
                        className="font-orbitron text-[10px] font-bold flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: "rgba(96,165,250,0.15)",
                          border: "1px solid rgba(96,165,250,0.4)",
                          color: "#60a5fa",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="font-jetbrains text-sm"
                        style={{ color: "rgba(255,255,255,0.65)" }}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(96,165,250,0.05)",
                  border: "1px solid rgba(96,165,250,0.2)",
                }}
              >
                <p
                  className="font-jetbrains text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  3% fee on every trade funds the staking reward pool and
                  treasury.
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-jetbrains text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Click the principal icon on any listing to view all items from
                  that seller.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 6. GOVERNANCE ────────────────────────────────────────── */}
        <SectionCard id="guide-governance" accent="#a855f7">
          <div className="relative px-5 py-5 overflow-hidden">
            <img
              src="/assets/uploads/volcanic_crag.WEBP"
              alt=""
              aria-hidden="true"
              className="absolute inset-y-0 right-0 h-full w-1/3"
              style={{
                objectFit: "contain",
                objectPosition: "right center",
                opacity: 0.18,
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
            <div className="relative z-10">
              <SectionTitle
                title="GOVERNANCE"
                subtitle="Lite DAO — Stake. Vote. Earn."
                accent="#a855f7"
              />

              {/* Weight formula */}
              <div
                className="rounded-xl px-4 py-4 mb-5"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(168,85,247,0.3)",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                <p
                  className="text-xs mb-3"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  <span style={{ color: "#a855f7" }}>Weight</span> = Stake ×
                  Biome Multiplier × Mod Multiplier
                </p>
                <div
                  style={{
                    height: "1px",
                    background: "rgba(168,85,247,0.15)",
                    marginBottom: "12px",
                  }}
                />
                <p
                  className="text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Biome Multiplier:{" "}
                  <span style={{ color: "#4ade80" }}>Common ×1.0</span>
                  {" | "}
                  <span style={{ color: "#60a5fa" }}>Rare ×1.2</span>
                  {" | "}
                  <span style={{ color: "#cc44ff" }}>Mythic ×1.5</span>
                </p>
                <p
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Mod Multiplier:{" "}
                  <span style={{ color: "#ffd060" }}>
                    1.0 + (mods on best land / 49) × 0.5
                  </span>
                </p>
              </div>

              {/* Income distribution */}
              <p
                className="font-orbitron text-[10px] tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                PROTOCOL INCOME DISTRIBUTION
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {INCOME_SPLITS.map((s) => (
                  <div
                    key={s.label}
                    className="px-4 py-2 rounded-xl flex flex-col items-center"
                    style={{
                      background: `${s.color}15`,
                      border: `1px solid ${s.color}50`,
                      boxShadow: `0 0 10px ${s.color}20`,
                    }}
                  >
                    <span
                      className="font-orbitron text-xs font-black"
                      style={{
                        color: s.color,
                        textShadow: `0 0 8px ${s.color}80`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Key rules */}
              <div className="flex flex-col gap-2 mb-5">
                {[
                  { label: "LOCK PERIOD", value: "14 days" },
                  {
                    label: "REWARD VESTING",
                    value: "7 days linear after claim",
                  },
                  {
                    label: "VOTING CATEGORIES",
                    value: "Treasury · Partnership · Roadmap",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl"
                    style={{
                      background: "rgba(168,85,247,0.06)",
                      border: "1px solid rgba(168,85,247,0.18)",
                    }}
                  >
                    <span
                      className="font-orbitron text-[10px] font-bold tracking-wider"
                      style={{ color: "rgba(168,85,247,0.8)" }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="font-jetbrains text-xs"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Advisory disclaimer */}
              <div
                className="rounded-xl px-4 py-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  className="font-jetbrains text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Voting results are advisory. Visual design, game mechanics,
                  and core rules are set by the development team.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 7. TECHNICAL DETAILS ─────────────────────────────────────── */}
        <TechnicalDetails />
      </div>
    </div>
  );
}
