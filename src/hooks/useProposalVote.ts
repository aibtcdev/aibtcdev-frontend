import { useState, useEffect, useCallback, useMemo } from "react";
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

/**
 * Comprehensive hook for managing proposal vote data with smart caching and error handling
 */
export function useProposalVote({
  proposal,
  contractPrincipal,
  fallbackVotesFor,
  fallbackVotesAgainst,
}: UseProposalVoteProps) {
  const queryClient = useQueryClient();
  const [hasVoteDataError, setHasVoteDataError] = useState(false);
  const [voteDisplayData, setVoteDisplayData] =
    useState<VoteDisplayData | null>(null);

  // Get proposal status
  const { status, isActive } = useProposalStatus(proposal);
  const proposalId = Number(proposal.proposal_id);

  // Use smart cache busting
  const {
    shouldBustCache,
    resetCacheBust,
    shouldPoll,
    pollInterval,
    staleTime,
  } = useSmartCacheBusting({
    proposalId,
    contractPrincipal: contractPrincipal || "",
    proposalStatus: status,
    isActive,
  });

  // Utility function to format vote balances
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

  // Primary vote data source (vote-utils)
  const {
    data: proposalVoteData,
    isLoading: isPrimaryLoading,
    error: primaryError,
  } = useQuery({
    queryKey: [
      "proposalVotes",
      contractPrincipal,
      proposalId,
      shouldBustCache ? "bust" : "cached",
    ],
    queryFn: async () => {
      if (!proposalId || !contractPrincipal) {
        throw new Error("Missing proposal ID or contract principal");
      }

      const result = await getProposalVotes(
        contractPrincipal,
        proposalId,
        shouldBustCache || shouldPoll
      );

      // Reset cache bust flag after successful fetch
      if (shouldBustCache) {
        resetCacheBust();
      }

      // Clear error state on successful fetch
      setHasVoteDataError(false);

      return {
        ...result,
        source: "vote-utils",
      };
    },
    enabled: !!proposalId && !!contractPrincipal,
    staleTime: staleTime,
    refetchInterval: pollInterval,
    retry: (failureCount: number, error: Error) => {
      // Don't retry if it's a validation error
      if (
        error?.message?.includes("Invalid") ||
        error?.message?.includes("missing")
      ) {
        return false;
      }
      return failureCount < 2; // Retry up to 2 times for network errors
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fallback vote data source (Supabase)
  const {
    data: fallbackVoteData,
    isLoading: isFallbackLoading,
    error: fallbackError,
  } = useQuery({
    queryKey: ["proposalVotesFallback", proposal.id],
    queryFn: async () => {
      console.log(
        "Fallback: Fetching from Supabase for proposal.id:",
        proposal.id
      );
      const votes = await fetchProposalVotes(proposal.id);
      console.log("Fallback: Retrieved votes:", votes.length, "votes");

      // Aggregate vote counts from individual votes
      const votesFor = votes.filter((vote) => vote.answer === true);
      const votesAgainst = votes.filter((vote) => vote.answer === false);

      // Sum up vote amounts (assuming amount field contains vote weight)
      const totalFor = votesFor.reduce((sum, vote) => {
        const amount = vote.amount ? parseFloat(vote.amount) : 1; // Default to 1 if no amount
        return sum + amount;
      }, 0);

      const totalAgainst = votesAgainst.reduce((sum, vote) => {
        const amount = vote.amount ? parseFloat(vote.amount) : 1;
        return sum + amount;
      }, 0);

      const result = {
        votesFor: totalFor.toString(),
        votesAgainst: totalAgainst.toString(),
        liquidTokens: proposal.liquid_tokens,
        source: "supabase",
      };

      console.log("Fallback: Aggregated vote data:", result);
      return result;
    },
    enabled: !!proposal.id, // Always enabled when proposal.id exists
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000, // 1 minute stale time for fallback
  });

  // Determine which data source to use - prioritize primary, fallback to Supabase
  const activeVoteData = proposalVoteData || fallbackVoteData;
  const isLoading = isPrimaryLoading && isFallbackLoading; // Both must be loading to show loading state

  // Log which data source is being used
  useEffect(() => {
    if (activeVoteData) {
      const dataSource = proposalVoteData
        ? "vote-utils"
        : fallbackVoteData
          ? "supabase"
          : "unknown";
      console.log("Using data source:", dataSource);
      console.log("Raw vote data:", activeVoteData);
      console.log("Formatted votes:", {
        votesFor: activeVoteData.votesFor,
        votesAgainst: activeVoteData.votesAgainst,
      });
    }
  }, [activeVoteData, proposalVoteData, fallbackVoteData]);

  // Comprehensive debug logging
  useEffect(() => {
    console.log("\n🔍 === VOTE DATA COMPARISON ===");
    console.log("📋 Proposal:", proposal.proposal_id || proposal.id);

    // Primary (vote-utils) data
    console.log("\n🌐 VOTE-UTILS:");
    console.log("  Loading:", isPrimaryLoading);
    console.log("  Error:", primaryError?.message || "none");
    console.log("  Has Data:", !!proposalVoteData);
    if (proposalVoteData) {
      console.log("  Votes For:", proposalVoteData.votesFor);
      console.log("  Votes Against:", proposalVoteData.votesAgainst);
      console.log("  Source:", proposalVoteData.source || "vote-utils");
    }

    // Fallback (Supabase) data
    console.log("\n🗄️ SUPABASE:");
    console.log("  Loading:", isFallbackLoading);
    console.log("  Error:", fallbackError?.message || "none");
    console.log("  Has Data:", !!fallbackVoteData);
    if (fallbackVoteData) {
      console.log("  Votes For:", fallbackVoteData.votesFor);
      console.log("  Votes Against:", fallbackVoteData.votesAgainst);
      console.log("  Source:", fallbackVoteData.source);
    }

    // Final decision - CLEAR DISPLAY SOURCE
    const dataSource = proposalVoteData
      ? "VOTE-UTILS"
      : fallbackVoteData
        ? "SUPABASE"
        : "NONE";
    console.log(`\n🎯 DISPLAYING: ${dataSource} DATA`);
    if (activeVoteData) {
      console.log(`📊 Final Display Values:`);
      console.log(`  For: ${activeVoteData.votesFor}`);
      console.log(`  Against: ${activeVoteData.votesAgainst}`);
    }
    console.log("================================\n");
  }, [
    proposal.id,
    proposal.proposal_id,
    isPrimaryLoading,
    primaryError,
    proposalVoteData,
    isFallbackLoading,
    fallbackVoteData,
    fallbackError,
    activeVoteData,
  ]);

  // Process and format vote data with fallback logic
  useEffect(() => {
    // Only clear data if both primary and fallback completely failed
    if (
      primaryError &&
      fallbackError &&
      !fallbackVoteData &&
      !proposalVoteData
    ) {
      console.log("Both primary and fallback failed, clearing data");
      setVoteDisplayData(null);
      return;
    }

    if (activeVoteData) {
      const rawFor = activeVoteData.votesFor || activeVoteData.data?.votesFor;
      const rawAgainst =
        activeVoteData.votesAgainst || activeVoteData.data?.votesAgainst;
      const rawLiquidTokens =
        activeVoteData.liquidTokens ||
        activeVoteData.data?.liquidTokens ||
        proposal.liquid_tokens;

      // Validate that we have actual vote data (not just undefined/null)
      if (rawFor !== undefined && rawAgainst !== undefined && rawLiquidTokens) {
        setVoteDisplayData({
          votesFor: formatBalance(rawFor),
          votesAgainst: formatBalance(rawAgainst),
          liquidTokens: formatBalance(rawLiquidTokens),
          rawVotesFor: rawFor,
          rawVotesAgainst: rawAgainst,
          rawLiquidTokens: rawLiquidTokens,
        });

        // Clear error state when we have valid data
        setHasVoteDataError(false);
      } else {
        console.warn("Invalid vote data structure:", {
          rawFor,
          rawAgainst,
          rawLiquidTokens,
        });
        setVoteDisplayData(null);
      }
    } else if (
      !primaryError &&
      !hasVoteDataError &&
      fallbackVotesFor &&
      fallbackVotesAgainst
    ) {
      // Only fallback to initial props if there's no error
      setVoteDisplayData({
        votesFor: formatBalance(fallbackVotesFor),
        votesAgainst: formatBalance(fallbackVotesAgainst),
        liquidTokens: formatBalance(proposal.liquid_tokens),
        rawVotesFor: fallbackVotesFor,
        rawVotesAgainst: fallbackVotesAgainst,
        rawLiquidTokens: proposal.liquid_tokens,
      });
    } else {
      setVoteDisplayData(null);
    }
  }, [
    activeVoteData,
    primaryError,
    hasVoteDataError,
    fallbackVoteData,
    fallbackVotesFor,
    fallbackVotesAgainst,
    proposal.liquid_tokens,
    formatBalance,
    fallbackError,
    proposalVoteData,
  ]);

  // Calculate vote metrics
  const calculations = useMemo((): VoteCalculations | null => {
    if (!voteDisplayData || primaryError || hasVoteDataError) {
      return null;
    }

    const votesForNum = Number(voteDisplayData.rawVotesFor || 0);
    const votesAgainstNum = Number(voteDisplayData.rawVotesAgainst || 0);
    const totalVotes = votesForNum + votesAgainstNum;
    const liquidTokensNum = Number(voteDisplayData.rawLiquidTokens || 0);

    // Calculate percentages based on liquid tokens
    const participationRate =
      liquidTokensNum > 0 ? (totalVotes / liquidTokensNum) * 100 : 0;
    const approvalRate = totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
    const votesForPercent =
      liquidTokensNum > 0 ? (votesForNum / liquidTokensNum) * 100 : 0;
    const votesAgainstPercent =
      liquidTokensNum > 0 ? (votesAgainstNum / liquidTokensNum) * 100 : 0;

    // Bar percentages (same as vote percentages for liquid token-based display)
    const barPercentageFor = votesForPercent;
    const barPercentageAgainst = votesAgainstPercent;

    // Calculate unvoted tokens
    const unvotedTokensNum = liquidTokensNum - votesForNum - votesAgainstNum;
    const unvotedPercentage =
      liquidTokensNum > 0 ? (unvotedTokensNum / liquidTokensNum) * 100 : 0;

    return {
      votesForNum,
      votesAgainstNum,
      totalVotes,
      liquidTokensNum,
      participationRate,
      approvalRate,
      votesForPercent,
      votesAgainstPercent,
      barPercentageFor,
      barPercentageAgainst,
      unvotedTokensNum,
      unvotedPercentage,
    };
  }, [voteDisplayData, primaryError, hasVoteDataError]);

  // Manual refresh function
  const refreshVoteData = useCallback(async () => {
    if (!contractPrincipal || !proposalId) return;

    setHasVoteDataError(false);

    try {
      await queryClient.invalidateQueries({
        queryKey: ["proposalVotes", contractPrincipal, proposalId],
        refetchType: "all",
      });
    } catch (error) {
      console.error("Failed to refresh vote data:", error);
      setHasVoteDataError(true);
    }
  }, [queryClient, contractPrincipal, proposalId]);

  return {
    // Data
    voteDisplayData,
    calculations,

    // State
    isLoading,
    error: primaryError && !fallbackVoteData ? true : hasVoteDataError,
    hasData: !!voteDisplayData && !!calculations,

    // Actions
    refreshVoteData,

    // Polling info
    shouldPoll,
    isActive,

    // Raw data for advanced use cases
    rawData: activeVoteData,

    // Fallback info
    usingFallback: !!primaryError && !!fallbackVoteData,
  };
}
