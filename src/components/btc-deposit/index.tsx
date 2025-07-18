"use client";

import { useState, useEffect } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/reusables/Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepositForm from "@/components/btc-deposit/DepositForm";
import TransactionConfirmation from "@/components/btc-deposit/TransactionConfirmation";
import MyHistory from "@/components/btc-deposit/MyHistory";
import AllDeposits from "@/components/btc-deposit/AllDeposits";
import { getBitcoinAddress } from "@/lib/address";
import { useAuth } from "@/hooks/useAuth";
import AuthButton from "@/components/home/AuthButton";
import { useFormattedBtcPrice } from "@/hooks/deposit/useSdkBtcPrice";
import useSdkPoolStatus from "@/hooks/deposit/useSdkPoolStatus";
import useSdkDepositHistory from "@/hooks/deposit/useSdkDepositHistory";
import useSdkAllDepositsHistory from "@/hooks/deposit/useSdkAllDepositsHistory";
import { useAgentAccount } from "@/hooks/useAgentAccount";
import { fetchDAOByNameWithExtensions } from "@/services/dao.service";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/useToast";

// Define the ConfirmationData type
export type ConfirmationData = {
  depositAmount: string;
  depositAddress: string;
  stxAddress: string;
  opReturnHex: string;
  isBlaze?: boolean;
};

export default function BitcoinDeposit() {
  // Get session state from Zustand store
  const { accessToken } = useAuth();

  // State management
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [feePriority, setFeePriority] = useState<TransactionPriority>(
    TransactionPriority.Medium
  );
  const [activeWalletProvider, setActiveWalletProvider] = useState<
    "leather" | "xverse" | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("deposit");
  const [isRefetching, setIsRefetching] = useState(false);
  console.log(activeWalletProvider);
  // Add this useEffect hook after the state declarations
  useEffect(() => {
    if (accessToken) {
      const storedProvider = localStorage.getItem("STX_PROVIDER");
      const detectedWalletProvider: "xverse" | "leather" | null =
        storedProvider === "XverseProviders.BitcoinProvider"
          ? "xverse"
          : storedProvider === "LeatherProvider"
            ? "leather"
            : null;
      if (detectedWalletProvider !== activeWalletProvider) {
        setActiveWalletProvider(detectedWalletProvider);
      }
    }
  }, [accessToken, activeWalletProvider]);

  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", "FAST11"],
    queryFn: () => fetchDAOByNameWithExtensions("FAST11"),
    enabled: true,
  });

  // ---------- HOOKS THAT MUST RUN EVERY RENDER ----------
  // Get addresses directly
  const { userAgentAddress: userAddress } = useAgentAccount();
  const btcAddress = accessToken ? getBitcoinAddress() : null;

  // Data fetching hooks
  const {
    price: btcUsdPrice,
    isLoading: isBtcPriceLoading,
    error: btcPriceError,
  } = useFormattedBtcPrice();
  const { data: poolStatus, isLoading: isPoolStatusLoading } =
    useSdkPoolStatus();

  // User's deposit history
  const {
    data: depositHistory,
    isLoading: isHistoryLoading,
    isRefetching: isHistoryRefetching,
    refetch: refetchDepositHistory,
  } = useSdkDepositHistory(userAddress);

  // All network deposits - using the provided hook
  const {
    data: allDepositsHistory,
    isLoading: isAllDepositsLoading,
    isRefetching: isAllDepositsRefetching,
    refetch: refetchAllDeposits,
  } = useSdkAllDepositsHistory();
  // ------------------------------------------------------

  if (isLoadingDAO) {
    toast({
      title: "Loading DAO info",
      description: "Please wait a moment and try again.",
    });
    return;
  }
  const dexExtension = dao?.extensions?.find((ext) => ext.type === "TOKEN");
  if (!dexExtension?.contract_principal) {
    toast({
      title: "DEX Extension Missing",
      description: "Cannot find DEX extension for your DAO.",
      variant: "destructive",
    });
    return;
  }

  // Determine if we're still loading critical data
  const isDataLoading =
    isBtcPriceLoading || isPoolStatusLoading || btcUsdPrice === undefined;

  // Render authentication prompt if not connected
  if (!accessToken) {
    return (
      <div className="max-w-xl mx-auto mt-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold">
            Deposit fast11 into your agent account.
          </h2>
          <p className="text-sm text-muted-foreground">
            Fast, secure, and trustless
          </p>
        </div>

        <Card className="p-8 flex flex-col items-center justify-center space-y-6">
          <p className="text-center">
            Please connect your wallet to access the deposit feature
          </p>
          <AuthButton redirectUrl="/deposit" />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="mb-6 text-center">
        {btcUsdPrice && (
          <p className="text-xs text-muted-foreground mt-1">
            Current BTC price: ${btcUsdPrice.toLocaleString()}
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
          <TabsTrigger value="all">All Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="bg-card border-border/30 p-4">
            {isDataLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader />
                <p className="text-sm text-muted-foreground">
                  Loading deposit data...
                </p>
              </div>
            ) : btcPriceError ? (
              <div className="p-4 text-center">
                <p className="text-red-500">
                  Error loading BTC price data. Please try again later.
                </p>
              </div>
            ) : (
              <DepositForm
                btcUsdPrice={btcUsdPrice ?? null}
                poolStatus={poolStatus ?? null}
                setConfirmationData={setConfirmationData}
                setShowConfirmation={setShowConfirmation}
                activeWalletProvider={activeWalletProvider}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <MyHistory
            depositHistory={depositHistory}
            isLoading={isHistoryLoading || isRefetching}
            btcUsdPrice={btcUsdPrice}
            isRefetching={isHistoryRefetching || isRefetching}
          />
        </TabsContent>

        <TabsContent value="all">
          <AllDeposits
            allDepositsHistory={
              allDepositsHistory
                ? {
                    aggregateData: {
                      ...allDepositsHistory.aggregateData,
                      totalVolume:
                        allDepositsHistory.aggregateData.totalVolume.toString(),
                    },
                    recentDeposits: allDepositsHistory.recentDeposits,
                  }
                : undefined
            }
            isLoading={isAllDepositsLoading || isRefetching}
            btcUsdPrice={btcUsdPrice}
            isRefetching={isAllDepositsRefetching || isRefetching}
          />
        </TabsContent>
      </Tabs>

      {showConfirmation && confirmationData && (
        <TransactionConfirmation
          confirmationData={confirmationData}
          open={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          feePriority={feePriority}
          setFeePriority={setFeePriority}
          userAddress={userAddress || ""}
          btcAddress={btcAddress || ""}
          activeWalletProvider={activeWalletProvider}
          refetchDepositHistory={refetchDepositHistory}
          refetchAllDeposits={refetchAllDeposits}
          setIsRefetching={setIsRefetching}
          dexContract={dexExtension.contract_principal}
        />
      )}
    </div>
  );
}
