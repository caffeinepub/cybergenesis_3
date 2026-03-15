import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

interface LandModelProps {
  modelUrl: string;
  biome?: string;
  debugEmissive?: number;
}

export default function LandModel({
  modelUrl,
  biome,
  debugEmissive,
}: LandModelProps) {
  const { gl, camera } = useThree();
  const fittedRef = useRef(false);
  const isInitialized = useRef(false);
  const group = useRef<THREE.Group>(null);
  const debugEmissiveRef = useRef<number | undefined>(debugEmissive);

  useEffect(() => {
    debugEmissiveRef.current = debugEmissive;
  }, [debugEmissive]);

  const ktx2Loader = useMemo(() => {
    const loader = new KTX2Loader();
    loader.setTranscoderPath(
      "https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/libs/basis/",
    );
    loader.detectSupport(gl);
    return loader;
  }, [gl]);

  const gltf = useLoader(GLTFLoader, modelUrl, (loader) => {
    loader.setKTX2Loader(ktx2Loader);
  });

  useEffect(() => {
    if (!gltf || !gltf.scene || isInitialized.current) return;
    console.log(
      "[LandModel] Processing model with biome-specific lighting and max anisotropy:",
      modelUrl,
      "Biome:",
      biome,
    );
    gltf.scene.updateMatrixWorld();
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    console.log("[LandModel] Maximum anisotropy capability:", maxAnisotropy);
    const landType = biome || "DEFAULT";
    const settings: Record<string, { env: number; emissive: number }> = {
      MYTHIC_VOID: { env: 3.0, emissive: 1.0 },
      ISLAND_ARCHIPELAGO: { env: 3.0, emissive: 1.0 },
      DESERT_DUNE: { env: 1.0, emissive: 1.0 },
      VOLCANIC_CRAG: { env: 1.5, emissive: 1.0 },
      FOREST_VALLEY: { env: 1.0, emissive: 1.0 },
      MYTHIC_AETHER: { env: 1.0, emissive: 1.0 },
      DEFAULT: { env: 1.0, emissive: 1.0 },
    };
    const config = settings[landType] || settings.DEFAULT;
    console.log("[LandModel] Applying biome config:", landType, config);
    if (gltf.scene?.isObject3D) {
      gltf.scene.traverse((obj: any) => {
        if (obj.isMesh && obj.material) {
          obj.frustumCulled = true;
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          let hasEmissiveMap = false;
          for (const m of materials as THREE.MeshStandardMaterial[]) {
            m.dithering = true;
            m.envMapIntensity = config.env;
            if (m.emissiveMap) {
              hasEmissiveMap = true;
              m.emissive = new THREE.Color(0xffffff);
              m.toneMapped = false;
              m.userData.baseEmissive = config.emissive;
              console.log(
                `[LandModel] Emissive enabled: baseEmissive=${config.emissive}, envMapIntensity=${config.env}`,
              );
            } else {
              m.emissive = new THREE.Color(0x000000);
              m.userData.baseEmissive = 0.0;
              console.log(
                "[LandModel] No emissive map detected, glow disabled",
              );
            }
            const textures = [
              m.map,
              m.emissiveMap,
              m.normalMap,
              m.metalnessMap,
              m.roughnessMap,
            ];
            for (const tex of textures) {
              if (tex) {
                tex.anisotropy = maxAnisotropy;
                tex.needsUpdate = true;
              }
            }
            console.log(
              `[LandModel] Anisotropy applied to textures: ${textures.filter((t) => t).length} textures updated`,
            );
          }
          if (hasEmissiveMap) {
            obj.layers.enable(1);
            console.log(
              `[LandModel] Mesh "${obj.name}" assigned to Layer 1 (emissive/bloom target)`,
            );
          }
        }
      });
    }
    if (!fittedRef.current && camera instanceof THREE.PerspectiveCamera) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      fittedRef.current = true;
      console.log("[LandModel] Camera auto-fitted to model bounds");
    }
    isInitialized.current = true;
  }, [gltf, gl, camera, modelUrl, biome]);

  useFrame((state) => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const m of materials as THREE.MeshStandardMaterial[]) {
          if (
            m.emissiveMap ||
            (m.emissive && !m.emissive.equals(new THREE.Color(0x000000)))
          ) {
            const baseIntensity: number =
              debugEmissiveRef.current ?? m.userData.baseEmissive ?? 1.0;
            m.emissiveIntensity =
              baseIntensity *
              (1.0 + Math.sin(state.clock.elapsedTime * 0.8) * 0.15);
          }
        }
      }
    });
  });

  return (
    <group ref={group}>
      <primitive object={gltf.scene} />
    </group>
  );
}
