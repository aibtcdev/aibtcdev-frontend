import { useQuery } from "@tanstack/react-query";
import {
  fetchVetos,
  fetchProposalVetos,
  fetchDAOVetos,
  fetchVetoById,
} from "@/services/veto.service";

// Base hook for fetching all vetos
export function useVetos() {
  return useQuery({
    queryKey: ["vetos"],
    queryFn: fetchVetos,
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });
}

// Hook for fetching vetos for a specific proposal
export function useProposalVetos(proposalId: string) {
  return useQuery({
    queryKey: ["vetos", "proposal", proposalId],
    queryFn: () => fetchProposalVetos(proposalId),
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });
}

// Hook for fetching vetos for a specific DAO
export function useDAOVetos(daoId: string) {
  return useQuery({
    queryKey: ["vetos", "dao", daoId],
    queryFn: () => fetchDAOVetos(daoId),
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });
}

// Hook for fetching a single veto by ID
export function useVeto(vetoId: string) {
  return useQuery({
    queryKey: ["veto", vetoId],
    queryFn: () => fetchVetoById(vetoId),
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });
}

// Computed hook for checking if a proposal has vetos
export function useProposalHasVetos(proposalId: string) {
  const { data: vetos } = useQuery({
    queryKey: ["vetos", "proposal", proposalId],
    queryFn: () => fetchProposalVetos(proposalId),
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });

  const hasVetos = Boolean(vetos && vetos.length > 0);
  const vetoCount = vetos?.length || 0;

  return {
    hasVetos,
    vetoCount,
    vetos,
    error: null, // Suppress errors for UI
  };
}

// Computed hook for DAO veto stats
export function useDAOVetoStats(daoId: string) {
  const { data: vetos } = useQuery({
    queryKey: ["vetos", "dao", daoId],
    queryFn: () => fetchDAOVetos(daoId),
    staleTime: 300000, // 5 minutes
    retry: 1,
    retryOnMount: false,
  });

  const totalVetos = vetos?.length || 0;
  const uniqueVetoers = new Set(vetos?.map((v) => v.address).filter(Boolean))
    .size;
  const totalVetoAmount =
    vetos?.reduce((sum, veto) => {
      const amount = parseFloat(veto.amount || "0");
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0) || 0;

  return {
    totalVetos,
    uniqueVetoers,
    totalVetoAmount,
    vetos,
    error: null, // Suppress errors for UI
  };
}

// Utility hook for formatting veto amounts
export function useFormattedVetoAmount(
  amount: string | null | undefined
): string {
  if (!amount) return "0";

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount === 0) return "0";

  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M`;
  }

  if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K`;
  }

  return numAmount.toString();
}
