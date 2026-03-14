import React, { useEffect, useRef } from "react";

const BIOME_COLORS: Record<
  string,
  { primary: string; secondary: string; name: string }
> = {
  Quantum: { primary: "#00ffff", secondary: "#0099ff", name: "QUANTUM" },
  Volcanic: { primary: "#ff4400", secondary: "#ff8800", name: "VOLCANIC" },
  Arctic: { primary: "#88ddff", secondary: "#0066aa", name: "ARCTIC" },
  Neon: { primary: "#ff00ff", secondary: "#9933ff", name: "NEON" },
  Cyber: { primary: "#00ff41", secondary: "#009933", name: "CYBER" },
  Shadow: { primary: "#6600cc", secondary: "#330066", name: "SHADOW" },
  Crystal: { primary: "#ffdd00", secondary: "#ff9900", name: "CRYSTAL" },
};

type BiomeVariant = { primary: string; secondary: string; name: string };

function getBiome(biome: string | Record<string, unknown>): BiomeVariant {
  const key =
    typeof biome === "string" ? biome : (Object.keys(biome)[0] ?? "Quantum");
  return BIOME_COLORS[key] ?? (BIOME_COLORS.Quantum as BiomeVariant);
}

export default function CubeVisualization({
  biome,
}: { biome: string | Record<string, unknown> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bm = getBiome(biome);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;
    let raf: number;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const size = Math.min(W, H) * 0.22;

      angle += 0.008;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const cosY = Math.cos(angle * 0.7);
      const sinY = Math.sin(angle * 0.7);

      const project = (x: number, y: number, z: number): [number, number] => {
        const rx = x * cos - z * sin;
        const ry = y * cosY - (x * sin + z * cos) * sinY * 0.5;
        return [cx + rx * size, cy + ry * size];
      };

      const vertices: [number, number, number][] = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ];
      const faces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 1, 5, 4],
        [2, 3, 7, 6],
        [0, 3, 7, 4],
        [1, 2, 6, 5],
      ];

      const projected = vertices.map(([x, y, z]) => project(x, y, z));

      ctx.save();
      ctx.shadowColor = bm.primary;
      ctx.shadowBlur = 30;

      for (let i = 0; i < faces.length; i++) {
        const face = faces[i];
        const pts = face.map((vi) => projected[vi]);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.closePath();

        const alpha = 0.15 + (i / faces.length) * 0.25;
        const alphaHex = Math.floor(alpha * 255)
          .toString(16)
          .padStart(2, "0");
        ctx.fillStyle = `${i % 2 === 0 ? bm.primary : bm.secondary}${alphaHex}`;
        ctx.fill();
        ctx.strokeStyle = `${bm.primary}cc`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      ctx.font = `bold ${Math.floor(W * 0.04)}px Orbitron, sans-serif`;
      ctx.fillStyle = bm.primary;
      ctx.textAlign = "center";
      ctx.shadowColor = bm.primary;
      ctx.shadowBlur = 15;
      ctx.fillText(bm.name, cx, H - 30);
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth || 600;
      canvas.height = canvas.offsetHeight || 400;
    };
    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [bm.primary, bm.secondary, bm.name]);

  return (
    <div className="cube-container">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: "65vh" }}
      />
    </div>
  );
}
