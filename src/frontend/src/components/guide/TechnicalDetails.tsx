import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function TechnicalDetails() {
  const [open, setOpen] = useState(false);
  const accent = "#00e5ff";

  return (
    <div id="guide-tech" style={{ scrollMarginTop: "80px" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl font-orbitron text-sm font-bold tracking-widest transition-all"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.5)",
          boxShadow: open ? `0 0 20px ${accent}15` : "none",
        }}
        data-ocid="guide.tech.toggle"
      >
        <span className="flex items-center gap-2">
          <span style={{ color: accent }}>◈</span> TECHNICAL DETAILS
        </span>
        {open ? (
          <ChevronUp size={16} style={{ color: accent }} />
        ) : (
          <ChevronDown size={16} className="text-white/40" />
        )}
      </button>

      {open && (
        <div
          className="mt-2 rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(10,3,30,0.85) 0%, rgba(5,0,20,0.92) 100%)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${accent}40`,
            boxShadow: `0 0 20px ${accent}15, 0 4px 24px rgba(0,0,0,0.6)`,
            animation: "govCardIn 0.25s ease-out forwards",
          }}
        >
          <div
            style={{
              height: "2px",
              background: accent,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
          <div className="px-6 py-5 flex flex-col gap-5">
            {[
              {
                term: "Internet Computer (ICP)",
                desc: "A blockchain that hosts full applications on-chain. No AWS, no servers — everything lives in smart contracts called canisters. CyberGenesis runs 100% on ICP.",
              },
              {
                term: "Canister",
                desc: "The smart contract that powers CyberGenesis. It stores all land ownership, modifiers, marketplace listings, and governance data — permanently on-chain.",
              },
              {
                term: "Principal",
                desc: "Your unique blockchain identity. Created via Internet Identity — no seed phrase, no password. Uses device biometrics or a security key.",
              },
              {
                term: "Why on-chain?",
                desc: "All ownership, trades, and governance actions are transparent, trustless, and permanent. Nobody — not even the developers — can alter your ownership records.",
              },
              {
                term: "4 Canisters",
                desc: "CyberGenesis runs on 4 independent canisters: the main game logic (lands, mods, caches), the CBR token (ICRC-1), the marketplace, and governance. Each is an autonomous on-chain program with no central server.",
              },
              {
                term: "All Data On-Chain",
                desc: "Every land, every modifier slot, every ownership record and marketplace listing is stored directly on the Internet Computer blockchain. No databases, no cloud storage — data lives in canister memory, replicated across nodes.",
              },
              {
                term: "Ownership On-Chain",
                desc: "Your land ownership is cryptographically tied to your Internet Identity principal. No company or developer can transfer, delete, or freeze your assets — ownership is enforced by the protocol itself.",
              },
            ].map(({ term, desc }) => (
              <div key={term}>
                <p
                  className="font-orbitron text-xs font-bold tracking-widest mb-1"
                  style={{ color: accent, textShadow: `0 0 8px ${accent}80` }}
                >
                  {term}
                </p>
                <p
                  className="font-jetbrains text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {desc}
                </p>
              </div>
            ))}

            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="font-jetbrains text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Advisory note: Voting results are non-binding. Core game rules
                and visual design remain under developer control.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
