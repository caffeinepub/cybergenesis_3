import { useQuery } from "@tanstack/react-query";
import { Clock, Layers, MapPin, Zap } from "lucide-react";
import type React from "react";
import { useActor } from "../hooks/useActor";
import type { LandData } from "../types/land";

export default function LandDashboard({
  selectedLandIndex,
}: { selectedLandIndex: number }) {
  const { actor } = useActor();

  const { data: lands } = useQuery<LandData[]>({
    queryKey: ["landData"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not initialized");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getLandData();
    },
    enabled: !!actor,
  });

  const land = lands?.[selectedLandIndex];

  if (!land) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9933ff] font-jetbrains">Данные земли недоступны</p>
      </div>
    );
  }

  const biomeKey =
    typeof land.biome === "string"
      ? land.biome
      : Object.keys(land.biome as object)[0];
  const landIdShort = `${String(land.landId).slice(0, 8)}...`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#00ffff] font-orbitron text-glow-cyan">
        УПРАВЛЕНИЕ ЗЕМЛЕЙ
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<MapPin className="w-5 h-5" />}
          label="БИОМ"
          value={biomeKey}
          color="cyan"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="ЭНЕРГИЯ"
          value={String(land.energyLevel ?? "0")}
          color="green"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="УРОВЕНЬ"
          value={String(land.level ?? "1")}
          color="purple"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="ID"
          value={landIdShort}
          color="gold"
        />
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  cyan: "text-[#00ffff] border-[#00ffff]/30 box-glow-cyan",
  green: "text-[#00ff41] border-[#00ff41]/30 box-glow-green",
  purple: "text-[#9933ff] border-[#9933ff]/30 box-glow-purple",
  gold: "text-yellow-400 border-yellow-500/30 box-glow-gold",
};

function StatCard({
  icon,
  label,
  value,
  color,
}: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const cls = colorMap[color] ?? (colorMap.cyan as string);
  const textCls = cls.split(" ")[0];
  return (
    <div className={`glassmorphism p-4 rounded-lg border ${cls} text-center`}>
      <div className={`flex justify-center mb-2 ${textCls}`}>{icon}</div>
      <p className="font-jetbrains text-xs text-muted-foreground uppercase mb-1">
        {label}
      </p>
      <p className={`font-orbitron text-lg font-bold ${textCls}`}>{value}</p>
    </div>
  );
}
