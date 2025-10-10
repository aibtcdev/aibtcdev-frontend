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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
      {/* Voting Start Time */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="font-medium whitespace-nowrap">
          {startTime ? "Voting Started:" : "Voting Starts:"}
        </span>
        <span className="text-foreground truncate">
          {startTime || estimatedStartTime || "TBD"}
        </span>
        {isStartEstimated && (
          <span className="text-xs bg-muted/50 px-1 py-0.5 rounded whitespace-nowrap">
            est.
          </span>
        )}
      </div>

      {/* Voting End Time */}
      {endTime && (
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">Ended:</span>
          <span className="text-foreground truncate">{endTime}</span>
        </div>
      )}

      {/* Estimated Time Remaining */}
      {isActive && estimatedTimeRemaining && (
        <div className="flex items-center gap-1.5 min-w-0">
          <Timer className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">Ends in:</span>
          <span className="text-foreground truncate">
            {estimatedTimeRemaining}
          </span>
          {isEstimated && (
            <span className="text-xs bg-muted/50 px-1 py-0.5 rounded whitespace-nowrap">
              est.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
