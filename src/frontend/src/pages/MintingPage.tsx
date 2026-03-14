import { Loader2 } from "lucide-react";
import React from "react";

export default function MintingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <Loader2 className="inline-block animate-spin h-12 w-12 text-[#00ff41] mb-4" />
        <p className="text-white text-lg font-orbitron">
          Инициализация данных...
        </p>
      </div>
    </div>
  );
}
