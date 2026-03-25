import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star, X } from "lucide-react";
import { useState } from "react";
import ReactDOM from "react-dom";
import {
  PLANNED_MODIFIER_CATALOG,
  type PlannedModifier,
  RARITY_COLORS,
  RARITY_GLOW,
} from "../data/modifierCatalog";

export default function Collection() {
  const tierCounts = PLANNED_MODIFIER_CATALOG.reduce(
    (acc, mod) => {
      acc[mod.rarity_tier] = (acc[mod.rarity_tier] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const statBlocks = [
    {
      label: "Common",
      tier: 1,
      color: "#9CA3AF",
      shadow: "0 0 8px rgba(156,163,175,0.5)",
      borderColor: "rgba(156,163,175,0.25)",
    },
    {
      label: "Rare",
      tier: 2,
      color: "#60A5FA",
      shadow: "0 0 8px rgba(96,165,250,0.6)",
      borderColor: "rgba(96,165,250,0.25)",
    },
    {
      label: "Legendary",
      tier: 3,
      color: "#A855F7",
      shadow: "0 0 8px rgba(168,85,247,0.7)",
      borderColor: "rgba(168,85,247,0.25)",
    },
    {
      label: "Mythic",
      tier: 4,
      color: "#FACC15",
      shadow: "0 0 10px rgba(250,204,21,0.8)",
      borderColor: "rgba(250,204,21,0.25)",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
      {/* Header Card */}
      <Card className="glassmorphism border-primary/30">
        <CardHeader>
          <CardTitle className="font-orbitron text-3xl text-glow-teal flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            MODIFIER COLLECTION
          </CardTitle>
          <p className="font-jetbrains text-sm text-muted-foreground mt-2">
            Explore the complete catalog of modifiers available in CyberGenesis.
            Collect them through loot cache discoveries.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statBlocks.map((s) => (
              <div
                key={s.tier}
                className="glassmorphism p-4 rounded-lg text-center"
                style={{ border: `1px solid ${s.borderColor}` }}
              >
                <p className="font-jetbrains text-xs text-muted-foreground uppercase mb-1">
                  {s.label}
                </p>
                <p
                  className="font-orbitron text-2xl font-bold"
                  style={{ color: s.color, textShadow: s.shadow }}
                >
                  {tierCounts[s.tier] || 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modifier Grid */}
      <Card className="glassmorphism border-accent/30">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl text-glow-green flex items-center gap-2">
            <Star className="h-6 w-6" />
            ALL MODIFIERS ({PLANNED_MODIFIER_CATALOG.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {PLANNED_MODIFIER_CATALOG.map((modifier, index) => (
              <ModifierCard
                key={modifier.id}
                modifier={modifier}
                index={index}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ModifierCardProps {
  modifier: PlannedModifier;
  index: number;
}

function ModifierCard({ modifier, index }: ModifierCardProps) {
  const [hovered, setHovered] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const color = RARITY_COLORS[modifier.rarity_tier];
  const glow = RARITY_GLOW[modifier.rarity_tier];

  const getTierName = (tier: number): string => {
    switch (tier) {
      case 1:
        return "COMMON";
      case 2:
        return "RARE";
      case 3:
        return "LEGENDARY";
      case 4:
        return "MYTHIC";
      default:
        return "UNKNOWN";
    }
  };

  const openModal = () => {
    if (modifier.asset_url) setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const cardStyle: React.CSSProperties = {
    animationDelay: `${index * 20}ms`,
    animationDuration: "400ms",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${color}90`,
    borderRadius: "10px",
    padding: "12px 8px 10px",
    transition: "all 0.25s ease",
    cursor: "pointer",
    boxShadow: hovered
      ? `0 0 18px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.05)`
      : `0 0 0px ${glow}, inset 0 0 0 1px rgba(255,255,255,0.03)`,
    transform: hovered ? "translateY(-2px) scale(1.03)" : "none",
  };

  const imgFilter = imgHovered
    ? `drop-shadow(0 0 16px ${glow})`
    : `drop-shadow(0 0 8px ${glow})`;

  return (
    <>
      <div
        className="animate-in fade-in slide-in-from-bottom"
        style={cardStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setImgHovered(false);
        }}
      >
        <div className="flex flex-col items-center">
          {/* Image */}
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: modifier.asset_url ? "pointer" : "default",
            }}
            onMouseEnter={() => setImgHovered(true)}
            onMouseLeave={() => setImgHovered(false)}
            onClick={openModal}
          >
            {modifier.asset_url ? (
              <img
                src={modifier.asset_url}
                alt={modifier.name}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                  filter: imgFilter,
                  transition: "filter 0.3s ease",
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px dashed ${color}40`,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: `${color}60`,
                  filter: imgFilter,
                  transition: "filter 0.3s ease",
                }}
              >
                ?
              </div>
            )}
          </button>

          {/* Rarity divider */}
          <div
            style={{
              height: 1,
              width: "80%",
              margin: "6px auto",
              background: `linear-gradient(to right, transparent, ${color}60, transparent)`,
            }}
          />

          {/* Rarity badge */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: 700,
              color,
              textShadow: `0 0 6px ${glow}`,
              letterSpacing: "0.05em",
              marginBottom: 2,
            }}
          >
            {getTierName(modifier.rarity_tier)}
          </span>

          {/* Name */}
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: 1.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {modifier.name}
          </p>

          {/* ID */}
          <p
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.2)",
              textAlign: "center",
            }}
          >
            #{modifier.id}
          </p>
        </div>
      </div>

      {/* Full-screen modal via portal */}
      {modalOpen &&
        modifier.asset_url &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={closeModal}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeModal();
            }}
          >
            <style>
              {
                "@keyframes fadeInScale{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}"
              }
            </style>
            <div
              style={{
                position: "relative",
                width: 540,
                height: 540,
                background: "rgba(10,10,20,0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(0,243,255,0.4)",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 0 40px rgba(0,243,255,0.25)",
                animation: "fadeInScale 0.2s ease-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  padding: 4,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "rgba(255,255,255,0.6)";
                }}
                onClick={closeModal}
              >
                <X size={20} />
              </button>
              <img
                src={modifier.asset_url}
                alt={modifier.name}
                style={{
                  width: 500,
                  height: 500,
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
