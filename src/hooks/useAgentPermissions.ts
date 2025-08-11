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
      `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${contractAddress}/${contractName}/get-agent-permissions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: contractAddress,
          arguments: [],
          cacheControl: {
            bustCache: true,
            ttl: 0,
          },
        }),
      }
    );

    if (!res.ok) throw new Error("Failed to fetch permissions");

    const data = await res.json();
    return (
      data?.data || {
        canUseProposals: true,
        canApproveRevokeContracts: true,
        canBuySell: false,
        canDeposit: true,
      }
    );
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
