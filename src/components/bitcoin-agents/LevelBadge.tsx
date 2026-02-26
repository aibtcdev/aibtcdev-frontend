"use client";

import { Badge } from "@/components/ui/badge";
import type { BitcoinAgentLevel } from "@/types";
import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: BitcoinAgentLevel;
  xp?: number;
  size?: "sm" | "md" | "lg";
  showXp?: boolean;
}

const LEVEL_STYLES: Record<BitcoinAgentLevel, string> = {
  hatchling: "bg-gray-100 text-gray-800 border-gray-300",
  junior: "bg-green-100 text-green-800 border-green-300",
  senior: "bg-blue-100 text-blue-800 border-blue-300",
  elder: "bg-purple-100 text-purple-800 border-purple-300",
  legendary:
    "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-400",
};

const LEVEL_ICONS: Record<BitcoinAgentLevel, string> = {
  hatchling: "🥚",
  junior: "🐣",
  senior: "🐥",
  elder: "🦅",
  legendary: "🔥",
};

const SIZE_CLASSES = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-1",
  lg: "text-base px-3 py-1.5",
};

export function LevelBadge({
  level,
  xp,
  size = "md",
  showXp = false,
}: LevelBadgeProps) {
  const levelName = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        LEVEL_STYLES[level],
        SIZE_CLASSES[size]
      )}
    >
      <span className="mr-1">{LEVEL_ICONS[level]}</span>
      {levelName}
      {showXp && xp !== undefined && (
        <span className="ml-1 opacity-75">({xp.toLocaleString()} XP)</span>
      )}
    </Badge>
  );
}
