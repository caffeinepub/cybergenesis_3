import { Map as MapIcon, X } from "lucide-react";
import React from "react";
import type { LandData } from "../types/land";

interface Props {
  landData: LandData;
  onClose: () => void;
}

export default function MapView({ landData, onClose }: Props) {
  const biomeKey =
    typeof landData.biome === "string"
      ? landData.biome
      : Object.keys(landData.biome as object)[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 glassmorphism neon-border box-glow-cyan rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#00ffff] font-orbitron text-glow-cyan flex items-center gap-3">
            <MapIcon className="w-7 h-7" />
            КАРТА МИРА
          </h2>
          <button
            type="button"
            data-ocid="map.close_button"
            onClick={onClose}
            className="text-[#9933ff] hover:text-[#00ffff] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="glassmorphism p-8 rounded-lg neon-border text-center min-h-[300px] flex items-center justify-center">
          <div>
            <p className="text-[#00ffff] font-orbitron text-lg mb-2">
              БИОМ: {biomeKey}
            </p>
            <p className="text-[#9933ff] font-jetbrains text-sm">
              Интерактивная карта скоро будет доступна...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
