import type React from "react";

const BIOME_COLORS: Record<string, string> = {
  MYTHIC_VOID: "#cc00ff",
  MYTHIC_AETHER: "#0088ff",
  VOLCANIC_CRAG: "#ff2200",
  DESERT_DUNE: "#ffaa00",
  FOREST_VALLEY: "#00ff44",
  SNOW_PEAK: "#88ddff",
  ISLAND_ARCHIPELAGO: "#00ffcc",
};

export interface BeamPopupData {
  landId: number;
  biome: string;
  principal: string;
  modCount: number;
  latlng: any;
  isOwner: boolean;
}

interface Props {
  popup: BeamPopupData;
  popupPx: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

const CARD_W = 220;
const CARD_H = 130;
const MARGIN = 8;

export function MapBeamPopup({ popup, popupPx, containerRef, onClose }: Props) {
  const container = containerRef.current;
  const cw = container ? container.clientWidth : window.innerWidth;
  const ch = container ? container.clientHeight : window.innerHeight;

  const color = BIOME_COLORS[popup.biome] ?? "#8800ff";

  let cx = popupPx.x + 16;
  let cy = popupPx.y - 60;

  if (cx + CARD_W > cw - MARGIN) cx = popupPx.x - CARD_W - 16;
  if (cx < MARGIN) cx = MARGIN;
  if (cy < MARGIN) cy = popupPx.y + 16;
  if (cy + CARD_H > ch - MARGIN) cy = ch - CARD_H - MARGIN;

  const shortPrincipal =
    popup.principal.length > 12
      ? `${popup.principal.slice(0, 8)}...${popup.principal.slice(-4)}`
      : popup.principal || "unknown";

  return (
    <>
      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.92) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .beam-popup-close:hover { color: rgba(255,255,255,0.7) !important; }
      `}</style>
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: CARD_W,
          zIndex: 9999,
          pointerEvents: "auto",
          animation: "popupIn 0.15s ease-out forwards",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow:
            "0 0 24px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Biome color stripe */}
        <div
          style={{
            height: 2,
            width: "100%",
            background: color,
            borderRadius: "10px 10px 0 0",
            boxShadow: `0 0 8px ${color}`,
          }}
        />

        {/* Card body */}
        <div
          style={{
            position: "relative",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "12px 14px 10px",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            className="beam-popup-close"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Row 1: biome + YOUR LAND tag */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color,
                textShadow: `0 0 8px ${color}`,
                textTransform: "uppercase",
              }}
            >
              {popup.biome.replace(/_/g, " ")}
            </span>
            {popup.isOwner && (
              <span
                style={{
                  fontSize: 8,
                  color,
                  border: `1px solid ${color}`,
                  borderRadius: 3,
                  padding: "1px 5px",
                  letterSpacing: 1,
                  opacity: 0.85,
                  fontFamily: "monospace",
                  flexShrink: 0,
                  marginLeft: 6,
                }}
              >
                YOUR LAND
              </span>
            )}
          </div>

          {/* Row 2: Land ID */}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            LAND #{popup.landId}
          </div>

          {/* Row 3: Principal */}
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "monospace",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            {shortPrincipal}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              marginBottom: 8,
            }}
          />

          {/* Row 4: Mods counter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: 1.5,
                fontFamily: "monospace",
              }}
            >
              MODS INSTALLED
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color,
                textShadow: `0 0 6px ${color}`,
                fontFamily: "monospace",
              }}
            >
              {popup.modCount}/49
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
