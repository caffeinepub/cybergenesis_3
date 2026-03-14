import React from "react";
import type { LandData } from "../types/land";

interface Props {
  lands: LandData[];
  selectedIndex: number;
  onSelectLand: (index: number) => void;
}

export default function LandSelector({
  lands,
  selectedIndex,
  onSelectLand,
}: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {lands.map((land, i) => {
        const biomeKey =
          typeof land.biome === "string"
            ? land.biome
            : Object.keys(land.biome as object)[0];
        const landId =
          typeof land.landId === "string" ? land.landId : String(i);
        return (
          <button
            type="button"
            key={landId}
            data-ocid={`land_selector.item.${i + 1}`}
            onClick={() => onSelectLand(i)}
            className={`px-4 py-2 rounded-lg font-orbitron text-sm transition-all duration-300 ${
              selectedIndex === i
                ? "glassmorphism neon-border text-[#00ffff] box-glow-cyan text-glow-cyan"
                : "glassmorphism border border-[#9933ff]/30 text-[#9933ff] hover:border-[#00ffff]/50 hover:text-[#00ffff]"
            }`}
          >
            {biomeKey} #{i + 1}
          </button>
        );
      })}
    </div>
  );
}
