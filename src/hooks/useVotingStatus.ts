"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/utils/supabase/client";
import { Proposal } from "@/types";
// Return interface for the hook
export interface VotingStatusInfo {
  isActive: boolean;
  isEnded: boolean;
  hasNotStarted: boolean;
  endBlockTime: Date | null;
  startBlockTime: Date | null;
  isEndTimeEstimated: boolean;
  isLoading: boolean;
  currentBlockHeight: number | null;
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
    throw error;
  }
};

// Helper function: fetch current Bitcoin block height from chainstates
const fetchCurrentBlockHeight = async (): Promise<number | null> => {
  try {
    const { data, error } = await supabase
      .from("chain_states")
      .select("bitcoin_block_height")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching current block height:", error);
      return null;
    }

    return data?.bitcoin_block_height || null;
  } catch (error) {
    console.error("Error fetching current block height:", error);
    return null;
  }
};

// Updated useVotingStatus Hook
export const useVotingStatus = (
  status: Proposal["status"],
  vote_start: number,
  vote_end: number
): VotingStatusInfo => {
  // Fetch current Bitcoin block height
  const { data: currentBlockHeight = null, isLoading: isBlockHeightLoading } =
    useQuery<number | null>({
      queryKey: ["currentBlockHeight"],
      queryFn: fetchCurrentBlockHeight,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
      refetchOnWindowFocus: true,
    });

  // Fetch block times (only when we need time display)
  const { data: blockTimes, isLoading: isBlockTimesLoading } = useQuery({
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

  const votingStatusInfo = useMemo((): VotingStatusInfo => {
    const isLoading = isBlockHeightLoading || isBlockTimesLoading;

    // Handle Loading State
    if (isLoading) {
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: true,
        isActive: false,
        isEnded: false,
        hasNotStarted: false,
        currentBlockHeight: null,
      };
    }

    // If we don't have current block height, we can't determine status
    if (currentBlockHeight === null) {
      console.error("Unable to fetch current Bitcoin block height");
      return {
        startBlockTime: null,
        endBlockTime: null,
        isEndTimeEstimated: false,
        isLoading: false,
        isActive: false,
        isEnded: false,
        hasNotStarted: false,
        currentBlockHeight: null,
      };
    }

    // Determine voting status based on block heights
    const hasNotStarted = vote_start > currentBlockHeight;
    const isEnded = vote_end <= currentBlockHeight;
    const isActive = !hasNotStarted && !isEnded && status !== "FAILED";

    // Handle block times (optional)
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let isEndTimeEstimated = false;

    if (blockTimes) {
      const {
        startBlockTime: startBlockTimeString,
        endBlockTime: endBlockTimeString,
      } = blockTimes;

      startDate = startBlockTimeString ? new Date(startBlockTimeString) : null;
      endDate = endBlockTimeString ? new Date(endBlockTimeString) : null;

      // Estimate end time if start exists but end doesn't
      if (startDate && !endDate && vote_end > vote_start) {
        endDate = estimateBlockTime(vote_end, vote_start, startDate);
        isEndTimeEstimated = true;
      }
    }

    return {
      startBlockTime: startDate,
      endBlockTime: endDate,
      isEndTimeEstimated,
      isLoading: false,
      isActive,
      isEnded,
      hasNotStarted,
      currentBlockHeight,
    };
  }, [
    currentBlockHeight,
    blockTimes,
    isBlockHeightLoading,
    isBlockTimesLoading,
    status,
    vote_start,
    vote_end,
  ]);

  return votingStatusInfo;
};
