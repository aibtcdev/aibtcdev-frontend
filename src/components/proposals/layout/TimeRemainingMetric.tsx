"use client";

import type React from "react";
import { Clock, Calendar, Timer } from "lucide-react";
import { useProposalTiming } from "@/hooks/useProposalTiming";
import type { ProposalWithDAO } from "@/types";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  variant?: "default" | "warning" | "success";
  isEstimated?: boolean;
}

function MetricCard({
  icon,
  label,
  value,
  variant = "default",
  isEstimated,
}: MetricCardProps) {
  const variantClasses = {
    default: "border-border/20",
    warning: "border-destructive/20 bg-destructive/5",
    success: "border-primary/20 bg-primary/5",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors hover:bg-muted/30",
        variantClasses[variant]
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {value}
            </span>
            {isEstimated && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                est.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TimeRemainingMetricProps {
  proposal: ProposalWithDAO;
}

export function TimeRemainingMetric({ proposal }: TimeRemainingMetricProps) {
  const { startTime, endTime, isActive, estimatedTimeRemaining, isEstimated } =
    useProposalTiming(proposal);

  return (
    <div className="space-y-3">
      {/* Voting Start Time */}
      <MetricCard
        icon={<Calendar className="h-4 w-4 text-primary" />}
        label={startTime ? "Voting Started" : "Voting Starts"}
        value={startTime || "TBD"}
        variant="default"
      />

      {/* Voting End Time */}
      {endTime && (
        <MetricCard
          icon={<Clock className="h-4 w-4 text-primary" />}
          label="Voting Ended"
          value={endTime}
          variant="default"
        />
      )}

      {/* Estimated Time Remaining (only when active) */}
      {isActive && estimatedTimeRemaining && (
        <MetricCard
          icon={<Timer className="h-4 w-4 text-accent" />}
          label="Time Remaining"
          value={estimatedTimeRemaining}
          variant="warning"
          isEstimated={isEstimated}
        />
      )}
    </div>
  );
}
