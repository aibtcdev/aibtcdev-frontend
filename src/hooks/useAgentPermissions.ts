import { useQuery } from "@tanstack/react-query";

interface AgentPermissions {
  canUseProposals: boolean;
  canApproveRevokeContracts: boolean;
  canBuySell: boolean;
  canDeposit: boolean;
}

export function useAgentPermissions(agentAddress: string | null) {
  const fetchPermissions = async (): Promise<AgentPermissions> => {
    if (!agentAddress) throw new Error("No agent address");

    const [contractAddress, contractName] = agentAddress.split(".");
    const res = await fetch(
      // `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${contractAddress}/${contractName}/get-agent-permissions`,
      `https://aibtcdev-cache-preview.hosting-962.workers.dev/contract-calls/read-only/${contractAddress}/${contractName}/get-agent-permissions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [],
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK,
          cacheControl: {
            bustCache: true,
            ttl: 0,
          },
        }),
      }
    );

    if (!res.ok) throw new Error("Failed to fetch permissions");

    const response = await res.json();
    const apiData = response?.data;

    // Map API response to expected interface
    return {
      canUseProposals: apiData?.canUseProposals ?? true,
      canApproveRevokeContracts: apiData?.canApproveRevokeContracts ?? true,
      canBuySell: apiData?.canBuySell ?? false,
      canDeposit: apiData?.canManageAssets ?? true, // Map canManageAssets to canDeposit
    };
  };

  return useQuery({
    queryKey: ["agent-permissions", agentAddress], // Stable key for proper caching
    queryFn: fetchPermissions,
    enabled: !!agentAddress,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
