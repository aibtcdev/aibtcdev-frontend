"use client";

// import { useMemo } from "react";
import { Timer, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types";
import { useVotingStatus } from "@/hooks/useVotingStatus";

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
  } = useVotingStatus(status, vote_start, vote_end);

  if (isLoading) {
    return (
      <div className="border border-border rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
          <span className="text-xs">Loading block times...</span>
        </div>
      </div>
    );
  }

  // Handle case: Start time is null AFTER loading - this means voting has not started yet
  if (startBlockTime === null) {
    return (
      <div className="border border-secondary/20 bg-secondary/10 rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5 text-secondary">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            Voting for this contribution has not started yet
          </span>
        </div>
        <p className="text-xs text-secondary/80 mt-1">
          Voting for this contribution starts in block #{vote_start}.
        </p>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  const formattedEnd =
    endBlockTime instanceof Date
      ? format(endBlockTime, "MMM d, yyyy 'at' h:mm a")
      : null;

  return (
    <div className="bg-muted/20 rounded-md p-2 w-full text-xs sm:text-sm break-words">
      {/* Header (Active/Ended status) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          {isActive ? (
            <span className="text-xs font-medium text-primary">
              Voting in progress for this contribution
            </span>
          ) : (
            <span className="text-xs font-medium">
              {isEnded
                ? "Contribution Voting Period"
                : "Contribution Voting Starts Soon"}
            </span>
          )}
        </div>
        {isEnded && (
          <Badge
            variant="outline"
            className="text-xs h-5 px-1.5 border-none bg-muted text-muted-foreground"
          >
            Ended
          </Badge>
        )}
      </div>

      {/* Start/End Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Start Time */}
        <div className="flex items-start gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-muted-foreground">Started</div>
            <div>{formattedStart}</div>
          </div>
        </div>

        {/* End Time */}
        <div className="flex items-start gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-muted-foreground">Ends</div>
            <div>
              {formattedEnd ? (
                <span className="flex items-center flex-wrap gap-1">
                  {formattedEnd}
                  {isEndTimeEstimated && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 ml-1 border-none bg-muted text-muted-foreground"
                    >
                      Est.
                    </Badge>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {vote_end ? `After Block #${vote_end}` : "Not determinable"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeStatus;
