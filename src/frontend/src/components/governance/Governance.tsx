import { useState } from "react";
import { CreateProposalModal } from "./CreateProposalModal";
import { LeaderboardTab } from "./LeaderboardTab";
import { ProposalsTab } from "./ProposalsTab";
import { StakingTab } from "./StakingTab";

const TABS = [
  { id: "staking", label: "STAKING", icon: "⬡", color: "#00e5ff" },
  { id: "proposals", label: "PROPOSALS", icon: "◈", color: "#cc44ff" },
  { id: "leaderboard", label: "LEADERBOARD", icon: "◆", color: "#ffd060" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Governance() {
  const [activeTab, setActiveTab] = useState<TabId>("staking");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const activeColor = TABS.find((t) => t.id === activeTab)?.color ?? "#00e5ff";

  return (
    <div className="min-h-screen w-full" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <h1
          className="font-orbitron font-black text-2xl md:text-3xl tracking-widest mb-1"
          style={{
            color: activeColor,
            textShadow: `0 0 24px ${activeColor}80`,
          }}
        >
          GOVERNANCE
        </h1>
        <p
          className="font-jetbrains text-xs tracking-wider"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Lite DAO · Advisory Voting · CBR Staking
        </p>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-5">
        <div
          className="flex gap-2 p-1 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all"
                style={{
                  background: isActive ? `${tab.color}20` : "transparent",
                  border: isActive
                    ? `1px solid ${tab.color}60`
                    : "1px solid transparent",
                  color: isActive ? tab.color : "rgba(255,255,255,0.3)",
                  boxShadow: isActive ? `0 0 12px ${tab.color}30` : "none",
                  textShadow: isActive ? `0 0 8px ${tab.color}80` : "none",
                }}
                data-ocid={`governance.${tab.id}.tab`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-10">
        {activeTab === "staking" && <StakingTab />}
        {activeTab === "proposals" && (
          <ProposalsTab onCreateClick={() => setCreateModalOpen(true)} />
        )}
        {activeTab === "leaderboard" && <LeaderboardTab />}
      </div>

      {/* Create proposal modal */}
      {createModalOpen && (
        <CreateProposalModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
}
