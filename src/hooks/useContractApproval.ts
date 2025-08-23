import { useQuery } from "@tanstack/react-query";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "@aibtc/types";

async function fetchApprovals(
  agentAccountId: string,
  contractIds: string[],
  type: (typeof AGENT_ACCOUNT_APPROVAL_TYPES)[keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES] = AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
  bustCache: boolean = false
) {
  const [agentAddr, agentName] = agentAccountId.split(".");
  if (!agentAddr || !agentName) throw new Error("Invalid agent account id");

  const results = await Promise.all(
    contractIds.map(async (targetContractId) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${agentAddr}/${agentName}/is-approved-contract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            functionArgs: [
              {
                type: "principal",
                value: targetContractId,
              },
              {
                type: "uint",
                value: type.toString(),
              },
            ],
            senderAddress: agentAddr,
            network: process.env.NEXT_PUBLIC_STACKS_NETWORK,
            cacheControl: { bustCache }, // Add cache busting here
          }),
        }
      );

      if (!res.ok) return { id: targetContractId, approved: false };

      const data = await res.json();
      const result = data?.success ? data?.data : false;
      return {
        id: targetContractId,
        approved: result === true,
      };
    })
  );

  return Object.fromEntries(results.map((r) => [r.id, r.approved]));
}

export function useBatchContractApprovals(
  agentAccountId: string | null,
  contractIds: string[],
  type: (typeof AGENT_ACCOUNT_APPROVAL_TYPES)[keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES] = AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
) {
  return useQuery({
    queryKey: ["batch-approvals", agentAccountId, contractIds, type],
    queryFn: () => fetchApprovals(agentAccountId!, contractIds, type, true), // Always bust cache on refetch
    enabled: !!agentAccountId && contractIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000, // Cache the results for 5 minutes
  });
}
