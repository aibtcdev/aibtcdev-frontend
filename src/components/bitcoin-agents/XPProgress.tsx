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
  const nextLevel = LEVEL_ORDER[currentLevelIndex + 1];

  const currentThreshold = XP_THRESHOLDS[level];
  const nextThreshold = nextLevel ? XP_THRESHOLDS[nextLevel] : XP_THRESHOLDS.legendary * 2;

  const xpInCurrentLevel = xp - currentThreshold;
  const xpNeededForNext = nextThreshold - currentThreshold;
  const progress = Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);

  const isMaxLevel = level === "legendary";

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
