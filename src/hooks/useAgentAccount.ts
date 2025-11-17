import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { fetchAgents } from "@/services/agent.service";

interface AgentAccountBalance {
  stx: { balance: string };
  fungible_tokens: Record<string, { balance: string }>;
  non_fungible_tokens: Record<string, { count: number }>;
}

interface UseAgentAccountReturn {
  userAgentAddress: string | null;
  userAgentBalance: AgentAccountBalance | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgentAccount(): UseAgentAccountReturn {
  const { balances, fetchContractBalance } = useWalletStore();
  const { userId } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Fetch the user agent
  const {
    data: agents = [],
    isLoading: isLoadingAgents,
    error: agentsError,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ["agents", userId],
    queryFn: () => fetchAgents(userId || undefined),
    enabled: !!userId, // Only fetch if userId is available
  });

  // Get the user agent's on-chain account address
  const userAgent = agents[0] || null;
  const userAgentAddress = userAgent?.account_contract || null;

  // Fetch contract account balance when address is available
  useEffect(() => {
    if (userAgentAddress) {
      fetchContractBalance(userAgentAddress).catch((err) => {
        console.error("Failed to fetch contract balance:", err);
        setError("Failed to fetch contract balance");
      });
    }
  }, [userAgentAddress, fetchContractBalance]);

  // Get balance for the agent contract account
  const userAgentBalance = userAgentAddress ? balances[userAgentAddress] : null;

  // Handle errors
  useEffect(() => {
    if (agentsError) {
      setError("Failed to fetch agents");
    } else {
      setError(null);
    }
  }, [agentsError]);

  const refetch = () => {
    refetchAgents();
    if (userAgentAddress) {
      fetchContractBalance(userAgentAddress).catch((err) => {
        console.error("Failed to refetch contract balance:", err);
        setError("Failed to refetch contract balance");
      });
    }
  };

  return {
    userAgentAddress,
    userAgentBalance,
    isLoading: isLoadingAgents,
    error,
    refetch,
  };
}
