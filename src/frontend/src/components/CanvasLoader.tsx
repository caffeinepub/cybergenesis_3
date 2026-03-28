import { useProgress } from "@react-three/drei";
import React, { useEffect, useState } from "react";

const BIOME_COLORS = [
  "#22d3ee", // island / cyan
  "#4ade80", // forest / green
  "#fbbf24", // desert / amber
  "#f87171", // volcanic / red
  "#93c5fd", // snow / blue
  "#c084fc", // aether / purple
];

const PHRASES = [
  "LOADING BIOME DATA",
  "MATERIALIZING TERRAIN",
  "SYNCING LAND GRID",
  "RENDERING 3D SCENE",
  "CALIBRATING SHADERS",
];

export default function CanvasLoader() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);
  const [colorIdx, setColorIdx] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setColorIdx((i) => (i + 1) % BIOME_COLORS.length);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!active && progress === 100) {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  if (!visible) return null;
  const isLoaded = !active && progress === 100;
  const color = BIOME_COLORS[colorIdx];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isLoaded ? 0 : 1,
        transition: "opacity 0.6s ease",
      }}
    >
      <style>{`
        @keyframes cl-bar {
          0%   { transform: scaleX(0); transform-origin: left; }
          50%  { transform: scaleX(1); transform-origin: left; }
          51%  { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0); transform-origin: right; }
        }
        @keyframes cl-blink { 50% { opacity: 0; } }
        .cl-bar { animation: cl-bar 2s ease-in-out infinite; }
        .cl-cursor { animation: cl-blink 1s step-end infinite; }
        .cl-color { transition: color 0.6s ease, text-shadow 0.6s ease; }
      `}</style>

      <div style={{ textAlign: "center" }}>
        <div
          className="cl-color"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            letterSpacing: "0.22em",
            color,
            textShadow: `0 0 12px ${color}`,
            userSelect: "none",
            marginBottom: 10,
          }}
        >
          {PHRASES[phraseIdx]}
          <span className="cl-cursor" style={{ marginLeft: 2 }}>
            _
          </span>
        </div>

        <div
          style={{
            width: 120,
            height: 1,
            background: color,
            boxShadow: `0 0 8px ${color}`,
            margin: "0 auto",
            transition: "background 0.6s ease, box-shadow 0.6s ease",
          }}
        >
          <div
            className="cl-bar"
            style={{ width: "100%", height: "100%", background: "#000" }}
          />
        </div>
      </div>
    </div>
  );
}
