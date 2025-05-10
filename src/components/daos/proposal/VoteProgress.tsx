"use client";

import type React from "react";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { TokenBalance } from "@/components/reusables/balance-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, ThumbsUp, ThumbsDown } from "lucide-react";

// Update the VoteProgressProps interface to match the types from Proposal
interface VoteProgressProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string;
  refreshing?: boolean;
  tokenSymbol?: string;
  liquidTokens: string;
}

const VoteProgress: React.FC<VoteProgressProps> = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
  refreshing = false,
  tokenSymbol = "",
  liquidTokens = "0", // Default is now just a string
}) => {
  // Memoize initial votes parsing
  const initialParsedVotes = useMemo(() => {
    const parsedFor = initialVotesFor ? initialVotesFor.replace(/n$/, "") : "0";
    const parsedAgainst = initialVotesAgainst
      ? initialVotesAgainst.replace(/n$/, "")
      : "0";

    return {
      votesFor: parsedFor,
      votesAgainst: parsedAgainst,
    };
  }, [initialVotesFor, initialVotesAgainst]);

  // State to store parsed vote values
  const [parsedVotes, setParsedVotes] = useState(initialParsedVotes);

  // Memoize query options to prevent unnecessary refetches
  const queryOptions = useMemo(
    () => ({
      queryKey: ["proposalVotes", contractAddress, proposalId, refreshing],
      queryFn: async () => {
        if (contractAddress && proposalId) {
          return getProposalVotes(
            contractAddress,
            Number(proposalId),
            refreshing
          );
        }
        return null;
      },
      enabled: !!contractAddress && !!proposalId,
      refetchOnWindowFocus: false,
    }),
    [contractAddress, proposalId, refreshing]
  );

  // Use useQuery with memoized options
  const { data, isLoading, error } = useQuery(queryOptions);

  // Memoize vote calculations to prevent unnecessary recalculations
  const voteCalculations = useMemo(() => {
    const votesForNum = Number(parsedVotes.votesFor) || 0;
    const votesAgainstNum = Number(parsedVotes.votesAgainst) || 0;
    const totalVotes = votesForNum + votesAgainstNum;
    const liquidTokensNum = Number(liquidTokens) || 0;

    // Calculate percentages based on total liquid tokens
    const percentageFor =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const percentageAgainst =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;
    const percentageRemaining = Math.max(
      0,
      100 - percentageFor - percentageAgainst
    );

    // Also calculate percentages of cast votes for the tooltip
    const castPercentageFor =
      totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
    const castPercentageAgainst =
      totalVotes > 0 ? (votesAgainstNum / totalVotes) * 100 : 0;

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      percentageFor,
      percentageAgainst,
      percentageRemaining,
      castPercentageFor,
      castPercentageAgainst,
    };
  }, [parsedVotes, liquidTokens]);

  // Update parsed votes when data changes
  useEffect(() => {
    if (data) {
      setParsedVotes({
        votesFor: data.votesFor || "0",
        votesAgainst: data.votesAgainst || "0",
      });
    }
  }, [data]);

  if (isLoading && !refreshing) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error: {(error as Error).message}</div>
    );
  }

  return (
    <div className="space-y-4">
      {voteCalculations.totalVotes === 0 ? (
        <div className="py-6 text-center bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <div className="flex flex-col items-center gap-2">
            <Info className="h-6 w-6 text-blue-500" />
            <span className="text-muted-foreground">Awaiting first vote</span>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-10 bg-zinc-800 rounded-lg overflow-hidden">
            {/* For votes */}
            <div
              className="absolute h-full bg-green-500/80 left-0 transition-all duration-500 ease-out flex items-center justify-start pl-3"
              style={{ width: `${voteCalculations.percentageFor}%` }}
            >
              {voteCalculations.percentageFor > 10 && (
                <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  <span>{voteCalculations.percentageFor.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Against votes */}
            <div
              className="absolute h-full bg-red-500/80 transition-all duration-500 ease-out flex items-center justify-start pl-3"
              style={{
                width: `${voteCalculations.percentageAgainst}%`,
                left: `${voteCalculations.percentageFor}%`,
              }}
            >
              {voteCalculations.percentageAgainst > 10 && (
                <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                  <ThumbsDown className="h-3.5 w-3.5" />
                  <span>{voteCalculations.percentageAgainst.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Remaining votes */}
            <div
              className="absolute h-full bg-zinc-700 right-0 transition-all duration-500 ease-out flex items-center justify-end pr-3"
              style={{ width: `${voteCalculations.percentageRemaining}%` }}
            >
              {voteCalculations.percentageRemaining > 15 && (
                <span className="text-zinc-300 text-sm">
                  {voteCalculations.percentageRemaining.toFixed(1)}% not voted
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">For</span>
              </div>
              <div className="flex items-center justify-between">
                <TokenBalance
                  value={parsedVotes.votesFor}
                  symbol={tokenSymbol}
                  decimals={8}
                  variant="abbreviated"
                />
                <span className="text-xs text-green-400 font-medium">
                  {voteCalculations.castPercentageFor.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-muted-foreground">Against</span>
              </div>
              <div className="flex items-center justify-between">
                <TokenBalance
                  value={parsedVotes.votesAgainst}
                  symbol={tokenSymbol}
                  decimals={8}
                  variant="abbreviated"
                />
                <span className="text-xs text-red-400 font-medium">
                  {voteCalculations.castPercentageAgainst.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full bg-zinc-600"></div>
                <span className="text-sm text-muted-foreground">
                  Total Available
                </span>
              </div>
              <div className="flex items-center justify-between">
                <TokenBalance
                  value={liquidTokens || "0"}
                  symbol={tokenSymbol}
                  decimals={8}
                  variant="abbreviated"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <Info className="h-4 w-4 text-zinc-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm">
                        Total liquid tokens available for voting.
                        <br />
                        {voteCalculations.percentageRemaining.toFixed(1)}% have
                        not voted.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoteProgress;
