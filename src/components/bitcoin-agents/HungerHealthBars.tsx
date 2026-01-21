"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface HungerHealthBarsProps {
  hunger: number;
  health: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showValues?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

function getBarColor(value: number, type: "hunger" | "health"): string {
  if (value <= 10) return "bg-red-500";
  if (value <= 30) return "bg-orange-500";
  if (value <= 50) return "bg-yellow-500";
  return type === "hunger" ? "bg-green-500" : "bg-blue-500";
}

function getStatusText(value: number): string {
  if (value <= 10) return "Critical!";
  if (value <= 30) return "Low";
  if (value <= 50) return "Moderate";
  if (value <= 80) return "Good";
  return "Full";
}

export function HungerHealthBars({
  hunger,
  health,
  size = "md",
  showLabels = true,
  showValues = true,
  className,
}: HungerHealthBarsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Hunger Bar */}
      <div>
        {showLabels && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <span>🍖</span> Hunger
            </span>
            {showValues && (
              <span
                className={cn(
                  "text-xs font-medium",
                  hunger <= 10
                    ? "text-red-600"
                    : hunger <= 30
                      ? "text-orange-600"
                      : "text-muted-foreground"
                )}
              >
                {hunger}% - {getStatusText(hunger)}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <Progress
            value={hunger}
            className={cn("bg-muted", SIZE_CLASSES[size])}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all",
              SIZE_CLASSES[size],
              getBarColor(hunger, "hunger")
            )}
            style={{ width: `${hunger}%` }}
          />
        </div>
      </div>

      {/* Health Bar */}
      <div>
        {showLabels && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <span>❤️</span> Health
            </span>
            {showValues && (
              <span
                className={cn(
                  "text-xs font-medium",
                  health <= 10
                    ? "text-red-600"
                    : health <= 30
                      ? "text-orange-600"
                      : "text-muted-foreground"
                )}
              >
                {health}% - {getStatusText(health)}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <Progress
            value={health}
            className={cn("bg-muted", SIZE_CLASSES[size])}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all",
              SIZE_CLASSES[size],
              getBarColor(health, "health")
            )}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>
    </div>
  );
}
