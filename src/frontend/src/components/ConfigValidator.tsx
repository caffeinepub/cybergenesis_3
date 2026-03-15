import { AlertTriangle, X } from "lucide-react";
import React, { useState } from "react";

interface ValidationResult {
  hasWarnings: boolean;
  warnings: string[];
}

// Hardcoded fallback IDs — used when .env is unavailable (e.g. Caffeine build pipeline)
const FALLBACK_ASSET_CANISTER_ID = "bd3sg-teaaa-aaaaa-qaaba-cai";
const FALLBACK_TOKEN_CANISTER_ID = "w4q3i-7yaaa-aaaam-ab3qq-cai";

function validateEnvironment(): ValidationResult {
  const warnings: string[] = [];

  // Asset canister: fallback to hardcoded ID if env vars are unavailable
  const assetCanisterId =
    import.meta.env.VITE_ASSET_CANISTER_ID ||
    (process.env as Record<string, string>).CANISTER_ID_ASSET_CANISTER ||
    FALLBACK_ASSET_CANISTER_ID;
  if (!assetCanisterId) {
    warnings.push("VITE_ASSET_CANISTER_ID is not configured");
  }

  // Token canister: fallback to hardcoded ID
  const tokenCanisterId =
    import.meta.env.VITE_CYBER_TOKEN_CANISTER_ID ||
    (process.env as Record<string, string>).CANISTER_ID_CYBER_TOKEN ||
    FALLBACK_TOKEN_CANISTER_ID;
  if (!tokenCanisterId) {
    warnings.push("VITE_CYBER_TOKEN_CANISTER_ID is not configured");
  }

  return { hasWarnings: warnings.length > 0, warnings };
}

export default function ConfigValidator() {
  const [dismissed, setDismissed] = useState(false);
  const validation = validateEnvironment();

  if (!validation.hasWarnings || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-900/95 backdrop-blur-md border-b-2 border-yellow-500 shadow-[0_4px_20px_rgba(255,200,0,0.3)]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-start space-x-4">
          <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-200 text-sm font-mono">
              Configuration warnings:
            </p>
            <div className="space-y-1 mt-1">
              {validation.warnings.map((warning, index) => (
                <p
                  // biome-ignore lint/suspicious/noArrayIndexKey: items lack unique ids
                  key={index}
                  className="text-yellow-100 text-xs font-mono"
                >
                  ⚠ {warning}
                </p>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-yellow-300 hover:text-white transition-colors flex-shrink-0 p-1"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
