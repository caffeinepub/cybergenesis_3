import { Loader2, Network } from "lucide-react";
import React from "react";

interface Props {
  attempt: number;
  maxAttempts: number;
  currentGateway: string;
}

export default function ReinitializationProgress({
  attempt,
  maxAttempts,
  currentGateway,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
      <div className="text-center space-y-6 p-8 glassmorphism rounded-lg neon-border box-glow-cyan max-w-md animate-pulse-glow">
        <Loader2 className="w-12 h-12 animate-spin text-[#00ffff] mx-auto" />
        <h2 className="text-xl font-bold text-[#00ffff] font-orbitron text-glow-cyan">
          ПЕРЕИНИЦИАЛИЗАЦИЯ
        </h2>
        <div className="glassmorphism p-4 rounded neon-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Network className="w-4 h-4 text-[#00ffff]" />
            <p className="text-[#00ffff] text-sm font-jetbrains">
              Попытка {attempt} / {maxAttempts}
            </p>
          </div>
          <p className="text-[#9933ff] text-xs font-jetbrains">
            {currentGateway}
          </p>
        </div>
      </div>
    </div>
  );
}
