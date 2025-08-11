// import { useQuery } from "@tanstack/react-query";

// async function fetchApprovals(
//     agentAccountId: string,
//     contractIds: string[],
//     type: "u1" | "u2" | "u3" = "u3"
// ) {
//     const [agentAddr, agentName] = agentAccountId.split(".");
//     if (!agentAddr || !agentName) throw new Error("Invalid agent account id");

//     const results = await Promise.all(
//         contractIds.map(async (targetContractId) => {
//             const res = await fetch(
//                 `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${agentAddr}/${agentName}/is-approved-contract`,
//                 {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                         sender: agentAddr,
//                         arguments: [targetContractId, type],
//                         cacheControl: { bustCache: true },
//                     }),
//                 }
//             );

//             if (!res.ok) return { id: targetContractId, approved: false };

//             const data = await res.json();
//             const result = data?.result ?? data?.data?.result;
//             return {
//                 id: targetContractId,
//                 approved: /\(bool\s+true\)/i.test(result),
//             };
//         })
//     );

//     return Object.fromEntries(results.map((r) => [r.id, r.approved]));
// }

// export function useBatchContractApprovals(
//     agentAccountId: string | null,
//     contractIds: string[],
//     type: "u1" | "u2" | "u3" = "u3"
// ) {
//     return useQuery({
//         queryKey: ["batch-approvals", agentAccountId, contractIds, type],
//         queryFn: () => fetchApprovals(agentAccountId!, contractIds, type),
//         enabled: !!agentAccountId && contractIds.length > 0,
//         staleTime: 0,
//     });
// }
