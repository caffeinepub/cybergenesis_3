/**
 * ModsLayer.tsx — R3F component that places installed mods on land anchor beacons.
 *
 * Architecture:
 *   - ModsLayer groups installed mods by tier
 *   - For each tier that has mods, mounts a TierModsGroup (lazy Suspense boundary)
 *   - TierModsGroup loads the mega GLB for its tier via useLoader (cached by R3F)
 *   - For each mod, clones the named mesh and places it at its deterministic anchor
 *   - Draco is NOT used (pure KTX2 — see modAnchors.ts for rationale)
 */

import type { ModifierInstance } from "@/backend";
import {
  MOD_GLB_URLS,
  assignAnchors,
  getMeshName,
  lookupCatalogEntry,
} from "@/config/modAnchors";
import { useLoader, useThree } from "@react-three/fiber";
import React, { Suspense, useMemo } from "react";
import type * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

interface ModsLayerProps {
  installedMods: ModifierInstance[];
  anchorPositions: Map<string, THREE.Vector3>;
  landId: bigint;
}

// ── Single mod instance ───────────────────────────────────────────────────────────────
// Separate component so useMemo is called at component level, not inside a loop
function SingleMod({
  gltfScene,
  meshName,
  anchorPos,
}: {
  gltfScene: THREE.Group;
  meshName: string;
  anchorPos: THREE.Vector3;
}) {
  const clone = useMemo(() => {
    const source = gltfScene.getObjectByName(meshName);
    if (!source) {
      console.warn(`[ModsLayer] Mesh "${meshName}" not found in GLB`);
      return null;
    }
    const c = source.clone(true);
    // Reset position — the parent group positions the mod at the anchor
    c.position.set(0, 0, 0);
    // Enable bloom layer so mods glow like the land
    c.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        child.layers.enable(1);
      }
    });
    return c;
  }, [gltfScene, meshName]);

  if (!clone) return null;

  return (
    <group position={[anchorPos.x, anchorPos.y, anchorPos.z]}>
      <primitive object={clone} />
    </group>
  );
}

// ── Per-tier group ─────────────────────────────────────────────────────────────────────
// useLoader MUST be called unconditionally inside this component (R3F rules).
// This component is only mounted when the tier has installed mods.
function TierModsGroup({
  tier,
  mods,
  anchorPositions,
  landId,
}: {
  tier: number;
  mods: ModifierInstance[];
  anchorPositions: Map<string, THREE.Vector3>;
  landId: bigint;
}) {
  const { gl } = useThree();

  const ktx2Loader = useMemo(() => {
    const loader = new KTX2Loader();
    loader.setTranscoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/libs/basis/",
    );
    loader.detectSupport(gl);
    return loader;
  }, [gl]);

  // Loads the mega GLB for this tier — R3F caches by URL so repeated mounts are free
  const gltf = useLoader(GLTFLoader, MOD_GLB_URLS[tier], (loader) => {
    loader.setKTX2Loader(ktx2Loader);
  });

  // Deterministic anchor assignment: same mods always appear at same spots per land
  const anchorMap = useMemo(
    () => assignAnchors(mods, tier, landId),
    [mods, tier, landId],
  );

  return (
    <>
      {mods.map((mod) => {
        const entry = lookupCatalogEntry(mod.modifierType);
        if (!entry) return null;

        const meshName = getMeshName(entry.id, entry.region);
        if (!meshName) return null;

        const anchorName = anchorMap.get(mod.modifierInstanceId.toString());
        if (!anchorName) return null;

        const anchorPos = anchorPositions.get(anchorName);
        if (!anchorPos) return null;

        return (
          <SingleMod
            key={mod.modifierInstanceId.toString()}
            gltfScene={gltf.scene}
            meshName={meshName}
            anchorPos={anchorPos}
          />
        );
      })}
    </>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────────────────
/**
 * ModsLayer renders all installed mods on the current land.
 * - Only mounts tier-groups for tiers that actually have mods (lazy load)
 * - Each tier loads its mega GLB independently via R3F Suspense
 * - Waits for anchor positions to be ready before rendering anything
 */
export default function ModsLayer({
  installedMods,
  anchorPositions,
  landId,
}: ModsLayerProps) {
  // Group by tier — only relevant GLBs will be loaded
  const modsByTier = useMemo(() => {
    const map = new Map<number, ModifierInstance[]>();
    for (const mod of installedMods) {
      const entry = lookupCatalogEntry(mod.modifierType);
      const tier = entry?.tier ?? 1;
      if (!map.has(tier)) map.set(tier, []);
      map.get(tier)!.push(mod);
    }
    return map;
  }, [installedMods]);

  // Don’t render until the land model has surfaced its anchor positions
  if (anchorPositions.size === 0) return null;

  return (
    <>
      {([1, 2, 3, 4, 5] as const).map((tier) => {
        const mods = modsByTier.get(tier);
        if (!mods || mods.length === 0) return null;
        return (
          // Each tier has its own Suspense so others keep rendering if one GLB is slow
          <Suspense key={tier} fallback={null}>
            <TierModsGroup
              tier={tier}
              mods={mods}
              anchorPositions={anchorPositions}
              landId={landId}
            />
          </Suspense>
        );
      })}
    </>
  );
}
