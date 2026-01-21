"use client";

import { Progress } from "@/components/ui/progress";
import type { BitcoinAgentLevel } from "@/types";
import { XP_THRESHOLDS } from "@/types";
import { cn } from "@/lib/utils";

interface XPProgressProps {
  xp: number;
  level: BitcoinAgentLevel;
  showNumbers?: boolean;
  className?: string;
}

const LEVEL_ORDER: BitcoinAgentLevel[] = [
  "hatchling",
  "junior",
  "senior",
  "elder",
  "legendary",
];

export function XPProgress({
  xp,
  level,
  showNumbers = true,
  className,
}: XPProgressProps) {
  const currentLevelIndex = LEVEL_ORDER.indexOf(level);
  const nextLevel = currentLevelIndex < LEVEL_ORDER.length - 1
    ? LEVEL_ORDER[currentLevelIndex + 1]
    : undefined;
  const isMaxLevel = level === "legendary";

  const currentThreshold = XP_THRESHOLDS[level] ?? 0;
  const nextThreshold = nextLevel ? XP_THRESHOLDS[nextLevel] : currentThreshold;

  const xpInCurrentLevel = Math.max(0, xp - currentThreshold);
  const xpNeededForNext = Math.max(1, nextThreshold - currentThreshold); // Prevent division by zero
  const progress = isMaxLevel ? 100 : Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);

  return (
    <div className={cn("space-y-1", className)}>
      {showNumbers && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{xp.toLocaleString()} XP</span>
          {!isMaxLevel && (
            <span>
              {nextThreshold.toLocaleString()} XP to{" "}
              {nextLevel?.charAt(0).toUpperCase()}
              {nextLevel?.slice(1)}
            </span>
          )}
          {isMaxLevel && <span>Max Level!</span>}
        </div>
      )}
      <Progress value={isMaxLevel ? 100 : progress} className="h-2" />
      {!isMaxLevel && showNumbers && (
        <p className="text-xs text-center text-muted-foreground">
          {(nextThreshold - xp).toLocaleString()} XP to next level
        </p>
      )}
    </div>
  );
}
