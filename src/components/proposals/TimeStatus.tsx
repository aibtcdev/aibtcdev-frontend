"use client";

import { Timer, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import { useVotingStatus } from "@/hooks/use-voting-status";

// Props interface for the component
interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  vote_start: number;
  vote_end: number;
}

const TimeStatus = ({ status, vote_start, vote_end }: TimeStatusProps) => {
  const {
    startBlockTime,
    endBlockTime,
    isEndTimeEstimated,
    isLoading,
    isActive,
    isEnded,
    hasNotStarted,
    currentBlockHeight,
  } = useVotingStatus(status, vote_start, vote_end);

  if (isLoading) {
    return (
      <div className="border border-border rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
          <span className="text-xs">Loading voting status...</span>
        </div>
      </div>
    );
  }

  // Handle case: Voting has not started yet
  if (hasNotStarted) {
    return (
      <div className="border border-blue-500/20 bg-blue-500/5 rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5 text-blue-400">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            Voting has not started yet
          </span>
        </div>
        <p className="text-xs text-blue-400/80 mt-1">
          Voting starts at block #{vote_start}
          {currentBlockHeight && (
            <span className="ml-1">(Current: #{currentBlockHeight})</span>
          )}
        </p>
        {startBlockTime && (
          <p className="text-xs text-blue-400/80 mt-1">
            Expected start: {format(startBlockTime, "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </div>
    );
  }

  // Handle case: Voting has ended
  if (isEnded) {
    return (
      <div className="border border-gray-500/20 bg-gray-500/5 rounded-md p-2 w-full">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-gray-400">
            <Timer className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Voting has ended</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs h-5 px-1.5 border-none bg-zinc-700/50"
          >
            Ended
          </Badge>
        </div>
        <p className="text-xs text-gray-400/80">
          Ended at block #{vote_end}
          {currentBlockHeight && (
            <span className="ml-1">(Current: #{currentBlockHeight})</span>
          )}
        </p>
        {endBlockTime && (
          <p className="text-xs text-gray-400/80 mt-1">
            Ended: {format(endBlockTime, "MMM d, yyyy 'at' h:mm a")}
            {isEndTimeEstimated && (
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1 ml-1 border-none bg-zinc-700/50"
              >
                Est.
              </Badge>
            )}
          </p>
        )}
      </div>
    );
  }

  // Handle case: Voting is active
  if (isActive) {
    return (
      <div className="border border-green-500/20 bg-green-500/5 rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5 text-green-400 mb-2">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Voting in progress</span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <p className="text-green-400/80">
            Blocks #{vote_start} - #{vote_end}
            {currentBlockHeight && (
              <span className="ml-1">(Current: #{currentBlockHeight})</span>
            )}
          </p>

          {/* Show times only if available */}
          {(startBlockTime || endBlockTime) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Start Time */}
              {startBlockTime && (
                <div className="flex items-start gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-muted-foreground">Started</div>
                    <div>
                      {format(startBlockTime, "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}

              {/* End Time */}
              {endBlockTime && (
                <div className="flex items-start gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-muted-foreground">Ends</div>
                    <div className="flex items-center flex-wrap gap-1">
                      {format(endBlockTime, "MMM d, yyyy 'at' h:mm a")}
                      {isEndTimeEstimated && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 ml-1 border-none bg-zinc-700/50"
                        >
                          Est.
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback case
  return (
    <div className="bg-zinc-800/30 rounded-md p-2 w-full text-xs">
      <div className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs">Unable to determine voting status</span>
      </div>
    </div>
  );
};

export default TimeStatus;
