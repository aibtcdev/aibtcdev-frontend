"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";

interface VoteProgressProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string;
  refreshing?: boolean;
  tokenSymbol?: string;
  liquidTokens: string;
  isActive?: boolean; // Used only for countdown timer, not for showing/hiding refresh button
}

const VoteProgress = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
  refreshing = false,
  tokenSymbol = "",
  liquidTokens = "0",
  isActive = false,
}: VoteProgressProps) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const [bustCache, setBustCache] = useState(false); // Add state to control cache busting
  const queryClient = useQueryClient();

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

  // Refresh votes data
  const refreshVotesData = useCallback(async () => {
    if (!contractAddress || !proposalId) return;

    setLocalRefreshing(true);
    setBustCache(true); // Set bustCache to true when manually refreshing

    try {
      await queryClient.invalidateQueries({
        queryKey: ["proposalVotes", contractAddress, proposalId],
        refetchType: "all",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setLocalRefreshing(false);
      setNextRefreshIn(60);
      // We'll keep bustCache true until the query completes
    }
  }, [queryClient, contractAddress, proposalId]);

  // Implement countdown timer for active proposals only
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !localRefreshing && !refreshing) {
      interval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev <= 1) {
            // When countdown reaches 0, trigger refresh
            refreshVotesData();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, localRefreshing, refreshing, refreshVotesData]);

  // Memoize query options to prevent unnecessary refetches
  const queryOptions = useMemo(
    () => ({
      queryKey: [
        "proposalVotes",
        contractAddress,
        proposalId,
        refreshing,
        bustCache,
      ],
      queryFn: async () => {
        if (contractAddress && proposalId) {
          // Pass bustCache to getProposalVotes
          return getProposalVotes(
            contractAddress,
            Number(proposalId),
            bustCache,
          );
        }
        return null;
      },
      enabled: !!contractAddress && !!proposalId,
      refetchOnWindowFocus: false,
      onSettled: () => {
        // Reset bustCache after query completes (success or error)
        setBustCache(false);
      },
    }),
    [contractAddress, proposalId, refreshing, bustCache],
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
      100 - percentageFor - percentageAgainst,
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

  const isRefreshingAny = localRefreshing || refreshing;

  if (isLoading && !isRefreshingAny) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-zinc-700 rounded animate-pulse"></div>
          <div className="h-4 w-16 bg-zinc-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with refresh controls - Always show refresh button */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
        </div>

        <div className="flex items-center gap-2">
          {isRefreshingAny ? (
            <span className="text-primary flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </span>
          ) : (
            // Only show countdown for active proposals
            isActive && (
              <span className="text-muted-foreground">
                Next update: {nextRefreshIn}s
              </span>
            )
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refreshVotesData}
            disabled={isRefreshingAny}
            title="Refresh vote data"
          >
            <RefreshCw
              className={`h-3 w-3 ${isRefreshingAny ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {voteCalculations.totalVotes === 0 ? (
        <div className="py-4 text-center rounded-md">
          <div className="flex flex-col items-center gap-1">
            <Info className="h-5 w-5 text-secondary" />
            <span className="text-sm text-muted-foreground">
              Awaiting first vote
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-4 bg-zinc-800 rounded-md overflow-hidden">
            {/* For votes */}
            <div
              className="absolute h-full bg-green-500/80 left-0 transition-all duration-500 ease-out flex items-center justify-start pl-2"
              style={{ width: `${voteCalculations.percentageFor}%` }}
            >
              {voteCalculations.percentageFor > 10 && (
                <div className="flex items-center gap-1 text-white text-xs font-medium">
                  <ThumbsUp className="h-2 w-2" />
                  <span>{voteCalculations.percentageFor.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Against votes */}
            <div
              className="absolute h-full bg-red-500/80 transition-all duration-500 ease-out flex items-center justify-start pl-2"
              style={{
                width: `${voteCalculations.percentageAgainst}%`,
                left: `${voteCalculations.percentageFor}%`,
              }}
            >
              {voteCalculations.percentageAgainst > 10 && (
                <div className="flex items-center gap-1 text-white text-xs font-medium">
                  <ThumbsDown className="h-2 w-2" />
                  <span>{voteCalculations.percentageAgainst.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Remaining votes */}
            <div
              className="absolute h-full bg-zinc-700 right-0 transition-all duration-500 ease-out flex items-center justify-end pr-2"
              style={{ width: `${voteCalculations.percentageRemaining}%` }}
            >
              {voteCalculations.percentageRemaining > 15 && (
                <span className="text-zinc-300 text-xs">
                  {voteCalculations.percentageRemaining.toFixed(1)}% not voted
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">For:</span>
                </div>
                <div className="flex items-center gap-1">
                  <TokenBalance
                    value={parsedVotes.votesFor}
                    symbol={tokenSymbol}
                    decimals={8}
                    variant="abbreviated"
                    showSymbol={false}
                  />
                  <span className="text-green-400 font-medium">
                    ({voteCalculations.percentageFor.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-muted-foreground">Against:</span>
                </div>
                <div className="flex items-center gap-1">
                  <TokenBalance
                    value={parsedVotes.votesAgainst}
                    symbol={tokenSymbol}
                    decimals={8}
                    variant="abbreviated"
                    showSymbol={false}
                  />
                  <span className="text-red-400 font-medium">
                    ({voteCalculations.percentageAgainst.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                  <span className="text-muted-foreground">Total:</span>
                </div>
                <div className="flex items-center gap-1">
                  <TokenBalance
                    value={liquidTokens || "0"}
                    symbol={tokenSymbol}
                    decimals={8}
                    variant="abbreviated"
                    showSymbol={false}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer ml-1">
                          <Info className="h-3.5 w-3.5 text-zinc-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p>
                          Total liquid tokens available for voting.
                          <br />
                          {voteCalculations.percentageRemaining.toFixed(1)}%
                          have not voted.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VoteProgress;
