import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star } from "lucide-react";
import {
  PLANNED_MODIFIER_CATALOG,
  type PlannedModifier,
} from "../data/modifierCatalog";

export default function Collection() {
  const tierCounts = PLANNED_MODIFIER_CATALOG.reduce(
    (acc, mod) => {
      acc[mod.rarity_tier] = (acc[mod.rarity_tier] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
      <Card className="glassmorphism border-primary/30">
        <CardHeader>
          <CardTitle className="font-orbitron text-3xl text-glow-teal flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            MODIFIER COLLECTION
          </CardTitle>
          <p className="font-jetbrains text-sm text-muted-foreground mt-2">
            Explore the complete catalog of modifiers available in CyberGenesis.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                tier: 1,
                label: "Common",
                cls: "border-gray-500/20",
                textCls: "text-gray-400",
              },
              {
                tier: 2,
                label: "Rare",
                cls: "border-blue-500/20",
                textCls: "text-blue-400",
              },
              {
                tier: 3,
                label: "Legendary",
                cls: "border-purple-500/20",
                textCls: "text-purple-400",
              },
              {
                tier: 4,
                label: "Mythic",
                cls: "border-yellow-500/20",
                textCls: "text-yellow-400",
              },
            ].map(({ tier, label, cls, textCls }) => (
              <div
                key={tier}
                className={`glassmorphism p-4 rounded-lg border ${cls} text-center`}
              >
                <p className="font-jetbrains text-xs text-muted-foreground uppercase mb-1">
                  {label}
                </p>
                <p className={`font-orbitron text-2xl font-bold ${textCls}`}>
                  {tierCounts[tier] || 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

const TIER_BADGE_VARIANTS: Record<
  number,
  "default" | "secondary" | "outline" | "destructive"
> = {
  1: "outline",
  2: "secondary",
  3: "default",
  4: "destructive",
};
const TIER_NAMES: Record<number, string> = {
  1: "COMMON",
  2: "RARE",
  3: "LEGENDARY",
  4: "MYTHIC",
};
const TIER_COLORS: Record<number, string> = {
  1: "text-gray-400",
  2: "text-blue-400",
  3: "text-purple-400",
  4: "text-yellow-400",
};
const TIER_BORDERS: Record<number, string> = {
  1: "border-gray-500/30 hover:border-gray-400/50",
  2: "border-blue-500/30 hover:border-blue-400/50",
  3: "border-purple-500/30 hover:border-purple-400/50",
  4: "border-yellow-500/30 hover:border-yellow-400/50",
};
const TIER_GLOWS: Record<number, string> = {
  1: "drop-shadow(0 0 4px rgba(156,163,175,0.3))",
  2: "drop-shadow(0 0 8px rgba(96,165,250,0.5))",
  3: "drop-shadow(0 0 12px rgba(168,85,247,0.6))",
  4: "drop-shadow(0 0 16px rgba(250,204,21,0.8))",
};

function ModifierCard({
  modifier,
  index,
}: { modifier: PlannedModifier; index: number }) {
  const tier = modifier.rarity_tier;
  return (
    <div
      className={`glassmorphism p-3 rounded-lg border ${TIER_BORDERS[tier] ?? "border-primary/30"} transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom`}
      style={{ animationDelay: `${index * 20}ms`, animationDuration: "400ms" }}
    >
      <div className="flex flex-col items-center gap-2">
        <img
          src={modifier.asset_url}
          alt={modifier.name}
          className="w-16 h-16 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ filter: TIER_GLOWS[tier] ?? "none" }}
        />
        <Badge
          variant={TIER_BADGE_VARIANTS[tier] ?? "outline"}
          className="font-jetbrains text-[10px] px-2 py-0"
        >
          {TIER_NAMES[tier] ?? "UNKNOWN"}
        </Badge>
        <div className="text-center w-full">
          <p
            className={`font-orbitron text-xs font-bold ${TIER_COLORS[tier] ?? "text-primary"} truncate`}
          >
            {modifier.name}
          </p>
          <p className="font-jetbrains text-[10px] text-muted-foreground">
            ID: {modifier.id}
          </p>
        </div>
      </div>
    </div>
  );
}
