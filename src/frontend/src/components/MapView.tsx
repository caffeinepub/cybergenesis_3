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

const BIOME_REGIONS: Record<
  string,
  { x: [number, number]; y: [number, number] }
> = {
  MYTHIC_VOID: { x: [2580, 3420], y: [2580, 3420] },
  MYTHIC_AETHER: { x: [2580, 3420], y: [2580, 3420] },
  SNOW_PEAK: { x: [880, 1720], y: [2080, 2920] },
  VOLCANIC_CRAG: { x: [4080, 4920], y: [2080, 2920] },
  FOREST_VALLEY: { x: [780, 1620], y: [4080, 4920] },
  DESERT_DUNE: { x: [4280, 5120], y: [4080, 4920] },
  ISLAND_ARCHIPELAGO: { x: [2360, 3440], y: [4780, 5620] },
};

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

interface BeamData {
  latlng: [number, number];
  color: string;
  isOwner: boolean;
  landId: number;
  biome: string;
  principal: string;
}

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

interface InspectorData {
  listing: { itemId: bigint; seller: { toString: () => string } };
  landData: { biome: string; attachedModifications: any[] };
}

const MapView = ({ onClose }: { onClose: () => void }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const beamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const beamDataRef = useRef<BeamData[]>([]);
  const rafRedrawRef = useRef<number | null>(null);
  const hasZoomedRef = useRef(false);

  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isZoomReady, setIsZoomReady] = useState(false);

  const [popup, setPopup] = useState<BeamPopupData | null>(null);
  const [popupPx, setPopupPx] = useState<{ x: number; y: number } | null>(null);

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

  useEffect(() => {
    const t = setTimeout(() => setIsZoomReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Load Leaflet + SmoothWheelZoom plugin
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const loadPlugin = () => {
      if ((window as any).L?.SmoothWheelZoom) {
        setIsEngineReady(true);
        return;
      }
      const plugin = document.createElement("script");
      plugin.src =
        "https://unpkg.com/leaflet.smoothwheelzoom@1.0.0/dist/SmoothWheelZoom.js";
      plugin.async = true;
      plugin.onload = () => setIsEngineReady(true);
      plugin.onerror = () => setIsEngineReady(true);
      document.head.appendChild(plugin);
    };
    if ((window as any).L) {
      loadPlugin();
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => loadPlugin();
      document.head.appendChild(script);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Draw beams on canvas — pure canvas, no DOM markers
  const drawBeams = useCallback(() => {
    const canvas = beamCanvasRef.current;
    const map = mapRef.current;
    if (!canvas || !map) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const beam of beamDataRef.current) {
      const pt = map.latLngToContainerPoint(beam.latlng as any);
      const x = pt.x;
      const baseY = pt.y;
      const h = beam.isOwner ? 140 : 90;
      const topY = baseY - h;
      const [r, g, b] = hexToRgb(beam.color);

      if (beam.isOwner) {
        // Glow halo
        const glowGrad = ctx.createLinearGradient(x, baseY, x, topY);
        glowGrad.addColorStop(0, `rgba(${r},${g},${b},0.45)`);
        glowGrad.addColorStop(0.55, `rgba(${r},${g},${b},0.18)`);
        glowGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, topY);
        ctx.strokeStyle = glowGrad;
        ctx.lineWidth = 13;
        ctx.lineCap = "round";
        ctx.stroke();

        // Core beam
        const coreGrad = ctx.createLinearGradient(x, baseY, x, topY);
        coreGrad.addColorStop(0, `rgba(${r},${g},${b},0.5)`);
        coreGrad.addColorStop(1, `rgba(${r},${g},${b},0.95)`);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, topY);
        ctx.strokeStyle = coreGrad;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Non-owner: thin golden beam
        const [gr, gg, gb] = hexToRgb("#FAD26A");
        const grad = ctx.createLinearGradient(x, baseY, x, topY);
        grad.addColorStop(0, `rgba(${gr},${gg},${gb},0.45)`);
        grad.addColorStop(1, `rgba(${gr},${gg},${gb},0.88)`);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, topY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }
  }, []);

  const scheduleRedraw = useCallback(() => {
    if (rafRedrawRef.current !== null) return;
    rafRedrawRef.current = requestAnimationFrame(() => {
      rafRedrawRef.current = null;
      drawBeams();
    });
  }, [drawBeams]);

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
      maxBoundsViscosity: 0.7,
      inertia: true,
      inertiaDeceleration: 900,
      inertiaMaxSpeed: 2500,
      easeLinearity: 0.2,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      wheelPxPerZoomLevel: 120,
      zoomSnap: 0,
      zoomDelta: 0.3,
      scrollWheelZoom: false,
      smoothWheelZoom: true,
      smoothSensitivity: 1.5,
      fadeAnimation: false,
      markerZoomAnimation: false,
      tap: false,
    });

    const bounds: [[number, number], [number, number]] = [
      [0, 0],
      [MAP_SIZE, MAP_SIZE],
    ];

    L.imageOverlay("/assets/uploads/map_background.webp", bounds, {
      opacity: 1,
      updateWhenZooming: false,
    }).addTo(map);

    MAP_LAYERS.forEach((layer, idx) => {
      const overlay = L.imageOverlay(layer.path, layer.bounds, {
        opacity: 1,
        updateWhenZooming: false,
      });
      if (idx === MAP_LAYERS.length - 1) {
        overlay.on("load", () => setIsImageLoaded(true));
        overlay.on("error", () => setIsImageLoaded(true));
      }
      overlay.addTo(map);
    });

    map.setMaxBounds(bounds);
    map.setView([3000, 3000], -1.3, { animate: false });
    mapRef.current = map;

    const updateMinZoom = () => {
      const scale = Math.max(
        window.innerWidth / MAP_SIZE,
        window.innerHeight / MAP_SIZE,
      );
      map.setMinZoom(Math.log2(scale));
    };
    updateMinZoom();
    window.addEventListener("resize", updateMinZoom);

    // Single click handler with beam hit-test
    map.on("click", (e: any) => {
      if (inspectorOpenRef.current) return;
      const containerPt = map.latLngToContainerPoint(e.latlng);
      let nearest: BeamData | null = null;
      let minDist = 14; // pixel threshold

      for (const beam of beamDataRef.current) {
        const beamPt = map.latLngToContainerPoint(beam.latlng as any);
        const dx = Math.abs(containerPt.x - beamPt.x);
        const dy = containerPt.y - beamPt.y;
        const h = beam.isOwner ? 140 : 90;
        if (dx <= minDist && dy >= -h && dy <= 12) {
          nearest = beam;
          minDist = dx;
        }
      }

      if (nearest) {
        const b = nearest;
        handleBeamClickRef.current?.(
          e,
          b.landId,
          b.biome,
          b.principal,
          b.isOwner,
        );
      } else {
        setPopup(null);
      }
    });

    setIsMapReady(true);
    return () => {
      window.removeEventListener("resize", updateMinZoom);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isEngineReady]);

  // Setup canvas overlay + redraw on map move
  useEffect(() => {
    const map = mapRef.current;
    const container = mapContainerRef.current;
    if (!isMapReady || !map || !container) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:100%",
      "height:100%",
      "pointer-events:none",
      "z-index:599",
    ].join(";");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    container.appendChild(canvas);
    beamCanvasRef.current = canvas;

    const onResize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      scheduleRedraw();
    };

    map.on("move", scheduleRedraw);
    map.on("zoomend", scheduleRedraw);
    window.addEventListener("resize", onResize);

    return () => {
      map.off("move", scheduleRedraw);
      map.off("zoomend", scheduleRedraw);
      window.removeEventListener("resize", onResize);
      canvas.remove();
      beamCanvasRef.current = null;
      if (rafRedrawRef.current !== null) {
        cancelAnimationFrame(rafRedrawRef.current);
        rafRedrawRef.current = null;
      }
    };
  }, [isMapReady, scheduleRedraw]);

  // Stable ref for handleBeamClick to avoid stale closure in map click handler
  const handleBeamClickRef = useRef<any>(null);

  const handleBeamClick = useCallback(
    async (
      e: any,
      landId: number,
      biome: string,
      principal: string,
      isOwner: boolean,
    ) => {
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

  // Keep ref in sync
  useEffect(() => {
    handleBeamClickRef.current = handleBeamClick;
  }, [handleBeamClick]);

  // Popup pixel position tracking
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !popup) {
      setPopupPx(null);
      return;
    }
    let rafId: number | null = null;
    const recalc = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
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
      });
    };
    recalc();
    map.on("move", recalc);
    map.on("zoom", recalc);
    return () => {
      map.off("move", recalc);
      map.off("zoom", recalc);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [popup]);

  // Populate beamDataRef and trigger canvas redraw
  useEffect(() => {
    if (!isMapReady) return;
    if (!myLands && !allLandsPublic) return;

    const beams: BeamData[] = [];
    const renderedIds = new Set<number>();
    let myCoords: [number, number] | null = null;

    if (Array.isArray(allLandsPublic)) {
      for (const land of allLandsPublic as any[]) {
        const id = Number(land.landId);
        const coords = getPointInBiome(id, land.biome);
        const isOwner =
          principalId != null && land.principal?.toString() === principalId;
        if (isOwner && !myCoords) myCoords = coords;
        renderedIds.add(id);
        beams.push({
          latlng: coords,
          color: BIOME_COLORS[land.biome] ?? "#8800ff",
          isOwner,
          landId: id,
          biome: land.biome,
          principal: land.principal?.toString() ?? "",
        });
      }
    }

    if (Array.isArray(myLands)) {
      for (const land of myLands as any[]) {
        const id = Number(land.landId);
        if (!renderedIds.has(id)) {
          const coords = getPointInBiome(id, land.biome);
          if (!myCoords) myCoords = coords;
          beams.push({
            latlng: coords,
            color: BIOME_COLORS[land.biome] ?? "#8800ff",
            isOwner: true,
            landId: id,
            biome: land.biome,
            principal: principalId ?? "",
          });
        } else if (!myCoords) {
          myCoords = getPointInBiome(id, land.biome);
        }
      }
    }

    beamDataRef.current = beams;
    scheduleRedraw();

    const map = mapRef.current;
    if (map && myCoords && !hasZoomedRef.current) {
      hasZoomedRef.current = true;
      map.flyTo(myCoords, -0.5, {
        animate: true,
        duration: 1.8,
        easeLinearity: 0.25,
      });
      setTimeout(() => setIsZoomReady(true), 700);
    } else if (!myCoords) {
      setIsZoomReady(true);
    }
  }, [allLandsPublic, myLands, principalId, isMapReady, scheduleRedraw]);

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
    setPopup(null);
    setPopupPx(null);
  }, [popup]);

  const handleCloseInspector = useCallback(() => {
    inspectorOpenRef.current = false;
    setInspectorOpen(false);
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
        .leaflet-pane { will-change:transform; backface-visibility:hidden; transform:translateZ(0); }
        .leaflet-zoom-animated { will-change:transform; }
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
  touchAction: "pan-x pan-y",
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
