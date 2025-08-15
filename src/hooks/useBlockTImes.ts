import { useQuery } from "@tanstack/react-query";

interface BlockTimesResponse {
  startBlockTime: string | null;
  endBlockTime: string | null;
}

export function useBlockTimes(startBlock: number, endBlock: number) {
  return useQuery<BlockTimesResponse>({
    queryKey: ["blockTimes", startBlock, endBlock],
    queryFn: async () => {
      const response = await fetch(
        `/block-times?startBlock=${startBlock}&endBlock=${endBlock}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch block times");
      }

      return response.json();
    },
    enabled: startBlock > 0 && endBlock > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}
