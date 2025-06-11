"use client";

import { useMemo } from "react";
import { Timer, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types";
import { useQuery } from "@tanstack/react-query";

// Props interface for the component
interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  vote_start: number;
  vote_end: number;
}

// Return interface for the hook
export interface VotingStatusInfo {
  isActive: boolean;
  isEnded: boolean;
  endBlockTime: Date | null;
  startBlockTime: Date | null;
  isEndTimeEstimated: boolean;
  isLoading: boolean;
}

// Helper function: estimateBlockTime
const estimateBlockTime = (
  blockHeight: number,
  referenceBlock: number,
  referenceTime: Date
): Date => {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet";
  const avgBlockTimeMs = network === "testnet" ? 4 * 60 * 1000 : 10 * 60 * 1000;

  const blockDiff = blockHeight - referenceBlock;
  // Handle cases where end block might be before start block (shouldn't happen)
  if (blockDiff < 0) {
    console.warn(
      `End block ${blockHeight} is before start block ${referenceBlock}. Estimation might be inaccurate.`
    );
  }
  return new Date(referenceTime.getTime() + blockDiff * avgBlockTimeMs);
};

// Helper function: fetchBlockTimes
const fetchBlockTimes = async (
  startBlock: number,
  endBlock: number
): Promise<{ startBlockTime: string | null; endBlockTime: string | null }> => {
  // Construct the URL safely
  const params = new URLSearchParams({
    startBlock: startBlock.toString(),
    endBlock: endBlock.toString(),
  });
  const apiUrl = `/block-times?${params.toString()}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch block times (${apiUrl}): ${response.status} ${response.statusText}`
      );
      // Throw error to be caught by React Query
      throw new Error(`API Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !("startBlockTime" in data) ||
      !("endBlockTime" in data)
    ) {
      console.error(
        "Invalid data structure received from /block-times API:",
        data
      );
      throw new Error("Invalid data structure received from API");
    }
    return data as {
      startBlockTime: string | null;
      endBlockTime: string | null;
    };
  } catch (error) {
    console.error(`Network or parsing error fetching ${apiUrl}:`, error);
    // Re-throw the error so React Query can handle it
    throw error;
  }
};

// --- Refactored useVotingStatus Hook ---
export const useVotingStatus = (
  status: Proposal["status"],
  vote_start: number,
  vote_end: number
): VotingStatusInfo => {
  const { data, isLoading, error, isError } = useQuery({
    // Destructure isError as well
    queryKey: ["blockTimes", vote_start, vote_end],
    queryFn: () => fetchBlockTimes(vote_start, vote_end),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,

    enabled:
      typeof vote_start === "number" &&
      typeof vote_end === "number" &&
      vote_start > 0 &&
      vote_end > 0,
  });

  // 2. Derive voting status using useMemo based on query results and props
  const votingStatusInfo = useMemo((): VotingStatusInfo => {
    // Handle Loading State
    if (isLoading) {
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: true, // Currently loading
        isActive: false,
        isEnded: false,
      };
    }

    if (isError || !data) {
      console.error(
        "Error state or no data after loading for blocks:",
        vote_start,
        vote_end,
        error
      );
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: false, // No longer loading
        isActive: false,
        isEnded: false, // Considered not ended due to error
      };
    }

    const {
      startBlockTime: startBlockTimeString,
      endBlockTime: endBlockTimeString,
    } = data;

    const startDate = startBlockTimeString
      ? new Date(startBlockTimeString)
      : null;
    let endDate = endBlockTimeString ? new Date(endBlockTimeString) : null;
    let isEndTimeEstimated = false;

    // Handle specific case: Start date is null IN THE DATA after successful fetch
    if (!startDate) {
      console.warn(
        "Start block time not found in data for start_block:",
        vote_start
      );
      return {
        startBlockTime: null, // Explicitly null
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: false, // No longer loading
        isActive: false,
        isEnded: false,
      };
    }

    // Estimate end time if start exists but end doesn't
    // Ensure end_block is valid for estimation
    if (
      startDate &&
      !endDate &&
      typeof vote_end === "number" &&
      vote_end > vote_start
    ) {
      endDate = estimateBlockTime(vote_end, vote_start, startDate);
      isEndTimeEstimated = true;
    }

    // Calculate current status based on available/estimated dates
    const now = new Date();
    // Ensure endDate is a valid Date object for reliable comparisons
    const isEnded =
      endDate instanceof Date && now.getTime() >= endDate.getTime();
    // Ensure proposal status 'FAILED' prevents 'isActive' being true
    // Also ensure start date has passed
    const isActive =
      startDate instanceof Date &&
      endDate instanceof Date &&
      now.getTime() >= startDate.getTime() &&
      now.getTime() < endDate.getTime() &&
      status !== "FAILED"; // Example status check

    // Return the calculated status object
    return {
      startBlockTime: startDate,
      endBlockTime: endDate, // Will be Date object or null
      isEndTimeEstimated,
      isLoading: false, // Data processed
      isActive,
      isEnded,
    };
    // Dependencies for useMemo: Recalculate if query results or inputs change
  }, [data, isLoading, error, isError, status, vote_start, vote_end]); // Added isError dependency

  // 3. Return the derived state object
  return votingStatusInfo;
};

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
      <div className="border border-blue-500/20 bg-blue-500/5 rounded-md p-2 w-full">
        <div className="flex items-center gap-1.5 text-blue-400">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">
            Voting has not started yet
          </span>
        </div>
        <p className="text-xs text-blue-400/80 mt-1">
          Voting starts in block #{vote_start}.
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
    <div className="bg-zinc-800/30 rounded-md p-2 w-full text-xs sm:text-sm break-words">
      {/* Header (Active/Ended status) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          {isActive ? (
            <span className="text-xs font-medium text-primary">
              Voting in progress
            </span>
          ) : (
            <span className="text-xs font-medium">
              {isEnded ? "Voting Period" : "Voting Starts Soon"}
            </span>
          )}
        </div>
        {isEnded && (
          <Badge
            variant="outline"
            className="text-xs h-5 px-1.5 border-none bg-zinc-700/50"
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
                      className="text-[10px] h-4 px-1 ml-1 border-none bg-zinc-700/50"
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
