import { CheckCircle, XCircle } from "lucide-react";
import React from "react";

const CANISTERS = [
  { name: "Backend (Land)", envKey: "VITE_LAND_CANISTER_ID" },
  { name: "Asset", envKey: "VITE_ASSET_CANISTER_ID" },
  { name: "Cyber Token", envKey: "VITE_CYBER_TOKEN_CANISTER_ID" },
  { name: "Marketplace", envKey: "VITE_MARKETPLACE_CANISTER_ID" },
  { name: "Governance", envKey: "VITE_GOVERNANCE_CANISTER_ID" },
];

export function CanisterIDVerification() {
  return (
    <div className="glassmorphism neon-border rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[#00ffff] font-orbitron text-glow-cyan mb-4">
        ПРОВЕРКА КАНИСТР
      </h2>
      <div className="space-y-3">
        {CANISTERS.map(({ name, envKey }) => {
          const value = (import.meta.env as Record<string, string>)[envKey];
          const ok = !!value && value !== "undefined";
          return (
            <div
              key={envKey}
              className="flex items-center justify-between glassmorphism p-3 rounded border border-[#9933ff]/20"
            >
              <div>
                <p className="text-[#00ffff] font-orbitron text-sm">{name}</p>
                <p className="text-[#9933ff] font-jetbrains text-xs">
                  {value || "NOT SET"}
                </p>
              </div>
              {ok ? (
                <CheckCircle className="w-5 h-5 text-[#00ff41]" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
