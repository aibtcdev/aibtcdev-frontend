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
            bustCache
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
    [contractAddress, proposalId, refreshing, bustCache]
  );

  // Use useQuery with memoized options
  const { data, isLoading, error } = useQuery(queryOptions);

  // Memoize vote calculations to prevent unnecessary recalculations
  const voteCalculations = useMemo(() => {
    const votesForNum = Number(parsedVotes.votesFor) || 0;
    const votesAgainstNum = Number(parsedVotes.votesAgainst) || 0;
    const totalVotes = votesForNum + votesAgainstNum;
    const liquidTokensNum = Number(liquidTokens) || 0;

    // Calculate percentages based on total liquid tokens (for display in text)
    const liquidPercentageFor =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const liquidPercentageAgainst =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;

    // Calculate percentages of cast votes for the progress bar
    const barPercentageFor =
      totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
    const barPercentageAgainst =
      totalVotes > 0 ? (votesAgainstNum / totalVotes) * 100 : 0;

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      liquidPercentageFor,
      liquidPercentageAgainst,
      barPercentageFor,
      barPercentageAgainst,
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
      <div className="text-red-500 text-sm">
        Error: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with refresh controls - Always show refresh button */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground"></div>

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

      <div className="relative h-3 sm:h-4 bg-muted rounded-md overflow-hidden">
        {voteCalculations.totalVotes > 0 ? (
          <>
            {/* For votes */}
            <div
              className="absolute h-full bg-green-500/80 left-0 transition-all duration-500 ease-out flex items-center justify-start pl-1 sm:pl-2"
              style={{ width: `${voteCalculations.barPercentageFor}%` }}
            >
              {voteCalculations.barPercentageFor > 15 && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-white text-xs font-medium">
                  <ThumbsUp className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                  <span className="hidden sm:inline">
                    {voteCalculations.barPercentageFor.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Against votes */}
            <div
              className="absolute h-full bg-red-500/80 transition-all duration-500 ease-out flex items-center justify-start pl-1 sm:pl-2"
              style={{
                width: `${voteCalculations.barPercentageAgainst}%`,
                left: `${voteCalculations.barPercentageFor}%`,
              }}
            >
              {voteCalculations.barPercentageAgainst > 15 && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-white text-xs font-medium">
                  <ThumbsDown className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                  <span className="hidden sm:inline">
                    {voteCalculations.barPercentageAgainst.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-muted/50"></div>
        )}
      </div>

      {/* Mobile: Stacked Layout */}
      <div className="space-y-2 sm:hidden text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">For:</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
            <TokenBalance
              value={parsedVotes.votesFor}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
              showSymbol={false}
              className="truncate text-right"
            />
            <span className="text-green-400 font-medium flex-shrink-0 text-xs">
              ({voteCalculations.liquidPercentageFor.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">Against:</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
            <TokenBalance
              value={parsedVotes.votesAgainst}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
              showSymbol={false}
              className="truncate text-right"
            />
            <span className="text-red-400 font-medium flex-shrink-0 text-xs">
              ({voteCalculations.liquidPercentageAgainst.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0"></div>
            <span className="text-muted-foreground">Total:</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
            <TokenBalance
              value={liquidTokens || "0"}
              symbol={tokenSymbol}
              decimals={8}
              variant="abbreviated"
              showSymbol={false}
              className="truncate text-right"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer flex-shrink-0">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-xs">
                  <p>
                    Total liquid tokens available for voting.
                    <br />
                    {(
                      100 -
                      voteCalculations.liquidPercentageFor -
                      voteCalculations.liquidPercentageAgainst
                    ).toFixed(1)}
                    % have not voted.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden sm:grid grid-cols-3 gap-2 text-xs">
        <div className="min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <span className="text-muted-foreground">For:</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <TokenBalance
                value={parsedVotes.votesFor}
                symbol={tokenSymbol}
                decimals={8}
                variant="abbreviated"
                showSymbol={false}
                className="truncate"
              />
              <span className="text-green-400 font-medium flex-shrink-0">
                ({voteCalculations.liquidPercentageFor.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
              <span className="text-muted-foreground">Against:</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <TokenBalance
                value={parsedVotes.votesAgainst}
                symbol={tokenSymbol}
                decimals={8}
                variant="abbreviated"
                showSymbol={false}
                className="truncate"
              />
              <span className="text-red-400 font-medium flex-shrink-0">
                ({voteCalculations.liquidPercentageAgainst.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0"></div>
              <span className="text-muted-foreground">Total:</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <TokenBalance
                value={liquidTokens || "0"}
                symbol={tokenSymbol}
                decimals={8}
                variant="abbreviated"
                showSymbol={false}
                className="truncate"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer flex-shrink-0">
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    <p>
                      Total liquid tokens available for voting.
                      <br />
                      {(
                        100 -
                        voteCalculations.liquidPercentageFor -
                        voteCalculations.liquidPercentageAgainst
                      ).toFixed(1)}
                      % have not voted.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteStatusChart;
