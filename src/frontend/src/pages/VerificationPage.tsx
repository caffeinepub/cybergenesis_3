import React from "react";
import { CanisterIDVerification } from "../components/CanisterIDVerification";
import CosmicBackground from "../components/CosmicBackground";

export function VerificationPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <CosmicBackground />
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-4 font-orbitron">
            ПРОВЕРКА КОНФИГУРАЦИИ
          </h1>
        </div>
        <CanisterIDVerification />
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 btn-gradient-cyan text-black font-bold rounded-lg font-orbitron"
          >
            Вернуться
          </a>
        </div>
      </div>
    </div>
  );
}
