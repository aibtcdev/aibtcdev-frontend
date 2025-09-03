import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProposalVotes } from "@/lib/vote-utils";
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
  votesFor: string;
  votesAgainst: string;
  liquidTokens: string;
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
  const formatBalance = useCallback(
    (value: string | number, decimals: number = 8): string => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "0";

      const normalized = num / Math.pow(10, decimals);

      if (normalized >= 1000000) {
        return `${(normalized / 1000000).toFixed(2)}M`;
      }
      if (normalized >= 1000) {
        return `${(normalized / 1000).toFixed(2)}K`;
      }
      if (normalized < 1 && normalized > 0) {
        return normalized.toFixed(decimals).replace(/\.?0+$/, "");
      }

      return normalized.toFixed(decimals).replace(/\.?0+$/, "");
    },
    []
  );

  // Primary vote data source
  const primaryQuery = useQuery({
    queryKey: [
      "proposalVotes",
      contractPrincipal,
      proposalId,
      // Always use consistent cache key for critical periods
      shouldAlwaysBustCache
        ? "fresh"
        : shouldBustCache
          ? "transition"
          : "cached",
    ],
    queryFn: async (): Promise<VoteDataSource> => {
      if (!proposalId || !contractPrincipal) {
        throw new Error("Missing proposal ID or contract principal");
      }

      const shouldForceFresh = shouldAlwaysBustCache || shouldBustCache;
      const cacheBustReason = shouldAlwaysBustCache
        ? "Active proposal"
        : shouldBustCache
          ? "Status transition"
          : "Normal fetch";

      // console.log(`🔄 [VOTE DATA] Fetching vote data for proposal ${proposalId} (${cacheBustReason})`);
      // console.log(`   [VOTE DATA] Cache flags - shouldAlwaysBustCache: ${shouldAlwaysBustCache}, shouldBustCache: ${shouldBustCache}, shouldForceFresh: ${shouldForceFresh}`);

      try {
        const result = await getProposalVotes(
          contractPrincipal,
          proposalId,
          shouldForceFresh // Force fresh data for active proposals or transitions
        );

        // Reset cache bust flag after successful fetch (only for status transitions)
        if (shouldBustCache) {
          resetCacheBust();
        }

        // console.log(`✅ [VOTE DATA] Primary data fetched from vote-utils:`, {
        //   votesFor: result.votesFor,
        //   votesAgainst: result.votesAgainst,
        //   liquidTokens: result.liquidTokens,
        //   cacheBustReason,
        //   source: 'vote-utils (blockchain/cache)'
        // });

        return {
          votesFor: result.votesFor || null,
          votesAgainst: result.votesAgainst || null,
          liquidTokens: result.liquidTokens || proposal.liquid_tokens || null,
          source: "vote-utils",
        };
      } catch (error) {
        // console.warn("❌ [VOTE DATA] Primary vote fetch failed:", error);
        throw error;
      }
    },
    enabled: !!proposalId && !!contractPrincipal,
    staleTime,
    retry: (failureCount, error) => {
      if (
        error?.message?.includes("Invalid") ||
        error?.message?.includes("missing")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fallback data source
  const fallbackQuery = useQuery({
    queryKey: ["proposalVotesFallback", proposal.id],
    queryFn: async (): Promise<VoteDataSource> => {
      // console.log(`🔄 [VOTE DATA] Fetching fallback vote data for proposal ${proposal.id} from Supabase`);

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

      // console.log(`✅ [VOTE DATA] Fallback data fetched from Supabase:`, {
      //   votesFor: totalFor.toString(),
      //   votesAgainst: totalAgainst.toString(),
      //   liquidTokens: proposal.liquid_tokens,
      //   source: 'supabase (database)'
      // });

      return {
        votesFor: totalFor.toString(),
        votesAgainst: totalAgainst.toString(),
        liquidTokens: proposal.liquid_tokens,
        source: "supabase",
      };
    },
    enabled: !!proposal.id,
    retry: 2,
    retryDelay: 1000,
    staleTime,
  });

  // Determine active data source
  const activeVoteData = useMemo(() => {
    if (primaryQuery.data && !primaryQuery.error) {
      // console.log(`📊 [VOTE DATA] Using PRIMARY data source (vote-utils):`, {
      //   votesFor: primaryQuery.data.votesFor,
      //   votesAgainst: primaryQuery.data.votesAgainst,
      //   source: primaryQuery.data.source,
      //   proposalId: proposal.id
      // });
      setDataSource("vote-utils");
      return primaryQuery.data;
    }

    if (fallbackQuery.data && !fallbackQuery.error) {
      // console.log(`📊 [VOTE DATA] Using FALLBACK data source (Supabase):`, {
      //   votesFor: fallbackQuery.data.votesFor,
      //   votesAgainst: fallbackQuery.data.votesAgainst,
      //   source: fallbackQuery.data.source,
      //   proposalId: proposal.id
      // });
      setDataSource("supabase");
      return fallbackQuery.data;
    }

    // Final fallback to proposal props
    if (fallbackVotesFor && fallbackVotesAgainst) {
      // console.log(`📊 [VOTE DATA] Using PROPS data source:`, {
      //   votesFor: fallbackVotesFor,
      //   votesAgainst: fallbackVotesAgainst,
      //   source: 'props',
      //   proposalId: proposal.id
      // });
      setDataSource("props");
      return {
        votesFor: fallbackVotesFor,
        votesAgainst: fallbackVotesAgainst,
        liquidTokens: proposal.liquid_tokens || null,
        source: "props",
      };
    }

    // console.warn(`⚠️ [VOTE DATA] No data source available for proposal ${proposal.id}`);
    setDataSource("none");
    return null;
  }, [
    primaryQuery.data,
    primaryQuery.error,
    fallbackQuery.data,
    fallbackQuery.error,
    fallbackVotesFor,
    fallbackVotesAgainst,
    proposal.liquid_tokens,
  ]);

  // Process vote data for display
  const voteDisplayData = useMemo((): VoteDisplayData | null => {
    if (!activeVoteData) return null;

    const { votesFor, votesAgainst, liquidTokens } = activeVoteData;

    if (!votesFor || !votesAgainst || !liquidTokens) {
      // console.warn(`⚠️ [VOTE DATA] Incomplete vote data for proposal ${proposal.id}:`, {
      //   votesFor,
      //   votesAgainst,
      //   liquidTokens,
      //   dataSource: activeVoteData.source
      // });
      return null;
    }

    // console.log(`✨ [VOTE DATA] Final processed data for display:`, {
    //   proposalId: proposal.id,
    //   formattedVotesFor: formatBalance(votesFor),
    //   formattedVotesAgainst: formatBalance(votesAgainst),
    //   rawVotesFor: votesFor,
    //   rawVotesAgainst: votesAgainst,
    //   dataSource: activeVoteData.source
    // });

    return {
      votesFor: formatBalance(votesFor),
      votesAgainst: formatBalance(votesAgainst),
      liquidTokens: formatBalance(liquidTokens),
      rawVotesFor: votesFor,
      rawVotesAgainst: votesAgainst,
      rawLiquidTokens: liquidTokens,
    };
  }, [activeVoteData, formatBalance]);

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
    if (!contractPrincipal || !proposalId) {
      // console.warn(`⚠️ [VOTE DATA] Cannot refresh: missing contractPrincipal (${contractPrincipal}) or proposalId (${proposalId})`);
      return;
    }

    try {
      // console.log(`🔄 [VOTE DATA] Manual refresh triggered for proposal ${proposalId}`);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["proposalVotes", contractPrincipal, proposalId],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["proposalVotesFallback", proposal.id],
          refetchType: "all",
        }),
      ]);

      // console.log(`✅ [VOTE DATA] Vote data refreshed for proposal ${proposalId}`);
    } catch {
      console.error("❌ Failed to refresh vote data:");
    }
  }, [queryClient, contractPrincipal, proposalId, proposal.id]);

  // Determine loading and error states
  const isLoading = useMemo(() => {
    if (voteDisplayData) return false;
    if (primaryQuery.error && fallbackQuery.error) return false;
    return primaryQuery.isLoading || fallbackQuery.isLoading;
  }, [
    voteDisplayData,
    primaryQuery.isLoading,
    primaryQuery.error,
    fallbackQuery.isLoading,
    fallbackQuery.error,
  ]);

  const hasError = useMemo(() => {
    return !voteDisplayData && primaryQuery.error && fallbackQuery.error;
  }, [voteDisplayData, primaryQuery.error, fallbackQuery.error]);

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
