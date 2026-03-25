import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetLandData } from "../hooks/useQueries";
import { type BeamPopupData, MapBeamPopup } from "./MapBeamPopup";
import { MapInspectorOverlay } from "./MapInspectorOverlay";

const MAP_SIZE = 6000;

const BIOME_COLORS: Record<string, string> = {
  MYTHIC_VOID: "#cc00ff",
  MYTHIC_AETHER: "#0088ff",
  VOLCANIC_CRAG: "#ff2200",
  DESERT_DUNE: "#ffaa00",
  FOREST_VALLEY: "#00ff44",
  SNOW_PEAK: "#88ddff",
  ISLAND_ARCHIPELAGO: "#00ffcc",
};

// BIOME_REGIONS — calibrated from % offsets inside each PNG's bounds
// x = longitude, y = latitude (Leaflet CRS.Simple)
//
// SNOW_PEAK        image [[1800,600],[3200,2000]] lat×lng 1400×1400
//   xMin0.06→684  xMax0.94→1916  yMin0.08→1912  yMax0.93→3102
// VOLCANIC_CRAG   image [[1800,3800],[3200,5200]] lat×lng 1400×1400
//   xMin0.04→3856 xMax0.96→5144  yMin0.14→1996  yMax0.95→3130
// DESERT_DUNE     image [[3800,4000],[5200,5400]] lat×lng 1400×1400
//   xMin0.06→4084 xMax0.94→5316  yMin0.14→3996  yMax0.96→5144
// FOREST_VALLEY   image [[3800,500],[5200,1900]]  lat×lng 1400×1400
//   xMin0.04→556  xMax0.95→1830  yMin0.10→3940  yMax0.94→5116
// ISLAND_ARCHIPELAGO image [[4500,2000],[5900,3800]] lat1400×lng1800
//   xMin0.03→2054 xMax0.97→3746  yMin0.15→4710  yMax0.98→5872
// MYTHIC          image [[2300,2300],[3700,3700]] lat×lng 1400×1400
//   xMin0.06→2384 xMax0.95→3630  yMin0.08→2412  yMax0.96→3644
const BIOME_REGIONS: Record<
  string,
  { x: [number, number]; y: [number, number] }
> = {
  // 20% inward offset from each PNG edge to avoid transparent margins
  MYTHIC_VOID: { x: [2580, 3420], y: [2580, 3420] },
  MYTHIC_AETHER: { x: [2580, 3420], y: [2580, 3420] },
  SNOW_PEAK: { x: [880, 1720], y: [2080, 2920] },
  VOLCANIC_CRAG: { x: [4080, 4920], y: [2080, 2920] },
  FOREST_VALLEY: { x: [780, 1620], y: [4080, 4920] },
  DESERT_DUNE: { x: [4280, 5120], y: [4080, 4920] },
  ISLAND_ARCHIPELAGO: { x: [2360, 3440], y: [4780, 5620] },
};

// Image overlays: background + 6 regions
const MAP_LAYERS = [
  {
    path: "/assets/uploads/map_mythic.webp",
    bounds: [
      [2300, 2300],
      [3700, 3700],
    ] as [[number, number], [number, number]],
  },
  {
    path: "/assets/uploads/map_snow_peak.webp",
    bounds: [
      [1800, 600],
      [3200, 2000],
    ] as [[number, number], [number, number]],
  },
  {
    path: "/assets/uploads/map_volcanic_crag.webp",
    bounds: [
      [1800, 3800],
      [3200, 5200],
    ] as [[number, number], [number, number]],
  },
  {
    path: "/assets/uploads/map_forest_valley.webp",
    bounds: [
      [3800, 500],
      [5200, 1900],
    ] as [[number, number], [number, number]],
  },
  {
    path: "/assets/uploads/map_desert_dune.webp",
    bounds: [
      [3800, 4000],
      [5200, 5400],
    ] as [[number, number], [number, number]],
  },
  {
    path: "/assets/uploads/map_island_archipelago.webp",
    bounds: [
      [4500, 2000],
      [5900, 3800],
    ] as [[number, number], [number, number]],
  },
];

function getPointInBiome(landId: number, biome: string): [number, number] {
  const seed = landId * 1337.42;
  const r = (offset: number) => Math.abs(Math.sin(seed + offset));
  const zone = BIOME_REGIONS[biome] ?? BIOME_REGIONS.MYTHIC_VOID;
  return [
    zone.y[0] + r(1) * (zone.y[1] - zone.y[0]),
    zone.x[0] + r(2) * (zone.x[1] - zone.x[0]),
  ];
}

function hexToRgb(hex: string): [number, number, number] {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function makeBeamIcon(L: any, color: string, isOwner: boolean) {
  const h = isOwner ? 140 : 90;
  const coreW = isOwner ? 2 : 1;
  const glowW = isOwner ? 14 : 5;
  const blurPx = isOwner ? 2 : 0;

  const effectiveColor = isOwner ? color : "#FAD26A";
  const [r, g, b] = hexToRgb(effectiveColor);

  const coreShadow = isOwner
    ? `0 0 3px 1px rgba(${r},${g},${b},1), 0 0 6px 2px rgba(${r},${g},${b},0.6)`
    : "none";

  const html = `
    <div style="position:relative;width:${glowW}px;height:${h}px;cursor:pointer;">
      ${
        isOwner
          ? `<div style="
        position:absolute;
        left:50%;
        transform:translateX(-50%);
        width:${glowW}px;
        height:${h}px;
        background:linear-gradient(to bottom,rgba(${r},${g},${b},0.5) 0%,rgba(${r},${g},${b},0.2) 55%,transparent 100%);
        border-radius:${glowW / 2}px ${glowW / 2}px 2px 2px;
        filter:blur(${blurPx}px);
        pointer-events:none;
      "></div>`
          : ""
      }
      <div style="
        position:absolute;
        left:50%;
        transform:translateX(-50%);
        width:${coreW}px;
        height:${h}px;
        background:linear-gradient(to bottom,rgba(${r},${g},${b},0.5) 0%,rgba(${r},${g},${b},0.9) 100%);
        border-radius:${coreW / 2}px;
        box-shadow:${coreShadow};
        pointer-events:none;
      "></div>
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [glowW, h],
    iconAnchor: [glowW / 2, h],
  });
}

// Separate inspector data state so closing the popup doesn't break the modal
interface InspectorData {
  listing: { itemId: bigint; seller: { toString: () => string } };
  landData: { biome: string; attachedModifications: any[] };
}

const MapView = ({ onClose }: { onClose: () => void }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const beamLayerRef = useRef<any>(null);
  const hasZoomedRef = useRef(false);
  const beamClickedRef = useRef(false);

  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isZoomReady, setIsZoomReady] = useState(false);

  // Popup state
  const [popup, setPopup] = useState<BeamPopupData | null>(null);
  const [popupPx, setPopupPx] = useState<{ x: number; y: number } | null>(null);

  // Inspector state — independent from popup so popup close doesn't kill modal
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const inspectorOpenRef = useRef(false);
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(
    null,
  );

  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? null;

  const { data: myLands } = useGetLandData();
  const { data: allLandsPublic } = useQuery({
    queryKey: ["allLandsPublic"],
    queryFn: () => actor?.getAllLandsPublic(),
    enabled: !!actor,
  });

  // Failsafe: mark zoom ready after 6s
  useEffect(() => {
    const t = setTimeout(() => setIsZoomReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Load Leaflet
  useEffect(() => {
    document.body.style.overflow = "hidden";
    if ((window as any).L) {
      setIsEngineReady(true);
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setIsEngineReady(true);
      document.head.appendChild(script);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Init map
  useEffect(() => {
    if (!isEngineReady || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 1.0,
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 1.0,
      inertia: true,
      inertiaDeceleration: 300,
      inertiaMaxSpeed: 800,
      easeLinearity: 0.2,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      wheelPxPerZoomLevel: 60,
      scrollWheelZoom: false,
      fadeAnimation: false,
    });

    const bounds: [[number, number], [number, number]] = [
      [0, 0],
      [MAP_SIZE, MAP_SIZE],
    ];

    // 1. Background layer (cosmos) — full 6000x6000
    L.imageOverlay("/assets/uploads/map_background.webp", bounds, {
      opacity: 1,
    }).addTo(map);

    // 2. Regional PNG overlays (with transparency)
    MAP_LAYERS.forEach((layer, idx) => {
      const overlay = L.imageOverlay(layer.path, layer.bounds, { opacity: 1 });
      if (idx === MAP_LAYERS.length - 1) {
        overlay.on("load", () => setIsImageLoaded(true));
        overlay.on("error", () => setIsImageLoaded(true));
      }
      overlay.addTo(map);
    });

    map.setMaxBounds(bounds);
    map.setView([3000, 3000], -1.3, { animate: false });
    mapRef.current = map;
    beamLayerRef.current = L.layerGroup().addTo(map);

    const updateMinZoom = () => {
      const scale = Math.max(
        window.innerWidth / MAP_SIZE,
        window.innerHeight / MAP_SIZE,
      );
      map.setMinZoom(Math.log2(scale));
    };
    updateMinZoom();
    window.addEventListener("resize", updateMinZoom);

    // Close popup on map click — but only when inspector is closed
    map.on("click", () => {
      if (beamClickedRef.current) {
        beamClickedRef.current = false;
        return;
      }
      if (!inspectorOpenRef.current) setPopup(null);
    });

    // GPU hint
    const perfStyle = document.createElement("style");
    perfStyle.textContent = `
      .leaflet-pane { will-change: transform; }
      .leaflet-zoom-animated { will-change: transform; }
    `;
    document.head.appendChild(perfStyle);

    let zoomTarget = map.getZoom();
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.35 : -0.35;
      zoomTarget = Math.max(
        map.getMinZoom(),
        Math.min(map.getMaxZoom(), zoomTarget + delta),
      );
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const containerPoint = L.point(e.clientX, e.clientY);
        const latlng = map.containerPointToLatLng(containerPoint);
        map.setZoomAround(latlng, zoomTarget, {
          animate: true,
          duration: 0.25,
        });
      }, 35);
    };
    mapContainerRef.current?.addEventListener("wheel", onWheel, {
      passive: false,
    });

    setIsMapReady(true);
    return () => {
      window.removeEventListener("resize", updateMinZoom);
      mapContainerRef.current?.removeEventListener("wheel", onWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        beamLayerRef.current = null;
      }
    };
  }, [isEngineReady]);

  // Handle beam click — fetch live data, set popup
  const handleBeamClick = useCallback(
    async (
      e: any,
      landId: number,
      biome: string,
      principal: string,
      isOwner: boolean,
    ) => {
      e.originalEvent?.stopPropagation();
      const map = mapRef.current;
      if (!map) return;

      const latlng = e.latlng;
      let modCount = 0;
      let liveBiome = biome;
      let livePrincipal = principal;
      let attachedModifications: any[] = [];

      try {
        const result = await actor?.getLandDataById(BigInt(landId));
        if (result && result.__kind__ === "Some") {
          attachedModifications = result.value.attachedModifications ?? [];
          modCount = attachedModifications.length;
          livePrincipal = result.value.principal?.toString() ?? principal;
          liveBiome = result.value.biome ?? biome;
        }
      } catch (_) {}

      beamClickedRef.current = true;
      setPopup({
        landId,
        biome: liveBiome,
        principal: livePrincipal,
        modCount,
        attachedModifications,
        latlng,
        isOwner,
      });
    },
    [actor],
  );

  // Recalculate popup pixel position on map move/zoom
  // Auto-close if beam goes out of the container viewport
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !popup) {
      setPopupPx(null);
      return;
    }

    const recalc = () => {
      const pt = map.latLngToContainerPoint(popup.latlng);
      const container = mapContainerRef.current;
      const cw = container ? container.clientWidth : window.innerWidth;
      const ch = container ? container.clientHeight : window.innerHeight;

      const CLOSE_MARGIN = 40;
      if (
        pt.x < -CLOSE_MARGIN ||
        pt.x > cw + CLOSE_MARGIN ||
        pt.y < -CLOSE_MARGIN ||
        pt.y > ch + CLOSE_MARGIN
      ) {
        setPopup(null);
        setPopupPx(null);
        return;
      }

      setPopupPx({ x: pt.x, y: pt.y });
    };

    recalc();
    map.on("move", recalc);
    map.on("zoom", recalc);
    return () => {
      map.off("move", recalc);
      map.off("zoom", recalc);
    };
  }, [popup]);

  // Draw beams
  useEffect(() => {
    const map = mapRef.current;
    const beamLayer = beamLayerRef.current;
    if (!isMapReady || !map || !beamLayer || !(window as any).L) return;
    if (!myLands && !allLandsPublic) return;
    const L = (window as any).L;
    beamLayer.clearLayers();

    const renderedLandIds = new Set<number>();
    let myCoords: [number, number] | null = null;

    if (Array.isArray(allLandsPublic)) {
      try {
        for (const land of allLandsPublic as any[]) {
          const id = Number(land.landId);
          const coords = getPointInBiome(id, land.biome);
          const isOwner =
            principalId != null && land.principal?.toString() === principalId;
          if (isOwner && !myCoords) myCoords = coords;
          renderedLandIds.add(id);
          const color = BIOME_COLORS[land.biome] ?? "#8800ff";
          const marker = L.marker(coords, {
            icon: makeBeamIcon(L, color, isOwner),
          });
          marker.on("click", (e: any) =>
            handleBeamClick(
              e,
              id,
              land.biome,
              land.principal?.toString() ?? "",
              isOwner,
            ),
          );
          marker.addTo(beamLayer);
        }
      } catch (e) {
        console.warn("[MapView] allLandsPublic beam render error:", e);
      }
    }

    if (Array.isArray(myLands)) {
      try {
        for (const land of myLands as any[]) {
          const id = Number(land.landId);
          if (!renderedLandIds.has(id)) {
            const coords = getPointInBiome(id, land.biome);
            if (!myCoords) myCoords = coords;
            const color = BIOME_COLORS[land.biome] ?? "#8800ff";
            const marker = L.marker(coords, {
              icon: makeBeamIcon(L, color, true),
            });
            marker.on("click", (e: any) =>
              handleBeamClick(e, id, land.biome, principalId ?? "", true),
            );
            marker.addTo(beamLayer);
          } else if (!myCoords) {
            myCoords = getPointInBiome(id, land.biome);
          }
        }
      } catch (e) {
        console.warn("[MapView] myLands beam render error:", e);
      }
    }

    if (myCoords && !hasZoomedRef.current) {
      hasZoomedRef.current = true;
      map.flyTo(myCoords, -0.5, {
        animate: true,
        duration: 1.8,
        easeLinearity: 0.2,
      });
      setTimeout(() => setIsZoomReady(true), 700);
    } else if (!myCoords) {
      setIsZoomReady(true);
    }
  }, [allLandsPublic, myLands, principalId, isMapReady, handleBeamClick]);

  // Open inspector — save data independently so popup can be closed without breaking modal
  const handleOpenInspector = useCallback(() => {
    if (!popup) return;
    setInspectorData({
      listing: {
        itemId: BigInt(popup.landId),
        seller: { toString: () => popup.principal },
      },
      landData: {
        biome: popup.biome,
        attachedModifications: popup.attachedModifications,
      },
    });
    inspectorOpenRef.current = true;
    setInspectorOpen(true);
  }, [popup]);

  const handleCloseInspector = useCallback(() => {
    inspectorOpenRef.current = false;
    setInspectorOpen(false);
    // Small delay before clearing data so closing animation finishes
    setTimeout(() => setInspectorData(null), 300);
  }, []);

  const showOverlay = !isEngineReady || !isImageLoaded || !isZoomReady;

  const content = (
    <div style={containerStyle}>
      {showOverlay && (
        <div style={loadingOverlayStyle}>
          <div className="cyber-loader">
            <div className="loader-text">SCANNING SECTORS...</div>
            <div className="loader-bar" />
          </div>
        </div>
      )}
      <div
        ref={mapContainerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: "#000",
        }}
      >
        {/* Popup card */}
        {popup && popupPx && (
          <MapBeamPopup
            popup={popup}
            popupPx={popupPx}
            containerRef={mapContainerRef}
            onClose={() => setPopup(null)}
            onInspect={handleOpenInspector}
          />
        )}
      </div>

      {/* Inspector overlay — rendered inside MapView container, above Leaflet (z-index 500) */}
      {inspectorData && (
        <MapInspectorOverlay
          open={inspectorOpen}
          onClose={handleCloseInspector}
          landId={Number(inspectorData.listing.itemId)}
          biome={inspectorData.landData.biome}
          principal={inspectorData.listing.seller.toString()}
          mods={inspectorData.landData.attachedModifications as any}
        />
      )}

      <button type="button" onClick={onClose} style={closeButtonStyle}>
        ✕ EXIT
      </button>
      <style>{`
        .leaflet-container { background:#000 !important; cursor:crosshair; }
        .leaflet-marker-icon,.leaflet-marker-shadow { background:none; border:none; }
        .cyber-loader { text-align:center; }
        .loader-text { color:#00ff41; font-family:monospace; font-size:12px; letter-spacing:3px; }
        .loader-bar { width:120px; height:1px; background:#00ff41; margin:10px auto; animation:slide 2s infinite; }
        @keyframes slide { 0%{transform:scaleX(0);} 50%{transform:scaleX(1);} 100%{transform:scaleX(0);} }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  background: "#000",
  overflow: "hidden",
  touchAction: "none",
  isolation: "isolate",
};
const loadingOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2147483640,
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const closeButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "15px",
  right: "15px",
  zIndex: 2147483646,
  padding: "6px 14px",
  fontSize: "10px",
  background: "rgba(0,0,0,0.7)",
  color: "#00ff41",
  border: "1px solid #00ff41",
  borderRadius: "3px",
  cursor: "pointer",
  fontFamily: "monospace",
  letterSpacing: "1px",
  backdropFilter: "blur(10px)",
};

export default MapView;
