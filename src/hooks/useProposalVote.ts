import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/services/vote.service";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useSmartCacheBusting } from "@/hooks/useSmartCacheBusting";
import type { Proposal, ProposalWithDAO } from "@/types";

interface UseProposalVoteProps {
  proposal: Proposal | ProposalWithDAO;
  contractPrincipal?: string;
  fallbackVotesFor?: string;
  fallbackVotesAgainst?: string;
}

interface VoteDisplayData {
  rawVotesFor: string;
  rawVotesAgainst: string;
  rawLiquidTokens: string;
}

interface VoteCalculations {
  votesForNum: number;
  votesAgainstNum: number;
  totalVotes: number;
  liquidTokensNum: number;
  participationRate: number;
  approvalRate: number;
  votesForPercent: number;
  votesAgainstPercent: number;
  barPercentageFor: number;
  barPercentageAgainst: number;
  unvotedTokensNum: number;
  unvotedPercentage: number;
}

interface VoteDataSource {
  votesFor: string;
  votesAgainst: string;
  liquidTokens: string;
  source: string;
}

/**
 * Hook for managing proposal vote data with cache busting for active proposals
 */
export function useProposalVote({
  proposal,
  contractPrincipal,
  fallbackVotesFor,
  fallbackVotesAgainst,
}: UseProposalVoteProps) {
  const queryClient = useQueryClient();
  const [dataSource, setDataSource] = useState<string>("none");

  // Get proposal status
  const { status, isActive } = useProposalStatus(proposal);
  const proposalId = Number(proposal.proposal_id);

  // Use smart cache busting
  const { shouldBustCache, resetCacheBust, shouldAlwaysBustCache, staleTime } =
    useSmartCacheBusting({
      proposalId,
      contractPrincipal: contractPrincipal || "",
      proposalStatus: status,
      isActive,
    });

  // Memoized format function
  // const formatBalance = useCallback(
  //   (value: string | number, decimals: number = 8): string | null => {
  //     const num = typeof value === "string" ? parseFloat(value) : value;
  //     if (isNaN(num) || num < 0) return null;

  //     const normalized = num / Math.pow(10, decimals);

  //     if (normalized >= 1000000) {
  //       return `${(normalized / 1000000).toFixed(2)}M`;
  //     }
  //     if (normalized >= 1000) {
  //       return `${(normalized / 1000).toFixed(2)}K`;
  //     }
  //     if (normalized < 1 && normalized > 0) {
  //       return normalized.toFixed(decimals).replace(/\.?0+$/, "");
  //     }

  //     return normalized.toFixed(decimals).replace(/\.?0+$/, "");
  //   },
  //   []
  // );

  // Primary vote data source - using database directly
  const primaryQuery = useQuery({
    queryKey: [
      "proposalVotesDB",
      proposal.id,
      // Cache bust for active proposals OR status transitions
      shouldAlwaysBustCache || shouldBustCache ? "fresh" : "cached",
    ],
    queryFn: async (): Promise<VoteDataSource> => {
      if (!proposal.id) {
        throw new Error("Missing proposal ID");
      }

      // console.log(`🔄 Fetching vote data from database for proposal ${proposal.id}`);

      const votes = await fetchProposalVotes(proposal.id);

      const { totalFor, totalAgainst } = votes.reduce(
        (acc, vote) => {
          const amount = vote.amount ? parseFloat(vote.amount) : 1;
          if (vote.answer === true) {
            acc.totalFor += amount;
          } else {
            acc.totalAgainst += amount;
          }
          return acc;
        },
        { totalFor: 0, totalAgainst: 0 }
      );

      // Reset cache bust flag after successful fetch (only for status transitions)
      if (shouldBustCache) {
        resetCacheBust();
      }

      // console.log(`✅ Vote data fetched from database:`, {
      //   votesFor: totalFor.toString(),
      //   votesAgainst: totalAgainst.toString(),
      // });

      return {
        votesFor: totalFor.toString(),
        votesAgainst: totalAgainst.toString(),
        liquidTokens: proposal.liquid_tokens,
        source: "database",
      };
    },
    enabled: !!proposal.id,
    staleTime,
    retry: 2,
    retryDelay: 1000,
  });

  // Determine active data source
  const activeVoteData = useMemo(() => {
    if (primaryQuery.data && !primaryQuery.error) {
      setDataSource("database");
      return primaryQuery.data;
    }

    // Final fallback to proposal props
    if (fallbackVotesFor && fallbackVotesAgainst) {
      setDataSource("props");
      return {
        votesFor: fallbackVotesFor,
        votesAgainst: fallbackVotesAgainst,
        liquidTokens: proposal.liquid_tokens || null,
        source: "props",
      };
    }

    setDataSource("none");
    return null;
  }, [
    primaryQuery.data,
    primaryQuery.error,
    fallbackVotesFor,
    fallbackVotesAgainst,
    proposal.liquid_tokens,
  ]);

  // Process vote data for display
  const voteDisplayData = useMemo((): VoteDisplayData | null => {
    if (!activeVoteData) return null;

    const { votesFor, votesAgainst, liquidTokens } = activeVoteData;

    if (!votesFor || !votesAgainst || !liquidTokens) {
      // console.warn("⚠️ Incomplete vote data:", { votesFor, votesAgainst, liquidTokens });
      return null;
    }

    // Validate that we have valid numeric values
    const votesForNum = parseFloat(votesFor);
    const votesAgainstNum = parseFloat(votesAgainst);
    const liquidTokensNum = parseFloat(liquidTokens);

    if (
      isNaN(votesForNum) ||
      isNaN(votesAgainstNum) ||
      isNaN(liquidTokensNum) ||
      votesForNum < 0 ||
      votesAgainstNum < 0 ||
      liquidTokensNum < 0
    ) {
      return null;
    }

    return {
      rawVotesFor: votesFor,
      rawVotesAgainst: votesAgainst,
      rawLiquidTokens: liquidTokens,
    };
  }, [activeVoteData]);

  // Calculate vote metrics
  const calculations = useMemo((): VoteCalculations | null => {
    if (!voteDisplayData) return null;

    const votesForNum = Number(voteDisplayData.rawVotesFor);
    const votesAgainstNum = Number(voteDisplayData.rawVotesAgainst);
    const liquidTokensNum = Number(voteDisplayData.rawLiquidTokens);
    const totalVotes = votesForNum + votesAgainstNum;

    const safeCalc = (numerator: number, denominator: number) =>
      denominator > 0 ? (numerator / denominator) * 100 : 0;

    const participationRate = safeCalc(totalVotes, liquidTokensNum);
    const approvalRate = safeCalc(votesForNum, totalVotes);
    const votesForPercent = safeCalc(votesForNum, liquidTokensNum);
    const votesAgainstPercent = safeCalc(votesAgainstNum, liquidTokensNum);
    const unvotedTokensNum = Math.max(0, liquidTokensNum - totalVotes);
    const unvotedPercentage = safeCalc(unvotedTokensNum, liquidTokensNum);

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      participationRate,
      approvalRate,
      votesForPercent,
      votesAgainstPercent,
      barPercentageFor: votesForPercent,
      barPercentageAgainst: votesAgainstPercent,
      unvotedTokensNum,
      unvotedPercentage,
    };
  }, [voteDisplayData]);

  // Manual refresh
  const refreshVoteData = useCallback(async () => {
    if (!proposal.id) {
      // console.warn("⚠️ Cannot refresh: missing proposal ID");
      return;
    }

    try {
      // console.log(`🔄 Manual refresh triggered for proposal ${proposal.id}`);

      await queryClient.invalidateQueries({
        queryKey: ["proposalVotesDB", proposal.id],
        refetchType: "all",
      });

      // console.log(`✅ Vote data refreshed for proposal ${proposal.id}`);
    } catch {
      console.error("❌ Failed to refresh vote data:");
    }
  }, [queryClient, proposal.id]);

  // Determine loading and error states
  const isLoading = useMemo(() => {
    if (voteDisplayData) return false;
    if (primaryQuery.error) return false;
    return primaryQuery.isLoading;
  }, [voteDisplayData, primaryQuery.isLoading, primaryQuery.error]);

  const hasError = useMemo(() => {
    return !voteDisplayData && primaryQuery.error;
  }, [voteDisplayData, primaryQuery.error]);

  return {
    // Data
    voteDisplayData,
    calculations,

    // State
    isLoading,
    error: hasError,
    hasData: !!voteDisplayData && !!calculations,
    dataSource,

    // Actions
    refreshVoteData,

    // Status info
    isActive,
    status,

    // Raw data
    rawData: activeVoteData,

    // Debug info
    cacheInfo: {
      shouldAlwaysBustCache,
      shouldBustCache,
      reason: shouldAlwaysBustCache
        ? "Active proposal"
        : shouldBustCache
          ? "Status transition"
          : "Normal caching",
    },
  };
}
