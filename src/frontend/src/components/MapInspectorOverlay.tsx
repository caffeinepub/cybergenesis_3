import { X, Zap } from "lucide-react";
import type React from "react";
import {
  BIOME_DISPLAY,
  getBiomeColor,
  getModCatalog,
  getRarityMeta,
  truncatePrincipal,
} from "./marketplace/MarketplaceTypes";

interface ModSlot {
  modifierInstanceId: bigint;
  modifierType: string;
  rarity_tier: number;
}

interface MapInspectorOverlayProps {
  open: boolean;
  onClose: () => void;
  landId: number;
  biome: string;
  principal: string;
  mods: ModSlot[];
}

export function MapInspectorOverlay({
  open,
  onClose,
  landId,
  biome,
  principal,
  mods,
}: MapInspectorOverlayProps) {
  if (!open) return null;

  const biomeColor = getBiomeColor(biome);
  const displayBiome = BIOME_DISPLAY[biome] ?? "CYBER LAND";
  const installed = mods.length;
  const free = 49 - installed;

  return (
    // Overlay backdrop — position:absolute inside MapView's fixed container
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 500,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>
        e.key === "Escape" && onClose()
      }
      tabIndex={-1}
    >
      {/* Modal card */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(5,0,20,0.98) 0%, rgba(15,0,40,0.97) 100%)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${biomeColor}30`,
          boxShadow: `0 0 40px ${biomeColor}20, 0 0 80px ${biomeColor}10`,
          borderRadius: "16px",
          padding: "24px",
          width: "min(640px, 92vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) =>
          e.stopPropagation()
        }
      >
        {/* Close btn */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              fontSize: "22px",
              marginBottom: "4px",
              color: biomeColor,
              textShadow: `0 0 16px ${biomeColor}80`,
            }}
          >
            {displayBiome}
          </h2>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "2px",
            }}
          >
            LAND #{landId} · INSPECTOR
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            by: {truncatePrincipal(principal)}
          </p>
        </div>

        {/* Grid label */}
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "2px",
            color: "rgba(255,255,255,0.25)",
            marginBottom: "10px",
          }}
        >
          MODIFIER SLOTS (49)
        </p>

        {/* 7×7 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "6px",
            marginBottom: "20px",
          }}
        >
          {Array.from({ length: 49 }, (_, i) => {
            const mod = mods.find(
              (m) => getModCatalog(m.modifierType)?.id === i + 1,
            );
            if (mod) {
              const catalog = getModCatalog(mod.modifierType);
              const rarity = getRarityMeta(mod.rarity_tier);
              return (
                <div
                  key={mod.modifierInstanceId.toString()}
                  style={{
                    aspectRatio: "1",
                    borderRadius: "8px",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${biomeColor}50`,
                    boxShadow: `0 0 8px ${biomeColor}30`,
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  }}
                  title={mod.modifierType}
                >
                  {catalog?.asset_url ? (
                    <img
                      src={catalog.asset_url}
                      alt={mod.modifierType}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: `drop-shadow(0 0 4px ${rarity.color})`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: rarity.glow,
                      }}
                    >
                      <Zap size={10} style={{ color: rarity.color }} />
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div
                key={String(i + 100)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "8px",
                    color: "rgba(255,255,255,0.18)",
                  }}
                >
                  #{i + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom counters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
          }}
        >
          <div
            style={{
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
              background: `${biomeColor}12`,
              border: `1px solid ${biomeColor}30`,
            }}
          >
            <p
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "28px",
                fontWeight: 700,
                color: biomeColor,
                textShadow: `0 0 12px ${biomeColor}`,
                margin: 0,
              }}
            >
              {installed}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "2px",
                marginTop: "4px",
              }}
            >
              INSTALLED
            </p>
          </div>
          <div
            style={{
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "28px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                margin: 0,
              }}
            >
              {free}
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "2px",
                marginTop: "4px",
              }}
            >
              FREE
            </p>
          </div>
          <div
            style={{
              borderRadius: "12px",
              padding: "12px",
              textAlign: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <p
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "28px",
                fontWeight: 700,
                color: "#ffffff",
                margin: 0,
              }}
            >
              49
            </p>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "2px",
                marginTop: "4px",
              }}
            >
              TOTAL SLOTS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
