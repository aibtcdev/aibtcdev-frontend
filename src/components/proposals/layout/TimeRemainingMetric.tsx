"use client";

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-foreground rounded-sm p-2">
      {/* Voting Start Time */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="whitespace-nowrap">
          {startTime ? "Voting Started:" : "Voting Starts:"}
        </span>
        <span className="truncate">
          {startTime || estimatedStartTime || "TBD"}
        </span>
        {isStartEstimated && (
          <span className="text-xs px-1 py-0.5 rounded whitespace-nowrap">
            est.
          </span>
        )}
      </div>

      {/* Voting End Time */}
      {endTime && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="whitespace-nowrap">Ended:</span>
          <span className="truncate">{endTime}</span>
        </div>
      )}

      {/* Estimated Time Remaining */}
      {isActive && estimatedTimeRemaining && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="whitespace-nowrap">Ends in:</span>
          <span className="truncate">{estimatedTimeRemaining}</span>
          {isEstimated && (
            <span className="text-xs px-1 py-0.5 rounded whitespace-nowrap">
              est.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
