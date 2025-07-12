// hooks/useSdkPoolStatus.ts
import { useQuery } from "@tanstack/react-query";
import { styxSDK } from "@faktoryfun/styx-sdk";

const useSdkPoolStatus = () => {
  return useQuery({
    queryKey: ["poolStatus"],
    queryFn: async () => {
      console.log("Fetching pool status from SDK...");
      const data = await styxSDK.getPoolStatus();
      console.log("Received pool status:", data);
      return data;
    },
    staleTime: 60000, // 1 minute
  });
};

export default useSdkPoolStatus;
