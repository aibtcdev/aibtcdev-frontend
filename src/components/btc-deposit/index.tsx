"use client";

import { useState, useEffect } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/reusables/Loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepositForm from "@/components/btc-deposit/DepositForm";
import TransactionConfirmation from "@/components/btc-deposit/TransactionConfirmation";
import MyHistory from "@/components/btc-deposit/MyHistory";
import { getBitcoinAddress, getStacksAddress } from "@/lib/address";
import { useAuth } from "@/hooks/useAuth";
import AuthButton from "@/components/home/AuthButton";
import { useFormattedBtcPrice } from "@/hooks/deposit/useSdkBtcPrice";
import useSdkPoolStatus from "@/hooks/deposit/useSdkPoolStatus";
import useSdkDepositHistory from "@/hooks/deposit/useSdkDepositHistory";
import useSdkAllDepositsHistory from "@/hooks/deposit/useSdkAllDepositsHistory";
import { useAgentAccount } from "@/hooks/useAgentAccount";
import { ConfirmationData } from "@/components/btc-deposit/DepositForm";

interface BitcoinDepositProps {
  dexId: number;
  dexContract: string;
  daoName: string;
}

export default function BitcoinDeposit({
  dexContract,
  daoName,
  dexId,
}: BitcoinDepositProps) {
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

  // Add state for the missing transaction parameters
  const [minTokenOut] = useState<number>(50); // You can make this dynamic based on user input
  // const [poolId] = useState<string>("aibtc");
  const [swapType] = useState<"sbtc" | "usda" | "pepe" | "aibtc">("aibtc");

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

  // ---------- HOOKS THAT MUST RUN EVERY RENDER ----------
  // Get addresses directly
  const userAddress = getStacksAddress();
  const { userAgentAddress } = useAgentAccount();
  // const userAddress =
  //   "SP16PP6EYRCB7NCTGWAC73DH5X0KXWAPEQ8RKWAKS.no-ai-account-2";
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
  const { refetch: refetchAllDeposits } = useSdkAllDepositsHistory();
  // ------------------------------------------------------

  // Determine if we're still loading critical data
  const isDataLoading =
    isBtcPriceLoading || isPoolStatusLoading || btcUsdPrice === undefined;

  // Render authentication prompt if not connected
  if (!accessToken) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold">
            Deposit {daoName} into your agent account.
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
    <div className="max-w-xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="history">My History</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="bg-card border-border/30 p-4 h-full">
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
                dexContract={dexContract}
                daoName={daoName}
                userAddress={userAddress}
                dexId={dexId}
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
          aiAccountReceiver={userAgentAddress || ""}
          minTokenOut={minTokenOut}
          poolId="aibtc"
          swapType={swapType}
          dexId={dexId}
        />
      )}
    </div>
  );
}
