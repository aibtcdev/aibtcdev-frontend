// hooks/useResolveBnsOrAddress.ts
import { useQuery } from "@tanstack/react-query";

// In a real application, this would call an API to resolve BNS names
const useResolveBnsOrAddress = (address: string) => {
  return useQuery({
    queryKey: ["resolveAddress", address],
    queryFn: async () => {
      // Mock implementation
      return {
        resolvedValue: address.startsWith("SP") ? address : null,
      };
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export default useResolveBnsOrAddress;
