// hooks/useSdkBtcPrice.ts
import { useQuery } from "@tanstack/react-query";
import { styxSDK } from "@faktoryfun/styx-sdk";

export const useSdkBtcPrice = () => {
  return useQuery({
    queryKey: ["btcPrice"],
    queryFn: async () => {
      console.log("Fetching BTC price from SDK...");
      const price = await styxSDK.getBTCPrice();
      console.log("Received BTC price:", price);
      return price;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFormattedBtcPrice = () => {
  const query = useSdkBtcPrice();
  return {
    price: query.data,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export default useSdkBtcPrice;
