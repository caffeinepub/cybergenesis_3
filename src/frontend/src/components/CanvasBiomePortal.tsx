import { useProgress } from "@react-three/drei";
import React, { useEffect, useState } from "react";

// ── Biome Portal — AAA canvas loader ─────────────────────────────────────────

const NODES = [
  { id: "aether", deg: 270, color: "#c084fc" },
  { id: "forest", deg: 330, color: "#4ade80" },
  { id: "desert", deg: 30, color: "#fbbf24" },
  { id: "volcanic", deg: 90, color: "#f87171" },
  { id: "snow", deg: 150, color: "#93c5fd" },
  { id: "island", deg: 210, color: "#22d3ee" },
] as const;

const PHRASES = [
  "SCANNING LAND GRID",
  "CALIBRATING BIOME DATA",
  "LOADING 3D ASSETS",
  "INITIALIZING PORTAL",
  "SYNCHRONIZING CHAIN",
] as const;

const STYLES = `
  @keyframes bpRotOuter  { to { transform: rotate(360deg);  } }
  @keyframes bpRotMiddle { to { transform: rotate(-360deg); } }
  @keyframes bpColorCycle {
    0%,100% { stroke: #22d3ee; filter: drop-shadow(0 0 6px rgba(34,211,238,.9)); }
    17%     { stroke: #4ade80; filter: drop-shadow(0 0 6px rgba(74,222,128,.9)); }
    33%     { stroke: #fbbf24; filter: drop-shadow(0 0 6px rgba(251,191,36,.9)); }
    50%     { stroke: #f87171; filter: drop-shadow(0 0 6px rgba(248,113,113,.9)); }
    67%     { stroke: #93c5fd; filter: drop-shadow(0 0 6px rgba(147,197,253,.9)); }
    83%     { stroke: #c084fc; filter: drop-shadow(0 0 6px rgba(192,132,252,.9)); }
  }
  @keyframes bpCoreBreath {
    0%,100% { opacity: .5; }
    50%     { opacity: 1;  }
  }
  @keyframes bpRingExpand {
    0%   { transform: scale(1);   opacity: .8; }
    100% { transform: scale(3.2); opacity: 0;  }
  }
  @keyframes bpScanMove {
    0%   { transform: translateY(-63px); opacity: 0;   }
    8%   { opacity: .85; }
    92%  { opacity: .85; }
    100% { transform: translateY(63px);  opacity: 0;   }
  }
  @keyframes bpNebula {
    0%,100% { opacity: .12; transform: scale(1);    }
    50%     { opacity: .28; transform: scale(1.09); }
  }
  @keyframes bpTextIn {
    0%   { opacity: 0; transform: translateY(6px); }
    14%  { opacity: 1; transform: translateY(0);   }
    78%  { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes bpBlink  { 50% { opacity: 0; } }
  @keyframes bpAmbGlow {
    0%,100% { opacity: .5; transform: translate(-50%,-50%) scale(1);    }
    50%     { opacity: .9; transform: translate(-50%,-50%) scale(1.2); }
  }

  .bp-g-outer  { transform-origin: 150px 150px; animation: bpRotOuter  28s linear infinite; }
  .bp-g-mid    { transform-origin: 150px 150px; animation: bpRotMiddle 12s linear infinite; }
  .bp-cc       { animation: bpColorCycle 9s linear infinite; }
  .bp-core     { animation: bpCoreBreath 2.5s ease-in-out infinite; }
  .bp-scan-g   { transform-origin: 150px 150px; animation: bpScanMove 3.5s ease-in-out infinite; }
  .bp-nebula {
    position: absolute; inset: 0; border-radius: 50%;
    background: radial-gradient(ellipse 58% 58% at 50% 50%,
      rgba(34,211,238,.1) 0%, transparent 70%);
    animation: bpNebula 4.5s ease-in-out infinite;
    pointer-events: none;
  }
  .bp-ambient {
    position: absolute;
    width: 640px; height: 640px;
    left: 50%; top: 50%;
    transform: translate(-50%,-50%);
    background: radial-gradient(ellipse,
      rgba(34,211,238,.05) 0%,
      rgba(192,132,252,.025) 40%,
      transparent 70%);
    animation: bpAmbGlow 6s ease-in-out infinite;
    pointer-events: none;
  }
  .bp-phrase { animation: bpTextIn 2.2s ease forwards; }
  .bp-cursor { animation: bpBlink 1s step-end infinite; }
`;

export default function CanvasBiomePortal() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setPhraseIdx((i) => (i + 1) % PHRASES.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active && progress === 100) {
      const t = setTimeout(() => setVisible(false), 750);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  if (!visible) return null;
  const isLoaded = !active && progress === 100;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 80% at 50% 50%, #090317 0%, #02000a 55%, #000 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: isLoaded ? 0 : 1,
        transition: "opacity 0.75s ease",
      }}
    >
      <style>{STYLES}</style>

      {/* Ambient glow behind portal */}
      <div className="bp-ambient" />

      {/* Portal ring system */}
      <div style={{ position: "relative", width: 280, height: 280 }}>
        <svg
          width="280"
          height="280"
          viewBox="0 0 300 300"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <defs>
            <clipPath id="bp-clip-inner">
              <circle cx="150" cy="150" r="64" />
            </clipPath>
            <radialGradient id="bp-grad-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── OUTER ROTATING RING ───────────────────────────────── */}
          <g className="bp-g-outer">
            {/* Ghost guide circle */}
            <circle
              cx="150"
              cy="150"
              r="120"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
            {/* Animated dashed arc */}
            <circle
              cx="150"
              cy="150"
              r="120"
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="28 18.8"
              className="bp-cc"
            />
            {/* Major ticks at 60° */}
            {[0, 60, 120, 180, 240, 300].map((a) => {
              const r = (a * Math.PI) / 180;
              return (
                <line
                  key={`mt${a}`}
                  x1={150 + 113 * Math.cos(r)}
                  y1={150 + 113 * Math.sin(r)}
                  x2={150 + 127 * Math.cos(r)}
                  y2={150 + 127 * Math.sin(r)}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="1.5"
                />
              );
            })}
            {/* Minor ticks at 30° */}
            {[30, 90, 150, 210, 270, 330].map((a) => {
              const r = (a * Math.PI) / 180;
              return (
                <line
                  key={`st${a}`}
                  x1={150 + 117 * Math.cos(r)}
                  y1={150 + 117 * Math.sin(r)}
                  x2={150 + 123 * Math.cos(r)}
                  y2={150 + 123 * Math.sin(r)}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.8"
                />
              );
            })}
          </g>

          {/* ── FIXED BIOME DIAMOND NODES ────────────────────────── */}
          {NODES.map((n, i) => {
            const rad = (n.deg * Math.PI) / 180;
            const nx = +(150 + 120 * Math.cos(rad)).toFixed(2);
            const ny = +(150 + 120 * Math.sin(rad)).toFixed(2);
            return (
              <g key={n.id}>
                {/* Expanding sonar pulse */}
                <circle
                  cx={nx}
                  cy={ny}
                  r="5"
                  fill="none"
                  stroke={n.color}
                  strokeWidth="1"
                  style={{
                    transformOrigin: `${nx}px ${ny}px`,
                    animation: `bpRingExpand 2.4s ${(i * 0.4).toFixed(1)}s ease-out infinite`,
                    opacity: 0,
                  }}
                />
                {/* Diamond body */}
                <rect
                  x={nx - 4}
                  y={ny - 4}
                  width="8"
                  height="8"
                  fill={n.color}
                  opacity="0.92"
                  transform={`rotate(45, ${nx}, ${ny})`}
                  style={{ filter: `drop-shadow(0 0 7px ${n.color})` }}
                />
              </g>
            );
          })}

          {/* ── MIDDLE COUNTER-ROTATING RING ─────────────────────── */}
          <g className="bp-g-mid">
            <circle
              cx="150"
              cy="150"
              r="92"
              fill="none"
              strokeWidth="1"
              strokeDasharray="13 10"
              stroke="rgba(192,132,252,0.45)"
              style={{ filter: "drop-shadow(0 0 4px rgba(192,132,252,0.6))" }}
            />
          </g>

          {/* ── INNER RING ───────────────────────────────────────── */}
          <circle
            cx="150"
            cy="150"
            r="66"
            fill="none"
            strokeWidth="1.5"
            strokeDasharray="9 6"
            className="bp-cc"
            style={{ opacity: 0.65 }}
          />
          {/* Radial fill glow */}
          <circle cx="150" cy="150" r="63" fill="url(#bp-grad-fill)" />

          {/* ── SCAN LINE (clipped to inner circle) ──────────────── */}
          <g clipPath="url(#bp-clip-inner)">
            <g className="bp-scan-g">
              <line
                x1="87"
                y1="150"
                x2="213"
                y2="150"
                stroke="rgba(34,211,238,0.9)"
                strokeWidth="1"
                style={{ filter: "drop-shadow(0 0 5px #22d3ee)" }}
              />
              {/* Soft trailing glow below */}
              <line
                x1="87"
                y1="153"
                x2="213"
                y2="153"
                stroke="rgba(34,211,238,0.22)"
                strokeWidth="2"
              />
            </g>
          </g>

          {/* ── CORE DOT ─────────────────────────────────────────── */}
          <circle
            cx="150"
            cy="150"
            r="5"
            fill="#22d3ee"
            className="bp-core"
            style={{ filter: "drop-shadow(0 0 12px #22d3ee)" }}
          />

          {/* 4 crosshair micro-lines */}
          <line
            x1="150"
            y1="90"
            x2="150"
            y2="106"
            stroke="rgba(34,211,238,0.22)"
            strokeWidth="0.5"
          />
          <line
            x1="194"
            y1="150"
            x2="210"
            y2="150"
            stroke="rgba(34,211,238,0.22)"
            strokeWidth="0.5"
          />
          <line
            x1="150"
            y1="194"
            x2="150"
            y2="210"
            stroke="rgba(34,211,238,0.22)"
            strokeWidth="0.5"
          />
          <line
            x1="90"
            y1="150"
            x2="106"
            y2="150"
            stroke="rgba(34,211,238,0.22)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Nebula CSS overlay */}
        <div className="bp-nebula" />
      </div>

      {/* Text section */}
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <div
          key={phraseIdx}
          className="bp-phrase"
          style={{
            fontFamily: "'Orbitron','Courier New',monospace",
            fontSize: 11,
            letterSpacing: "0.26em",
            color: "rgba(34,211,238,0.92)",
            textShadow: "0 0 14px rgba(34,211,238,0.6)",
            userSelect: "none",
          }}
        >
          {PHRASES[phraseIdx]}
          <span className="bp-cursor" style={{ marginLeft: 3 }}>
            _
          </span>
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: "'Orbitron','Courier New',monospace",
            fontSize: 8,
            letterSpacing: "0.46em",
            color: "rgba(255,255,255,0.17)",
            userSelect: "none",
          }}
        >
          CYBERGENESIS · LAND NFT
        </div>
      </div>
    </div>
  );
}
