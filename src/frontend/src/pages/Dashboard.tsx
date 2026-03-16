import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Compass,
  Hammer,
  Map as MapIcon,
  Package,
  ShoppingCart,
  Trophy,
  Vote,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import type { LandData } from "../backend";
import CubeVisualization from "../components/CubeVisualization";
import Discovery from "../components/Discovery";
import Governance from "../components/Governance";
import LandDashboard from "../components/LandDashboard";
import LandSelector from "../components/LandSelector";
import Leaderboard from "../components/Leaderboard";
import MapView from "../components/MapView";
import Marketplace from "../components/Marketplace";
import { useActor } from "../hooks/useActor";
import Collection from "./Collection";

type TabType =
  | "land"
  | "discovery"
  | "craft"
  | "collection"
  | "leaderboard"
  | "marketplace"
  | "governance"
  | "map"
  | "guide";

function ComingSoon() {
  return (
    <div className="text-center py-16">
      <p className="text-[#00ffff] font-orbitron text-xl text-glow-cyan mb-3">
        COMING SOON
      </p>
      <p className="text-white/50 font-jetbrains text-sm">
        This section is under development
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState<TabType>("land");
  const [selectedLandIndex, setSelectedLandIndex] = useState(0);

  const { data: lands, isLoading } = useQuery<LandData[]>({
    queryKey: ["landData"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      return actor.getLandData();
    },
    enabled: !!actor,
  });

  useEffect(() => {
    if (lands && lands.length > 0 && selectedLandIndex >= lands.length) {
      setSelectedLandIndex(0);
    }
  }, [lands, selectedLandIndex]);

  useEffect(() => {
    if (lands && lands.length > 0) {
      const currentLand = lands[selectedLandIndex];
      console.log("[Dashboard] \uD83C\uDF0D Current Land Data:", {
        index: selectedLandIndex,
        biome: currentLand.biome,
        landId: currentLand.landId,
        coordinates: currentLand.coordinates,
      });
    }
  }, [lands, selectedLandIndex]);

  if (isLoading) {
    return (
      <div className="dashboard-container flex flex-col min-h-screen bg-transparent">
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="glassmorphism p-8 rounded-lg neon-border box-glow-cyan animate-pulse-glow">
            <div className="text-[#00ffff] text-xl animate-pulse font-orbitron text-glow-cyan">
              Loading data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lands || lands.length === 0) {
    return (
      <div className="dashboard-container flex flex-col min-h-screen bg-transparent">
        <div className="min-h-screen flex items-center justify-center relative z-10">
          <div className="glassmorphism p-8 rounded-lg neon-border box-glow-gold">
            <div className="text-red-400 text-xl font-orbitron">
              Land not found
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentLand = lands[selectedLandIndex];

  const tabs = [
    { id: "land" as TabType, icon: Compass, label: "Land" },
    { id: "discovery" as TabType, icon: Package, label: "Discovery" },
    { id: "craft" as TabType, icon: Hammer, label: "Craft" },
    { id: "collection" as TabType, icon: BookOpen, label: "Collection" },
    { id: "leaderboard" as TabType, icon: Trophy, label: "Leaderboard" },
    { id: "marketplace" as TabType, icon: ShoppingCart, label: "Marketplace" },
    { id: "governance" as TabType, icon: Vote, label: "Governance" },
    { id: "map" as TabType, icon: MapIcon, label: "Map" },
    { id: "guide" as TabType, icon: BookOpen, label: "Guide" },
  ];

  const handleMapClose = () => {
    setActiveTab("land");
  };

  const isMapOpen = activeTab === "map";

  return (
    <div className="dashboard-container flex flex-col min-h-screen bg-transparent">
      {isMapOpen && <MapView onClose={handleMapClose} />}

      <div className="dashboard min-h-screen text-white relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-8">
          {lands.length > 1 && (
            <div className="mb-6">
              <LandSelector
                lands={lands}
                selectedIndex={selectedLandIndex}
                onSelectLand={setSelectedLandIndex}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div
              className="lg:col-span-2 rounded-lg overflow-hidden glassmorphism neon-border box-glow-cyan animate-pulse-glow"
              style={{
                minHeight: "65vh",
                position: "relative",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CubeVisualization biome={currentLand.biome} />
            </div>

            <div className="space-y-4">
              <nav className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                        transition-all duration-300 font-medium font-orbitron
                        ${
                          isActive
                            ? "glassmorphism neon-border text-[#00ffff] box-glow-cyan text-glow-cyan"
                            : "glassmorphism border border-[#9933ff]/30 text-[#9933ff] hover:border-[#00ffff]/50 hover:text-[#00ffff] hover:box-glow-cyan"
                        }
                      `}
                      data-ocid={`nav.${tab.id}_tab`}
                    >
                      <Icon className="w-5 h-5" />
                      <span
                        className={`text-sm ${!isActive ? "text-[#00ffff]" : ""}`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="rounded-lg glassmorphism neon-border box-glow-purple p-6">
            {activeTab === "land" && (
              <LandDashboard selectedLandIndex={selectedLandIndex} />
            )}
            {activeTab === "discovery" && <Discovery />}
            {activeTab === "craft" && <ComingSoon />}
            {activeTab === "collection" && <Collection />}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "marketplace" && <Marketplace />}
            {activeTab === "governance" && <Governance />}
            {activeTab === "guide" && <ComingSoon />}
          </div>
        </div>
      </div>
    </div>
  );
}
