import { useQuery } from "@tanstack/react-query";
import { fetchProposalVetos } from "@/services/veto.service";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useMemo } from "react";

interface UseVetoCheckProps {
  proposal: Proposal | ProposalWithDAO;
  votesForNum?: number;
}

interface VetoCheckResult {
  totalVetoAmount: number;
  rawTotalVetoAmount: string;
  vetoExceedsForVote: boolean;
  isLoading: boolean;
  error: boolean;
}

/**
 * Hook to check if veto amount exceeds the For votes
 * Vetos are formatted the same way as votes (divided by 1e8)
 */
export function useVetoCheck({
  proposal,
  votesForNum = 0,
}: UseVetoCheckProps): VetoCheckResult {
  // Fetch vetos for this proposal
  const {
    data: vetos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposalVetos", proposal.id],
    queryFn: async () => {
      if (!proposal.id) {
        return [];
      }
      return await fetchProposalVetos(proposal.id);
    },
    enabled: !!proposal.id,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Calculate total veto amount
  const vetoCalculations = useMemo(() => {
    if (!vetos || vetos.length === 0) {
      return {
        totalVetoAmount: 0,
        rawTotalVetoAmount: "0",
        vetoExceedsForVote: false,
      };
    }

    // Sum up all veto amounts
    const totalRaw = vetos.reduce((sum, veto) => {
      const amount = veto.amount ? parseFloat(veto.amount) : 0;
      return sum + amount;
    }, 0);

    // Format veto amount the same way as votes (divide by 1e8)
    const totalFormatted = totalRaw;

    // Check if veto exceeds For votes
    const vetoExceedsForVote = totalFormatted > votesForNum;

    return {
      totalVetoAmount: totalFormatted,
      rawTotalVetoAmount: totalRaw.toString(),
      vetoExceedsForVote,
    };
  }, [vetos, votesForNum]);

  return {
    ...vetoCalculations,
    isLoading,
    error: !!error,
  };
}
