// hooks/useSdkAllDepositsHistory.ts
import { useQuery } from "@tanstack/react-query";
import { styxSDK } from "@faktoryfun/styx-sdk";

const useSdkAllDepositsHistory = () => {
  return useQuery({
    queryKey: ["allDepositsHistory"],
    queryFn: async () => {
      console.log("Fetching all deposits history...");
      const data = await styxSDK.getAllDepositsHistory();
      console.log("Received all deposits history:", data);
      return data || [];
    },
    staleTime: 60000, // 1 minute
  });
};

export default useSdkAllDepositsHistory;
