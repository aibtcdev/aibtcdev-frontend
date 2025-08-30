"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface VoteStatusChartProps {
  votesFor?: string;
  votesAgainst?: string;
  contractAddress?: string;
  proposalId?: string;
  refreshing?: boolean;
  tokenSymbol?: string;
  liquidTokens: string;
  isActive?: boolean; // Used only for countdown timer, not for showing/hiding refresh button
}

const VoteStatusChart = ({
  votesFor: initialVotesFor,
  votesAgainst: initialVotesAgainst,
  contractAddress,
  proposalId,
  refreshing = false,
  tokenSymbol = "",
  liquidTokens = "0",
  isActive = false,
}: VoteStatusChartProps) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const [bustCache, setBustCache] = useState(false); // Add state to control cache busting
  const queryClient = useQueryClient();

  // State to store vote display data (matching VotesView.tsx pattern)
  const [voteDisplayData, setVoteDisplayData] = useState<{
    votesFor: string;
    votesAgainst: string;
    rawVotesFor: string;
    rawVotesAgainst: string;
  } | null>(null);

  // Utility function to format vote balances (matching VotesView.tsx)
  const formatBalance = useCallback(
    (value: string | number, decimals: number = 8) => {
      let num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";

      num = num / Math.pow(10, decimals);

      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
      } else if (num < 1) {
        return num.toFixed(decimals).replace(/\.?0+$/, "");
      } else {
        return num.toFixed(decimals).replace(/\.?0+$/, "");
      }
    },
    []
  );

  // Refresh votes data
  const refreshVotesData = useCallback(
    async (e?: React.MouseEvent) => {
      // Prevent default behavior to avoid page navigation
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

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
    },
    [queryClient, contractAddress, proposalId]
  );

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

  // Memoize query options to prevent unnecessary refetches (matching VotesView.tsx pattern)
  const queryOptions = useMemo(
    () => ({
      queryKey: [
        "proposalVotes",
        contractAddress,
        proposalId,
        isActive ? "bustCache" : "cached",
        bustCache,
      ],
      queryFn: async () => {
        if (contractAddress && proposalId) {
          // Bust cache if proposal is active or manually requested
          const shouldBustCache = isActive || bustCache;
          return getProposalVotes(
            contractAddress,
            Number(proposalId),
            shouldBustCache
          );
        }
        return null;
      },
      enabled: !!contractAddress && !!proposalId,
      refetchOnWindowFocus: false,
      staleTime: isActive ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds for active, 5 minutes for others
      refetchInterval: isActive ? 30 * 1000 : undefined, // Auto-refetch every 30 seconds for active proposals
      onSettled: () => {
        // Reset bustCache after query completes (success or error)
        setBustCache(false);
      },
    }),
    [contractAddress, proposalId, refreshing, bustCache, isActive]
  );

  // Use useQuery with memoized options
  const { data, isLoading, error } = useQuery(queryOptions);

  // Update vote display data from API response (matching VotesView.tsx pattern)
  useEffect(() => {
    if (data) {
      const rawFor = data.votesFor || data.data?.votesFor;
      const rawAgainst = data.votesAgainst || data.data?.votesAgainst;

      if (rawFor && rawAgainst) {
        setVoteDisplayData({
          votesFor: formatBalance(rawFor),
          votesAgainst: formatBalance(rawAgainst),
          rawVotesFor: rawFor,
          rawVotesAgainst: rawAgainst,
        });
      } else {
        setVoteDisplayData(null);
      }
    } else if (initialVotesFor && initialVotesAgainst) {
      // Fallback to initial props if available
      setVoteDisplayData({
        votesFor: formatBalance(initialVotesFor),
        votesAgainst: formatBalance(initialVotesAgainst),
        rawVotesFor: initialVotesFor,
        rawVotesAgainst: initialVotesAgainst,
      });
    } else {
      setVoteDisplayData(null);
    }
  }, [data, initialVotesFor, initialVotesAgainst, formatBalance]);

  // Memoize vote calculations to prevent unnecessary recalculations
  const voteCalculations = useMemo(() => {
    // Return null if we don't have valid vote data
    if (!voteDisplayData) {
      return null;
    }

    const votesForNum = Number(voteDisplayData.rawVotesFor || 0);
    const votesAgainstNum = Number(voteDisplayData.rawVotesAgainst || 0);
    const totalVotes = votesForNum + votesAgainstNum;
    const liquidTokensNum = Number(liquidTokens) || 0;

    // Calculate percentages based on total liquid tokens (for display in text)
    const liquidPercentageFor =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const liquidPercentageAgainst =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;

    // Calculate percentages of cast votes for the progress bar (now based on liquidTokensNum)
    const barPercentageFor =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const barPercentageAgainst =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;

    // Calculate unvoted tokens and percentage
    const unvotedTokensNum = liquidTokensNum - votesForNum - votesAgainstNum;
    const unvotedPercentage =
      liquidTokensNum > 0 ? (unvotedTokensNum / liquidTokensNum) * 100 : 0;

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      liquidPercentageFor,
      liquidPercentageAgainst,
      barPercentageFor,
      barPercentageAgainst,
      unvotedTokensNum,
      unvotedPercentage,
    };
  }, [voteDisplayData, liquidTokens]);

  const isRefreshingAny = localRefreshing || refreshing;

  // Show loading state if data is loading OR if vote calculations are null (votes not available)
  if ((isLoading && !isRefreshingAny) || !voteCalculations) {
    return (
      <div className="space-y-2">
        <div className="h-3 sm:h-4 bg-muted rounded-full animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-3 w-12 sm:h-4 sm:w-16 bg-muted rounded animate-pulse"></div>
          <div className="h-3 w-12 sm:h-4 sm:w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-red-500 text-sm flex items-center gap-2">
          <RefreshCw className="h-3 w-3" />
          Unable to load vote data. Please refresh to try again.
        </div>
        <div className="flex items-center justify-end">
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
    );
  }

  return (
    <div className="space-y-1">
      {/* Header with refresh controls - Always show refresh button */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground"></div>
        <div className="text-muted-foreground"></div>

        <div className="flex items-center gap-2">
          {isRefreshingAny ? (
            <span className="text-primary flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </span>
          ) : (
            // Only show countdown for active contributions
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

      {/* Progress Bar - Match VotesView.tsx design */}
      <div className="space-y-2">
        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Votes for (green) */}
            <div
              className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                voteCalculations.votesForNum > 0 ? "rounded-l-lg" : ""
              } ${
                voteCalculations.votesAgainstNum === 0 &&
                voteCalculations.votesForNum > 0
                  ? "rounded-r-lg"
                  : ""
              }`}
              style={{
                width: `${Math.min(voteCalculations.barPercentageFor, 100)}%`,
              }}
            />
            {/* Votes against (red) */}
            <div
              className={`absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out ${
                voteCalculations.votesAgainstNum > 0 &&
                voteCalculations.votesForNum === 0
                  ? "rounded-l-lg"
                  : ""
              } ${voteCalculations.votesAgainstNum > 0 ? "rounded-r-lg" : ""}`}
              style={{
                width: `${Math.min(voteCalculations.barPercentageAgainst, 100)}%`,
                left: `${Math.min(voteCalculations.barPercentageFor, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Vote breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>For: {voteDisplayData?.votesFor || "--"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Against: {voteDisplayData?.votesAgainst || "--"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
            <span>Liquid Token: </span>
            <TokenBalance
              value={liquidTokens}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
              showSymbol={false}
              className=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteStatusChart;
