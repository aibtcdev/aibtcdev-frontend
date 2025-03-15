"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Proposal } from "@/types/supabase";
import { truncateString } from "./helper";
import { fetchBlockTimes } from "@/lib/block-time";

interface TimeStatusProps {
  createdAt: string;
  status: Proposal["status"];
  concludedBy?: string;
  start_block: number;
  end_block: number;
}

// Function to estimate block time if API data is not available
const estimateBlockTime = (
  blockHeight: number,
  referenceBlock: number,
  referenceTime: Date
) => {
  const avgBlockTime =
    process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
      ? 4 * 60 * 1000 // 4 minutes for testnet
      : 12 * 60 * 1000; // 12 minutes for mainnet

  const blockDiff = blockHeight - referenceBlock;
  return new Date(referenceTime.getTime() + blockDiff * avgBlockTime);
};

const TimeStatus: React.FC<TimeStatusProps> = ({
  status,
  concludedBy,
  start_block,
  end_block,
}) => {
  const [blockTimes, setBlockTimes] = useState<{
    startBlockTime: Date | null;
    endBlockTime: Date | null;
    isEndTimeEstimated: boolean;
    isLoading: boolean;
  }>({
    startBlockTime: null,
    endBlockTime: null,
    isEndTimeEstimated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadBlockTimes = async () => {
      try {
        const { startBlockTime, endBlockTime } = await fetchBlockTimes(
          start_block,
          end_block
        );

        let startDate = startBlockTime ? new Date(startBlockTime) : null;
        let endDate = endBlockTime ? new Date(endBlockTime) : null;
        let isEndTimeEstimated = false;

        // Assuming start time will always exist as mentioned
        if (!startDate) {
          console.error("Start block time not found - this shouldn't happen");
          // Fallback in case it does happen anyway
          const now = new Date();
          const avgBlockTime =
            process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
              ? 4 * 60 * 1000 // 4 minutes for testnet
              : 12 * 60 * 1000; // 12 minutes for mainnet

          startDate = new Date(now.getTime() - avgBlockTime); // Assume recent
        }

        // Handle the case where end block hasn't been created yet
        if (startDate && !endDate) {
          // We have start time but not end time - estimate end time
          endDate = estimateBlockTime(end_block, start_block, startDate);
          isEndTimeEstimated = true;
        }

        setBlockTimes({
          startBlockTime: startDate,
          endBlockTime: endDate,
          isEndTimeEstimated,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error loading block times:", error);
        setBlockTimes({
          startBlockTime: null,
          endBlockTime: null,
          isEndTimeEstimated: false,
          isLoading: false,
        });
      }
    };

    loadBlockTimes();
  }, [start_block, end_block]);

  // Loading state
  if (blockTimes.isLoading) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Loading block times...</span>
      </div>
    );
  }

  const { startBlockTime, endBlockTime, isEndTimeEstimated } = blockTimes;

  // If we still don't have start time after all attempts
  if (!startBlockTime) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Timer className="h-4 w-4" />
        <span className="text-sm">Unable to determine block times</span>
      </div>
    );
  }

  const formattedStart = format(startBlockTime, "MMM d, yyyy 'at' h:mm a");
  // Only format end time if we have it
  const formattedEnd = endBlockTime
    ? format(endBlockTime, "MMM d, yyyy 'at' h:mm a")
    : null;

  const now = new Date();
  const isEnded = endBlockTime && now.getTime() > endBlockTime.getTime();

  // For the "Voting in progress" text, we still need to consider both time and status
  const isActive =
    endBlockTime &&
    now.getTime() < endBlockTime.getTime() &&
    status !== "DEPLOYED" &&
    status !== "FAILED";

  return (
    <div className="border rounded-md p-3 sm:p-4 w-full mt-2">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4" />
        {isActive ? (
          <span className="text-sm font-medium text-primary">
            Voting in progress
          </span>
        ) : (
          <span className="text-sm font-medium">Voting period</span>
        )}
        {isEnded && <Badge className="text-xs ml-2">Ended</Badge>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Started:</span>{" "}
          {formattedStart}
        </div>
        <div className="text-xs sm:text-sm">
          <span className="text-muted-foreground">Ends:</span>{" "}
          {isEndTimeEstimated ? (
            <span>
              {formattedEnd}{" "}
              <Badge variant="outline" className="text-xs font-normal ml-1">
                Estimated
              </Badge>
            </span>
          ) : (
            formattedEnd || "Block not created yet"
          )}
        </div>
      </div>

      {isEndTimeEstimated && (
        <div className="mt-2 text-xs text-muted-foreground">
          End block #{end_block} has not been created yet. Time is estimated
          based on average block time.
        </div>
      )}

      {concludedBy && (
        <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm">
          <span className="text-muted-foreground">Concluded by:</span>
          <code className="bg-secondary/20 px-1 py-0.5 rounded text-xs">
            {truncateString(concludedBy, 6, 4)}
          </code>
        </div>
      )}
    </div>
  );
};

export default TimeStatus;
