"use client";

import { Clock, Calendar, Timer } from "lucide-react";
import { useProposalTiming } from "@/hooks/useProposalTiming";
import type { ProposalWithDAO } from "@/types";

interface TimeRemainingMetricProps {
  proposal: ProposalWithDAO;
}

export function TimeRemainingMetric({ proposal }: TimeRemainingMetricProps) {
  const {
    startTime,
    endTime,
    isActive,
    estimatedTimeRemaining,
    isEstimated,
    estimatedStartTime,
    isStartEstimated,
  } = useProposalTiming(proposal);

  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground overflow-x-auto">
      {/* Voting Start Time */}
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {startTime ? "Voting Started:" : "Voting Starts:"}
        </span>
        <span className="text-foreground">
          {startTime || estimatedStartTime || "TBD"}
        </span>
        {isStartEstimated && (
          <span className="text-xs bg-muted/50 px-1 py-0.5 rounded">est.</span>
        )}
      </div>

      {/* Voting End Time */}
      {endTime && (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium">Ended:</span>
          <span className="text-foreground">{endTime}</span>
        </div>
      )}

      {/* Estimated Time Remaining (inline with others) */}
      {isActive && estimatedTimeRemaining && (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Timer className="h-4 w-4 text-accent" />
          <span className="font-medium">Ends in:</span>
          <span className="text-foreground">{estimatedTimeRemaining}</span>
          {isEstimated && (
            <span className="text-xs bg-muted/50 px-1 py-0.5 rounded">
              est.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
