import { fetchLatestChainState } from "@/services/chain-state.service";
import { useQuery } from "@tanstack/react-query";

// Custom hook to get the latest Bitcoin block height
export function useBitcoinBlockHeight() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const blockHeight = data?.bitcoin_block_height
    ? Number.parseInt(data.bitcoin_block_height)
    : 0;

  return {
    blockHeight,
    isLoading,
    isError,
  };
}
