import { Search } from "lucide-react";
import React from "react";

export default function Discovery() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#00ffff] font-orbitron text-glow-cyan flex items-center gap-3">
        <Search className="w-7 h-7" />
        ОТКРЫТИЯ
      </h2>
      <div className="glassmorphism p-8 rounded-lg neon-border text-center">
        <p className="text-[#9933ff] font-jetbrains text-sm">
          Система открытий скоро будет доступна...
        </p>
      </div>
    </div>
  );
}
