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
    estimatedTimeRemaining,
    isEstimated,
    estimatedStartTime,
    isStartEstimated,
  } = useProposalTiming(proposal);

  // Build a natural sentence
  let sentence = "";

  // Determine tense and build sentence
  if (endTime) {
    // Voting has ended
    const startText = startTime || estimatedStartTime || "unknown time";
    sentence = `Agent voting started at ${startText}${isStartEstimated ? " (est.)" : ""} and ended at ${endTime}.`;
  } else if (startTime) {
    // Voting has started and is active
    if (estimatedTimeRemaining) {
      sentence = `Agent voting started at ${startTime}${isStartEstimated ? " (est.)" : ""} and ends in ${estimatedTimeRemaining}${isEstimated ? " (est.)" : ""}.`;
    } else {
      sentence = `Agent voting started at ${startTime}${isStartEstimated ? " (est.)" : ""}.`;
    }
  } else if (estimatedStartTime) {
    // Voting hasn't started yet
    if (estimatedTimeRemaining) {
      sentence = `Agent voting starts at ${estimatedStartTime}${isStartEstimated ? " (est.)" : ""} and ends in ${estimatedTimeRemaining}${isEstimated ? " (est.)" : ""}.`;
    } else {
      sentence = `Agent voting starts at ${estimatedStartTime}${isStartEstimated ? " (est.)" : ""}.`;
    }
  }

  return (
    <div className="text-xs sm:text-sm text-muted-foreground italic">
      <span>{sentence || "Voting information not available."}</span>
    </div>
  );
}
