import { motion } from "motion/react";
import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const BIOMES = [
  {
    name: "Forest Valley",
    img: "/assets/uploads/land_forest_valley.webp",
    color: "#4ade80",
    rarity: "COMMON",
  },
  {
    name: "Island Archipelago",
    img: "/assets/uploads/land_island_archipelago.webp",
    color: "#22d3ee",
    rarity: "COMMON",
  },
  {
    name: "Snow Peak",
    img: "/assets/uploads/land_snow_peak.webp",
    color: "#60a5fa",
    rarity: "RARE",
  },
  {
    name: "Desert Dune",
    img: "/assets/uploads/land_desert_dune.webp",
    color: "#f59e0b",
    rarity: "RARE",
  },
  {
    name: "Volcanic Crag",
    img: "/assets/uploads/land_volcanic_crag.webp",
    color: "#f87171",
    rarity: "RARE",
  },
  {
    name: "Mythic Void",
    img: "/assets/uploads/land_mythic_void.webp",
    color: "#a855f7",
    rarity: "MYTHIC",
  },
  {
    name: "Mythic Aether",
    img: "/assets/uploads/land_mythic_aether.webp",
    color: "#cc44ff",
    rarity: "MYTHIC",
  },
];

const MOD_BASE =
  "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Mods/";

const FEATURED_MODS = [
  {
    id: 42,
    name: "ICPanda",
    img: `${MOD_BASE}modifier_42.webp`,
    tier: "LEGENDARY",
    color: "#a855f7",
  },
  {
    id: 45,
    name: "ICP",
    img: `${MOD_BASE}modifier_45.webp`,
    tier: "MYTHIC",
    color: "#facc15",
  },
  {
    id: 48,
    name: "InternetComputer",
    img: `${MOD_BASE}modifier_48.webp`,
    tier: "MYTHIC",
    color: "#facc15",
  },
  {
    id: 40,
    name: "Dragginz",
    img: `${MOD_BASE}modifier_40.webp`,
    tier: "LEGENDARY",
    color: "#a855f7",
  },
  {
    id: 47,
    name: "Caffeine",
    img: `${MOD_BASE}modifier_47.webp`,
    tier: "MYTHIC",
    color: "#facc15",
  },
  {
    id: 34,
    name: "OpenChat",
    img: `${MOD_BASE}modifier_34.webp`,
    tier: "LEGENDARY",
    color: "#a855f7",
  },
];

const ECOSYSTEM = [
  {
    icon: "◈",
    title: "CBR TOKEN",
    desc: "Native utility token powering the entire CyberGenesis economy.",
    color: "#facc15",
  },
  {
    icon: "⬡",
    title: "STAKING",
    desc: "Lock CBR to earn rewards and amplify your governance weight.",
    color: "#22d3ee",
  },
  {
    icon: "◎",
    title: "MARKETPLACE",
    desc: "Trade Land NFTs and Mods. Set prices, browse listings, own the economy.",
    color: "#4ade80",
  },
  {
    icon: "◇",
    title: "LITE DAO",
    desc: "Advisory voting with CBR stake weight. Core decisions remain with developers — community shapes the direction.",
    color: "#a855f7",
  },
];

function ConnectButton({
  onClick,
  disabled,
  isLoggingIn,
  ocid,
  label,
  fullWidth,
}: {
  onClick: () => void;
  disabled: boolean;
  isLoggingIn: boolean;
  ocid: string;
  label: string;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      disabled={disabled}
      className={`${
        fullWidth ? "w-full" : ""
      } font-orbitron font-bold tracking-widest text-cyan-300 rounded-xl px-6 py-4 text-sm sm:text-base transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
      style={{
        background: hovered
          ? "linear-gradient(135deg, #1a5a80 0%, #2a1a8a 50%, #4a1580 100%)"
          : "linear-gradient(135deg, #0d3d5c 0%, #1a1060 50%, #2d0a5c 100%)",
        border: "2px solid rgba(6,182,212,0.9)",
        boxShadow: hovered
          ? "0 0 50px rgba(6,182,212,0.7), 0 0 100px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 30px rgba(6,182,212,0.5), 0 0 60px rgba(168,85,247,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {isLoggingIn ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          CONNECTING...
        </span>
      ) : (
        <span className="flex items-center justify-center gap-3">
          <span className="text-xl">⬡</span>
          <span>{label}</span>
          <span className="opacity-60">→</span>
        </span>
      )}
    </button>
  );
}

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setLoginError(null);
      await login();
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const msg = error instanceof Error ? error.message : "";
      if (msg === "User is already authenticated") {
        setLoginError("Already connected via Internet Identity.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ background: "#070B14" }}
    >
      {/* Subtle ambient glows — CSS only, no animated components */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[300px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-0 right-1/4 w-[400px] h-[250px] translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-1/3 left-1/2 w-[600px] h-[200px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse, rgba(119,0,255,0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        {/* ══════════════════════ HERO ══════════════════════ */}
        <section className="pt-12 pb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 flex justify-center"
          >
            <img
              src="/assets/uploads/img_0846-019d3991-0be5-70ad-9d85-314a84b5780c-1.webp"
              alt="CyberGenesis Logo"
              className="w-28 h-auto sm:w-36 object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 18px rgba(168,85,247,0.55)) drop-shadow(0 0 36px rgba(0,255,255,0.25))",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-orbitron font-black tracking-[0.12em] leading-tight mb-3 text-3xl sm:text-4xl md:text-6xl lg:text-7xl"
            style={{
              background:
                "linear-gradient(135deg, #00ffff 0%, #00aaff 30%, #7700ff 65%, #ff00cc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter:
                "drop-shadow(0 0 50px rgba(0,255,255,0.6)) drop-shadow(0 0 100px rgba(119,0,255,0.4))",
            }}
          >
            GENESIS CYBERLAND
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-jetbrains text-sm sm:text-base text-slate-300 max-w-md mb-2"
          >
            Claim your first{" "}
            <span className="text-cyan-300 font-bold">COMPOSABLE LAND NFT</span>
            .
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="font-jetbrains text-xs text-slate-500 max-w-sm mb-7"
          >
            Install 48 Mods + 7 Keepers · Trade on Marketplace · Stake &amp;
            Govern on ICP
          </motion.p>

          {/* ── CONNECT BUTTON ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col items-center gap-2 w-full max-w-xs sm:max-w-sm"
          >
            <ConnectButton
              onClick={handleLogin}
              disabled={isLoggingIn}
              isLoggingIn={isLoggingIn}
              ocid="landing.primary_button"
              label="CONNECT &amp; PLAY"
              fullWidth
            />

            <p className="font-jetbrains text-[10px] text-slate-600">
              Secured by Internet Computer · Zero gas fees
            </p>

            {loginError && (
              <div
                className="px-4 py-2 rounded-lg mt-1"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.35)",
                }}
              >
                <p className="text-red-400 font-jetbrains text-xs">
                  {loginError}
                </p>
              </div>
            )}
          </motion.div>
        </section>

        {/* ══════════════════════ COMPOSABLE LAND NFT ══════════════════════ */}
        <section className="pb-8">
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 50%, rgba(8,13,24,1) 100%)",
              border: "1px solid rgba(6,182,212,0.5)",
              borderTop: "3px solid #06b6d4",
              boxShadow: "0 0 24px rgba(6,182,212,0.12)",
            }}
          >
            <div
              className="px-4 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(6,182,212,0.15)" }}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="font-orbitron font-bold text-cyan-300 text-base md:text-lg tracking-widest flex items-center gap-2"
              >
                <span
                  style={{
                    color: "#06b6d4",
                    filter: "drop-shadow(0 0 6px #06b6d4)",
                  }}
                >
                  ◆
                </span>
                COMPOSABLE LAND NFT
              </motion.h2>
            </div>
            <div className="px-4 py-3">
              <p className="font-jetbrains text-slate-300 text-xs leading-relaxed">
                Each Land is a unique on-chain territory — not just an image.
                It&apos;s a{" "}
                <span className="text-cyan-300">composable object</span> with 49
                mod slots. Install characters, protocols, and structures. Your
                Land evolves.
              </p>
            </div>
          </div>

          {/* Biome grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-3">
            {BIOMES.map((biome, i) => (
              <motion.div
                key={biome.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-xl overflow-hidden cursor-pointer flex flex-col"
                style={{
                  background: "#080D18",
                  border: `1px solid ${biome.color}35`,
                }}
                whileHover={{
                  boxShadow: `0 0 14px ${biome.color}40`,
                  scale: 1.03,
                }}
              >
                <div className="w-full h-32 overflow-hidden flex-shrink-0 bg-black/20">
                  <img
                    src={biome.img}
                    alt={biome.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-2 flex flex-col gap-1">
                  <p
                    className="font-orbitron text-[9px] sm:text-[10px] font-bold truncate leading-tight"
                    style={{ color: biome.color }}
                  >
                    {biome.name.toUpperCase()}
                  </p>
                  <span
                    className="inline-block px-1.5 py-0.5 rounded font-jetbrains text-[8px] font-bold self-start"
                    style={{
                      background: `${biome.color}18`,
                      border: `1px solid ${biome.color}44`,
                      color: biome.color,
                    }}
                  >
                    {biome.rarity}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════ MODIFIERS ══════════════════════ */}
        <section className="pb-8">
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.04) 50%, rgba(8,13,24,1) 100%)",
              border: "1px solid rgba(168,85,247,0.5)",
              borderTop: "3px solid #a855f7",
              boxShadow: "0 0 24px rgba(168,85,247,0.12)",
            }}
          >
            <div
              className="px-4 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(168,85,247,0.15)" }}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="font-orbitron font-bold text-purple-300 text-base md:text-lg tracking-widest flex items-center gap-2"
              >
                <span
                  style={{
                    color: "#a855f7",
                    filter: "drop-shadow(0 0 6px #a855f7)",
                  }}
                >
                  ◆
                </span>
                48 MODS + 7 KEEPERS
              </motion.h2>
            </div>
            <div className="px-4 py-3">
              <p className="font-jetbrains text-slate-300 text-xs leading-relaxed">
                Each Modifier is an{" "}
                <span className="text-purple-300">independent NFT</span> — ICP
                ecosystem protocols, characters and objects. Install on Land,
                swap between lands, or sell on the marketplace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
            {FEATURED_MODS.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{
                  background: "#080D18",
                  border: `1px solid ${mod.color}35`,
                }}
                whileHover={{
                  scale: 1.06,
                  boxShadow: `0 0 14px ${mod.color}45, 0 0 28px ${mod.color}18`,
                }}
              >
                <div className="w-full aspect-square overflow-hidden bg-black/20">
                  <img
                    src={mod.img}
                    alt={mod.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-2">
                  <p
                    className="font-orbitron text-[9px] font-bold truncate leading-tight mb-0.5"
                    style={{ color: mod.color }}
                  >
                    #{mod.id} {mod.name.toUpperCase()}
                  </p>
                  <span
                    className="inline-block px-1 py-0.5 rounded font-jetbrains text-[8px] font-bold"
                    style={{
                      background: `${mod.color}18`,
                      border: `1px solid ${mod.color}40`,
                      color: mod.color,
                    }}
                  >
                    {mod.tier}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════ ECOSYSTEM ══════════════════════ */}
        <section className="pb-8">
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 50%, rgba(8,13,24,1) 100%)",
              border: "1px solid rgba(245,158,11,0.5)",
              borderTop: "3px solid #f59e0b",
              boxShadow: "0 0 24px rgba(245,158,11,0.12)",
            }}
          >
            <div
              className="px-4 pt-4 pb-3"
              style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}
            >
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="font-orbitron font-bold text-amber-300 text-base md:text-lg tracking-widest flex items-center gap-2"
              >
                <span
                  style={{
                    color: "#f59e0b",
                    filter: "drop-shadow(0 0 6px #f59e0b)",
                  }}
                >
                  ◆
                </span>
                THE ECOSYSTEM
              </motion.h2>
            </div>
            <div className="px-4 py-3">
              <p className="font-jetbrains text-slate-300 text-xs">
                Not just a Land. A full on-chain economy inside one metaverse.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {ECOSYSTEM.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="rounded-xl p-3 md:p-4 flex flex-col gap-2"
                style={{
                  background: "#080D18",
                  border: `1px solid ${item.color}28`,
                }}
                whileHover={{ boxShadow: `0 0 16px ${item.color}30` }}
              >
                <span
                  className="text-2xl leading-none"
                  style={{ filter: `drop-shadow(0 0 8px ${item.color}80)` }}
                >
                  {item.icon}
                </span>
                <h3
                  className="font-orbitron font-bold text-xs tracking-widest"
                  style={{ color: item.color }}
                >
                  {item.title}
                </h3>
                <p className="font-jetbrains text-slate-400 text-[10px] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════ FOOTER CTA ══════════════════════ */}
        <section
          className="pb-10 pt-2 flex flex-col items-center gap-4"
          style={{ borderTop: "1px solid rgba(6,182,212,0.12)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center pt-8 w-full flex flex-col items-center"
          >
            <h2 className="font-orbitron font-bold text-xl md:text-2xl text-white mb-2 tracking-wide">
              Ready to claim your{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #00ffff, #7700ff, #ff00cc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Genesis Land?
              </span>
            </h2>
            <p className="font-jetbrains text-slate-500 text-xs mb-6">
              One wallet connection. One free NFT. Infinite possibilities.
            </p>

            <ConnectButton
              onClick={handleLogin}
              disabled={isLoggingIn}
              isLoggingIn={isLoggingIn}
              ocid="landing.secondary_button"
              label="CONNECT WITH INTERNET IDENTITY"
            />

            {loginError && (
              <div
                className="inline-block px-4 py-2 rounded-lg mt-3"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.35)",
                }}
              >
                <p className="text-red-400 font-jetbrains text-xs">
                  {loginError}
                </p>
              </div>
            )}
          </motion.div>
        </section>

        {/* ══════════════════════ ATTRIBUTION ══════════════════════ */}
        <footer
          className="py-6 text-center"
          style={{ borderTop: "1px solid rgba(6,182,212,0.08)" }}
        >
          <p className="text-slate-600 font-jetbrains text-xs">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-700 hover:text-cyan-500 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
