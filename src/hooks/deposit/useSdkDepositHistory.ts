// hooks/useSdkDepositHistory.ts
import { useQuery } from "@tanstack/react-query";
import { styxSDK } from "@faktoryfun/styx-sdk";

const useSdkDepositHistory = (userAddress: string | null) => {
  return useQuery({
    queryKey: ["depositHistory", userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      console.log("Fetching deposit history for:", userAddress);
      const data = await styxSDK.getDepositHistory(userAddress);
      console.log("Received deposit history:", data);
      return data || [];
    },
    enabled: !!userAddress,
    staleTime: 60000, // 1 minute
  });
};

export default useSdkDepositHistory;
