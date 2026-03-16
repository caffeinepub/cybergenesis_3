import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const MAP_SIZE = 2560;
const RAW_MAP_URL = "/assets/uploads/IMG_0133-1.webp";

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
  MYTHIC_VOID: { x: [1150, 1410], y: [1150, 1410] },
  MYTHIC_AETHER: { x: [1150, 1410], y: [1150, 1410] },
  VOLCANIC_CRAG: { x: [1800, 2300], y: [500, 1000] },
  DESERT_DUNE: { x: [1700, 2350], y: [1700, 2300] },
  FOREST_VALLEY: { x: [400, 900], y: [1200, 1700] },
  SNOW_PEAK: { x: [300, 1000], y: [400, 800] },
  ISLAND_ARCHIPELAGO: { x: [300, 1100], y: [1900, 2400] },
};

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
  const [r, g, b] = hexToRgb(color);
  const h = isOwner ? 140 : 90;
  const coreW = isOwner ? 4 : 2;
  const glowW = isOwner ? 32 : 22;
  const blurPx = isOwner ? 7 : 5;

  const coreShadow = isOwner
    ? `0 0 5px 2px rgba(${r},${g},${b},1), 0 0 14px 4px rgba(${r},${g},${b},0.8), 0 0 28px 6px rgba(${r},${g},${b},0.4)`
    : `0 0 4px 1px rgba(${r},${g},${b},0.9), 0 0 10px 3px rgba(${r},${g},${b},0.6)`;

  const html = `
    <div style="position:relative;width:${glowW}px;height:${h}px;pointer-events:none;">
      <div style="
        position:absolute;
        left:50%;
        transform:translateX(-50%);
        width:${glowW}px;
        height:${h}px;
        background:linear-gradient(to bottom,transparent 0%,rgba(${r},${g},${b},0.35) 40%,rgba(${r},${g},${b},0.65) 100%);
        border-radius:${glowW / 2}px;
        filter:blur(${blurPx}px);
      "></div>
      <div style="
        position:absolute;
        left:50%;
        transform:translateX(-50%);
        width:${coreW}px;
        height:${h}px;
        background:linear-gradient(to bottom,rgba(${r},${g},${b},0.55) 0%,rgba(${r},${g},${b},1) 100%);
        border-radius:${coreW / 2}px;
        box-shadow:${coreShadow};
      "></div>
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [glowW, h],
    iconAnchor: [glowW / 2, h],
  });
}

const MapView = ({ onClose }: { onClose: () => void }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const beamLayerRef = useRef<any>(null);
  const hasZoomedRef = useRef(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isZoomReady, setIsZoomReady] = useState(false);

  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? null;

  const { data: lands } = useQuery({
    queryKey: ["landData"],
    queryFn: () => actor?.getLandData(),
    enabled: !!actor,
  });

  // Failsafe: mark zoom ready after 6s in case lands never arrive
  useEffect(() => {
    const t = setTimeout(() => setIsZoomReady(true), 6000);
    return () => clearTimeout(t);
  }, []);

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

  useEffect(() => {
    if (!isEngineReady || !mapContainerRef.current || mapRef.current) return;
    const L = (window as any).L;
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
      zoomControl: false,
      attributionControl: false,
      maxBoundsViscosity: 1.0,
      inertia: true,
      inertiaDeceleration: 400,
      inertiaMaxSpeed: 6000,
      easeLinearity: 0.1,
      zoomAnimation: true,
      zoomAnimationThreshold: 4,
      wheelPxPerZoomLevel: 35,
      scrollWheelZoom: false,
    });
    const bounds: [[number, number], [number, number]] = [
      [0, 0],
      [MAP_SIZE, MAP_SIZE],
    ];
    const overlay = L.imageOverlay(RAW_MAP_URL, bounds);
    overlay.on("load", () => setIsImageLoaded(true));
    overlay.on("error", () => setIsImageLoaded(true));
    overlay.addTo(map);
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
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

    // CSS acceleration hint for leaflet panes
    const perfStyle = document.createElement("style");
    perfStyle.textContent = ".leaflet-pane { will-change: transform; }";
    document.head.appendChild(perfStyle);

    // Smooth custom wheel zoom
    let zoomTarget = map.getZoom();
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.4 : -0.4;
      zoomTarget = Math.max(
        map.getMinZoom(),
        Math.min(map.getMaxZoom(), zoomTarget + delta),
      );
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        const containerPoint = L.point(e.clientX, e.clientY);
        const latlng = map.containerPointToLatLng(containerPoint);
        map.flyTo(latlng, zoomTarget, { duration: 0.35, easeLinearity: 0.1 });
      }, 30);
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

  // Draw beams + zoom to owner's land once
  useEffect(() => {
    const map = mapRef.current;
    const beamLayer = beamLayerRef.current;
    if (!isMapReady || !map || !beamLayer || !lands || !(window as any).L)
      return;
    const L = (window as any).L;
    beamLayer.clearLayers();

    let myCoords: [number, number] | null = null;
    try {
      for (const land of lands as any[]) {
        const coords = getPointInBiome(Number(land.landId), land.biome);
        const isOwner =
          principalId != null && land.principal?.toString() === principalId;
        if (isOwner && !myCoords) myCoords = coords;
        const color = BIOME_COLORS[land.biome] ?? "#8800ff";
        L.marker(coords, { icon: makeBeamIcon(L, color, isOwner) }).addTo(
          beamLayer,
        );
      }
    } catch (e) {
      console.warn("[MapView] beam render error:", e);
    }

    if (myCoords && !hasZoomedRef.current) {
      hasZoomedRef.current = true;
      map.flyTo(myCoords, 1.5, {
        animate: true,
        duration: 1.8,
        easeLinearity: 0.2,
      });
      setTimeout(() => setIsZoomReady(true), 700);
    } else if (!myCoords) {
      setIsZoomReady(true);
    }
  }, [lands, principalId, isMapReady]);

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
        style={{ width: "100%", height: "100%", background: "#000" }}
      />
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
