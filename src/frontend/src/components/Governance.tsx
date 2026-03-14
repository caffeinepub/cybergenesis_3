import { Vote } from "lucide-react";
import React from "react";

export default function Governance() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#00ffff] font-orbitron text-glow-cyan flex items-center gap-3">
        <Vote className="w-7 h-7" />
        УПРАВЛЕНИЕ
      </h2>
      <div className="glassmorphism p-8 rounded-lg neon-border text-center">
        <p className="text-[#9933ff] font-jetbrains text-sm">
          Голосование и управление скоро будет доступно...
        </p>
      </div>
    </div>
  );
}
