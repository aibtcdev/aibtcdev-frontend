"use client";

import { useState, useCallback } from "react";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useProposalVote } from "@/hooks/useProposalVote";
import type { Proposal, ProposalWithDAO } from "@/types";

interface VoteStatusChartProps {
  proposalId?: string;
  initialVotesFor?: string;
  initialVotesAgainst?: string;
  refreshing?: boolean;
  tokenSymbol?: string;
  liquidTokens?: string;
  proposal?: Proposal | ProposalWithDAO;
}

const VoteStatusChart = ({
  initialVotesFor,
  initialVotesAgainst,
  // refreshing = false,
  tokenSymbol = "",
  liquidTokens,
  proposal,
}: VoteStatusChartProps) => {
  const [localRefreshing, setLocalRefreshing] = useState(false);
  // const [nextRefreshIn, setNextRefreshIn] = useState(60);

  // Use the consolidated vote hook
  const {
    voteDisplayData,
    calculations,
    isLoading: isLoadingVotes,
    error,
    hasData,
    refreshVoteData,
  } = useProposalVote({
    proposal: proposal!,
    contractPrincipal: proposal?.contract_principal,
    fallbackVotesFor: initialVotesFor,
    fallbackVotesAgainst: initialVotesAgainst,
  });

  // Manual refresh function using the hook's refresh
  const refreshVotesData = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setLocalRefreshing(true);
      try {
        await refreshVoteData();
        await new Promise((resolve) => setTimeout(resolve, 500));
      } finally {
        setLocalRefreshing(false);
      }
    },
    [refreshVoteData]
  );

  // Show loading state
  if (isLoadingVotes && !error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">
          Loading vote data...
        </span>
      </div>
    );
  }

  // Show error state with retry
  if (error || (!hasData && !isLoadingVotes)) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-2">
        <div className="flex items-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">Failed to load vote data</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshVotesData}
          disabled={localRefreshing}
          className="text-xs"
        >
          {localRefreshing ? (
            <div className="animate-spin rounded-sm h-3 w-3 border-b border-current mr-1" />
          ) : (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          Retry
        </Button>
      </div>
    );
  }

  if (!voteDisplayData || !calculations) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="text-sm text-muted-foreground">
          No vote data available
        </span>
      </div>
    );
  }

  // const isRefreshingAny = localRefreshing || refreshing;

  // Main vote display
  return (
    <div className="space-y-2">
      {/* Vote Progress Bar */}
      <div className="relative">
        <div className="h-3 sm:h-4 bg-muted rounded-sm overflow-hidden relative">
          {/* Votes for (green) */}
          <div
            className="absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out rounded-l-full"
            style={{
              width: `${Math.min(calculations.barPercentageFor, 100)}%`,
            }}
          />
          {/* Votes against (red) */}
          <div
            className="absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(calculations.barPercentageAgainst, 100)}%`,
              left: `${Math.min(calculations.barPercentageFor, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Vote Counts */}
      <div className="flex justify-between items-center text-xs sm:text-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-sm" />
          <span className="text-muted-foreground">For:</span>
          <TokenBalance
            value={voteDisplayData.rawVotesFor}
            decimals={8}
            variant="abbreviated"
            symbol={tokenSymbol}
            className="font-medium"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Against:</span>
          <TokenBalance
            value={voteDisplayData.rawVotesAgainst}
            decimals={8}
            variant="abbreviated"
            symbol={tokenSymbol}
            className="font-medium"
          />
          <div className="w-2 h-2 bg-red-500 rounded-sm" />
        </div>

        {/* Liquid Tokens - Right */}
        {liquidTokens && Number(liquidTokens) > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Liquid:</span>
            <TokenBalance
              value={liquidTokens}
              decimals={8}
              variant="abbreviated"
              symbol={tokenSymbol}
              className="font-medium"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteStatusChart;
