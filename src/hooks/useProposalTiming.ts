"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBlockTimes } from "./useBlockTImes";
import { fetchLatestChainState } from "@/services/chain-state.service";
import type { Proposal, ProposalWithDAO } from "@/types";

interface ProposalTimingState {
  startTime: string | null;
  endTime: string | null;
  isActive: boolean;
  estimatedTimeRemaining: string | null;
  isEstimated: boolean;
}

export function useProposalTiming(
  proposal: Proposal | ProposalWithDAO
): ProposalTimingState {
  const { data: latestChainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    refetchInterval: 30000,
  });

  const currentBlock = latestChainState?.bitcoin_block_height
    ? Number(latestChainState.bitcoin_block_height)
    : null;
  const voteStartBlock = Number(proposal.vote_start);
  const voteEndBlock = Number(proposal.vote_end);

  const { data: blockTimes, isLoading } = useBlockTimes(
    voteStartBlock,
    voteEndBlock
  );

  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  const minutesPerBlock = isTestnet ? 4 : 10;

  return useMemo(() => {
    if (isLoading || !currentBlock) {
      return {
        startTime: null,
        endTime: null,
        isActive: false,
        estimatedTimeRemaining: null,
        isEstimated: false,
      };
    }

    const isActive =
      currentBlock >= voteStartBlock && currentBlock < voteEndBlock;

    // Format start time
    let startTime: string | null = null;
    if (blockTimes?.startBlockTime) {
      const date = new Date(blockTimes.startBlockTime);
      startTime = date.toLocaleString();
    }

    // Format end time
    let endTime: string | null = null;
    if (blockTimes?.endBlockTime) {
      const date = new Date(blockTimes.endBlockTime);
      endTime = date.toLocaleString();
    }

    // Calculate estimated time remaining if active
    let estimatedTimeRemaining: string | null = null;
    let isEstimated = false;

    if (isActive) {
      if (blockTimes?.endBlockTime) {
        const now = Date.now();
        const endTimeMs = new Date(blockTimes.endBlockTime).getTime();
        const timeLeft = endTimeMs - now;

        if (timeLeft > 0) {
          const minutesLeft = Math.floor(timeLeft / (60 * 1000));
          const hoursLeft = Math.floor(minutesLeft / 60);

          if (hoursLeft > 0) {
            estimatedTimeRemaining = `${hoursLeft}h ${minutesLeft % 60}m`;
          } else {
            estimatedTimeRemaining = `${minutesLeft}m`;
          }
        }
      } else {
        // Estimate based on blocks
        const blocksLeft = voteEndBlock - currentBlock;
        const minutesLeft = blocksLeft * minutesPerBlock;
        const hoursLeft = Math.floor(minutesLeft / 60);

        if (hoursLeft > 0) {
          estimatedTimeRemaining = `~${hoursLeft}h ${minutesLeft % 60}m`;
        } else {
          estimatedTimeRemaining = `~${minutesLeft}m`;
        }
        isEstimated = true;
      }
    }

    return {
      startTime,
      endTime,
      isActive,
      estimatedTimeRemaining,
      isEstimated,
    };
  }, [
    currentBlock,
    voteStartBlock,
    voteEndBlock,
    blockTimes,
    isLoading,
    minutesPerBlock,
  ]);
}
