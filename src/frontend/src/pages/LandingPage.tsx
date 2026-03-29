import { motion } from "motion/react";
import React, { useState } from "react";
import CosmicBackground from "../components/CosmicBackground";
import ParticleBackground from "../components/ParticleBackground";
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

const RARITY_COLORS: Record<string, string> = {
  COMMON: "#9CA3AF",
  RARE: "#60A5FA",
  LEGENDARY: "#A855F7",
  MYTHIC: "#FACC15",
};

const MOD_BASE =
  "https://raw.githubusercontent.com/dobr312/cyberland/refs/heads/main/Mods/";

const FEATURED_MODS = [
  {
    id: 42,
    name: "ICPanda",
    img: `${MOD_BASE}modifier_42.webp`,
    tier: "LEGENDARY",
    color: "#A855F7",
  },
  {
    id: 45,
    name: "ICP",
    img: `${MOD_BASE}modifier_45.webp`,
    tier: "MYTHIC",
    color: "#FACC15",
  },
  {
    id: 48,
    name: "InternetComputer",
    img: `${MOD_BASE}modifier_48.webp`,
    tier: "MYTHIC",
    color: "#FACC15",
  },
  {
    id: 40,
    name: "Dragginz",
    img: `${MOD_BASE}modifier_40.webp`,
    tier: "LEGENDARY",
    color: "#A855F7",
  },
  {
    id: 47,
    name: "Caffeine",
    img: `${MOD_BASE}modifier_47.webp`,
    tier: "MYTHIC",
    color: "#FACC15",
  },
  {
    id: 34,
    name: "OpenChat",
    img: `${MOD_BASE}modifier_34.webp`,
    tier: "LEGENDARY",
    color: "#A855F7",
  },
];

const rarityBorder = (color: string) => `1px solid ${color}55`;
const rarityGlow = (color: string) =>
  `0 0 14px ${color}55, 0 0 28px ${color}22`;

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
        setLoginError("Already authenticated via Internet Identity.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    }
  };

  const isLoggingIn = loginStatus === "logging-in";

  const btnBase = [
    "font-orbitron font-bold tracking-widest text-white rounded-xl",
    "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600",
    "border border-cyan-400/60",
    "transition-all duration-300 hover:brightness-110 hover:scale-105 active:scale-95",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
  ].join(" ");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <CosmicBackground />
      <div className="absolute inset-0 z-[1]">
        <ParticleBackground />
      </div>

      {/* Ambient blobs */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ══════════════════════ HERO ══════════════════════ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-8 pb-16">
          <div className="max-w-5xl mx-auto text-center w-full">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <span
                className="glassmorphism px-4 py-1 rounded-full font-jetbrains text-xs text-cyan-400 tracking-widest"
                style={{ border: "1px solid rgba(6,182,212,0.4)" }}
              >
                ◆ INTERNET COMPUTER · ON-CHAIN NFT GAME
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-6"
            >
              <h1 className="font-orbitron font-black tracking-widest leading-none select-none">
                <span className="block text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
                  CYBER
                </span>
                <span
                  className="block text-7xl md:text-8xl lg:text-9xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400"
                  style={{
                    filter:
                      "drop-shadow(0 0 30px rgba(168,85,247,0.5)) drop-shadow(0 0 60px rgba(6,182,212,0.3))",
                  }}
                >
                  GENESIS
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-cyan-300 text-xl md:text-2xl font-jetbrains text-glow-cyan mb-3"
            >
              Your{" "}
              <span className="text-white font-bold">COMPOSABLE LAND NFT</span>{" "}
              awaits.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-slate-400 text-sm md:text-base font-jetbrains max-w-lg mx-auto mb-10"
            >
              Claim your first Land. Install 48+ Mods. Build your world.
              <br />
              Trade, Govern &amp; Stake on ICP.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-col items-center gap-3"
            >
              <button
                type="button"
                data-ocid="landing.primary_button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`${btnBase} px-10 py-5 text-lg md:text-xl ${isLoggingIn ? "animate-pulse opacity-80" : ""}`}
                style={{
                  boxShadow: isLoggingIn
                    ? "0 0 30px rgba(6,182,212,0.4), 0 0 60px rgba(139,92,246,0.2)"
                    : "0 0 40px rgba(6,182,212,0.6), 0 0 80px rgba(139,92,246,0.3)",
                }}
              >
                <span className="flex items-center gap-3">
                  {isLoggingIn ? (
                    <span className="tracking-widest">CONNECTING...</span>
                  ) : (
                    <>
                      <span className="text-2xl leading-none">⬡</span>
                      <span>CONNECT WITH INTERNET IDENTITY</span>
                      <span className="text-xl leading-none opacity-70">→</span>
                    </>
                  )}
                </span>
              </button>

              <span className="text-slate-500 text-xs font-jetbrains">
                Secured by Internet Computer Protocol · Zero gas fees · On-chain
                forever
              </span>

              {loginError && (
                <div
                  className="glassmorphism px-4 py-2 rounded-full mt-1"
                  style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                >
                  <p className="text-red-400 font-jetbrains text-sm">
                    {loginError}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════ BIOMES ══════════════════════ */}
        <section
          className="pb-20 border-b"
          style={{ borderColor: "rgba(6,182,212,0.1)" }}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-cyan-500 font-jetbrains text-sm tracking-widest mb-6"
            >
              {"// CLAIM ONE OF 7 UNIQUE BIOMES"}
            </motion.p>

            <div
              className="flex gap-4 overflow-x-auto pb-4"
              style={{ scrollbarWidth: "none" }}
            >
              {BIOMES.map((biome, i) => (
                <motion.div
                  key={biome.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex-shrink-0 w-44 md:w-52 rounded-xl overflow-hidden glassmorphism cursor-pointer"
                  style={{ border: rarityBorder(biome.color) }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: rarityGlow(biome.color),
                  }}
                >
                  <img
                    src={biome.img}
                    alt={biome.name}
                    className="w-full h-28 md:h-32 object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p
                      className="font-orbitron text-xs font-bold mb-2 leading-tight"
                      style={{ color: biome.color }}
                    >
                      {biome.name.toUpperCase()}
                    </p>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full font-jetbrains text-[10px] font-bold"
                      style={{
                        background: `${biome.color}18`,
                        border: `1px solid ${biome.color}55`,
                        color: biome.color,
                      }}
                    >
                      {biome.rarity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════ FEATURE CARDS ══════════════════════ */}
        <section
          className="py-20 border-b"
          style={{ borderColor: "rgba(6,182,212,0.1)" }}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glassmorphism rounded-2xl p-6 flex flex-col gap-4"
                style={{ border: "1px solid rgba(6,182,212,0.25)" }}
                whileHover={{ boxShadow: "0 0 30px rgba(6,182,212,0.15)" }}
              >
                <div
                  className="text-5xl leading-none"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(6,182,212,0.7))",
                  }}
                >
                  ⬡
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-lg text-cyan-300 mb-2 tracking-wide">
                    CLAIM YOUR LAND
                  </h3>
                  <p className="text-slate-400 font-jetbrains text-sm leading-relaxed">
                    Register once and instantly receive your first LAND NFT — a
                    unique composable territory on the Internet Computer. Yours
                    forever, on-chain.
                  </p>
                </div>
                <div className="mt-auto">
                  <span
                    className="inline-block px-3 py-1 rounded-full font-jetbrains text-xs font-bold tracking-wider"
                    style={{
                      background: "rgba(74,222,128,0.12)",
                      border: "1px solid rgba(74,222,128,0.4)",
                      color: "#4ade80",
                    }}
                  >
                    [ FREE MINT ON SIGN-UP ]
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glassmorphism rounded-2xl p-6 flex flex-col gap-4"
                style={{ border: "1px solid rgba(168,85,247,0.25)" }}
                whileHover={{ boxShadow: "0 0 30px rgba(168,85,247,0.15)" }}
              >
                <div
                  className="text-5xl leading-none"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(168,85,247,0.7))",
                  }}
                >
                  ◈
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-lg text-purple-300 mb-2 tracking-wide">
                    INSTALL 48+ MODS
                  </h3>
                  <p className="text-slate-400 font-jetbrains text-sm leading-relaxed">
                    Equip your Land with Modifiers — ICP ecosystem protocols,
                    characters, and objects. Each Mod is a separate NFT.
                    Combine, upgrade, and express your strategy.
                  </p>
                </div>
                <div className="mt-auto">
                  <span
                    className="inline-block px-3 py-1 rounded-full font-jetbrains text-xs font-bold tracking-wider"
                    style={{
                      background: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.4)",
                      color: "#a855f7",
                    }}
                  >
                    [ 48 MODS + 7 KEEPERS ]
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glassmorphism rounded-2xl p-6 flex flex-col gap-4"
                style={{ border: "1px solid rgba(245,158,11,0.25)" }}
                whileHover={{ boxShadow: "0 0 30px rgba(245,158,11,0.15)" }}
              >
                <div
                  className="text-5xl leading-none"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(245,158,11,0.7))",
                  }}
                >
                  ◎
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-lg text-amber-300 mb-2 tracking-wide">
                    PLAY THE ECONOMY
                  </h3>
                  <p className="text-slate-400 font-jetbrains text-sm leading-relaxed">
                    List your Land or Mods on the marketplace. Stake CBR tokens
                    to earn rewards and governance weight. Vote on game
                    evolution.
                  </p>
                </div>
                <div className="mt-auto">
                  <span
                    className="inline-block px-3 py-1 rounded-full font-jetbrains text-xs font-bold tracking-wider"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      color: "#f59e0b",
                    }}
                  >
                    [ CBR TOKEN ECONOMY ]
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════ MODIFIERS ══════════════════════ */}
        <section
          className="py-20 border-b"
          style={{ borderColor: "rgba(6,182,212,0.1)" }}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-cyan-500 font-jetbrains text-sm tracking-widest mb-6"
            >
              {"// FEATURED MODIFIERS"}
            </motion.p>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {FEATURED_MODS.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="glassmorphism rounded-xl overflow-hidden cursor-pointer"
                  style={{ border: `1px solid ${mod.color}40` }}
                  whileHover={{
                    scale: 1.08,
                    boxShadow: `0 0 16px ${mod.color}55, 0 0 32px ${mod.color}22`,
                  }}
                >
                  <img
                    src={mod.img}
                    alt={mod.name}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                  />
                  <div className="p-2">
                    <p
                      className="font-orbitron text-[9px] font-bold truncate leading-tight mb-1"
                      style={{ color: mod.color }}
                    >
                      #{mod.id} {mod.name.toUpperCase()}
                    </p>
                    <span
                      className="inline-block px-1.5 py-0.5 rounded font-jetbrains text-[8px] font-bold"
                      style={{
                        background: `${mod.color}18`,
                        border: `1px solid ${mod.color}44`,
                        color: mod.color,
                      }}
                    >
                      {mod.tier}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-6 justify-center"
            >
              {Object.entries(RARITY_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <span className="font-jetbrains text-xs text-slate-500 tracking-widest">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════ FOOTER CTA ══════════════════════ */}
        <section
          className="py-20"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,51,68,0.3) 0%, rgba(59,7,100,0.3) 50%, rgba(8,51,68,0.3) 100%)",
            borderTop: "1px solid rgba(6,182,212,0.2)",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-orbitron font-bold text-2xl md:text-3xl text-white mb-3 tracking-wide">
                Ready to claim your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  Genesis Land?
                </span>
              </h2>
              <p className="text-slate-400 font-jetbrains text-sm mb-8">
                One wallet connection. One free NFT. Infinite possibilities.
              </p>

              <button
                type="button"
                data-ocid="landing.secondary_button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`${btnBase} px-8 py-4 text-base ${isLoggingIn ? "animate-pulse opacity-80" : ""}`}
                style={{
                  boxShadow:
                    "0 0 30px rgba(6,182,212,0.5), 0 0 60px rgba(139,92,246,0.25)",
                }}
              >
                <span className="flex items-center gap-3">
                  {isLoggingIn ? (
                    <span>CONNECTING...</span>
                  ) : (
                    <>
                      <span className="text-xl">⬡</span>
                      <span>CONNECT WITH INTERNET IDENTITY</span>
                    </>
                  )}
                </span>
              </button>

              {loginError && (
                <div
                  className="glassmorphism inline-block px-4 py-2 rounded-full mt-4"
                  style={{ border: "1px solid rgba(239,68,68,0.4)" }}
                >
                  <p className="text-red-400 font-jetbrains text-sm">
                    {loginError}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
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
