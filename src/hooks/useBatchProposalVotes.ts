import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchBatchProposalVotes,
  fetchBatchProposalVetos,
  type VoteSummary,
  type VetoSummary,
} from "@/services/vote.service";
import type { Proposal } from "@/types";

interface UseBatchProposalVotesProps {
  proposals: Proposal[];
  enabled?: boolean;
}

export interface ProposalVoteData {
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  hasVoteData: boolean;
  rawVotesFor: string;
  rawVotesAgainst: string;
}

export interface ProposalVetoData {
  totalVetoAmount: number;
  rawTotalVetoAmount: string;
  vetoExceedsForVote: boolean;
}

export interface ProposalBatchData {
  voteData: ProposalVoteData;
  vetoData: ProposalVetoData;
}

export function useBatchProposalVotes({
  proposals,
  enabled = true,
}: UseBatchProposalVotesProps) {
  // Extract proposal IDs
  const proposalIds = useMemo(
    () => proposals.map((p) => p.id).filter(Boolean),
    [proposals]
  );

  // Fetch votes
  const votesQuery = useQuery({
    queryKey: ["batchProposalVotes", proposalIds],
    queryFn: () => fetchBatchProposalVotes(proposalIds),
    enabled: enabled && proposalIds.length > 0,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch vetos
  const vetosQuery = useQuery({
    queryKey: ["batchProposalVetos", proposalIds],
    queryFn: () => fetchBatchProposalVetos(proposalIds),
    enabled: enabled && proposalIds.length > 0,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Combine votes and vetos into a single lookup
  const proposalDataMap = useMemo(() => {
    const map: Record<string, ProposalBatchData> = {};

    proposalIds.forEach((id) => {
      // Get vote data
      const voteSummary = votesQuery.data?.get(id);
      const voteData: ProposalVoteData = voteSummary
        ? {
            votesFor: voteSummary.votesFor,
            votesAgainst: voteSummary.votesAgainst,
            totalVotes: voteSummary.totalVotes,
            hasVoteData: true,
            rawVotesFor: voteSummary.votesFor.toString(),
            rawVotesAgainst: voteSummary.votesAgainst.toString(),
          }
        : {
            votesFor: 0,
            votesAgainst: 0,
            totalVotes: 0,
            hasVoteData: false,
            rawVotesFor: "0",
            rawVotesAgainst: "0",
          };

      // Get veto data
      const vetoSummary = vetosQuery.data?.get(id);
      const totalVetoAmount = vetoSummary?.totalVetoAmount || 0;
      const vetoData: ProposalVetoData = {
        totalVetoAmount,
        rawTotalVetoAmount: vetoSummary?.rawTotalVetoAmount || "0",
        vetoExceedsForVote: totalVetoAmount > voteData.votesFor,
      };

      map[id] = { voteData, vetoData };
    });

    return map;
  }, [votesQuery.data, vetosQuery.data, proposalIds]);

  return {
    proposalDataMap,
    isLoading: votesQuery.isLoading || vetosQuery.isLoading,
    error: votesQuery.error || vetosQuery.error,
    refetch: () => {
      votesQuery.refetch();
      vetosQuery.refetch();
    },
  };
}
