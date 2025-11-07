"use client";

import { useState, useEffect } from "react";
import { TransactionPriority } from "@faktoryfun/styx-sdk";
import { Loader } from "@/components/reusables/Loader";
import DepositForm from "@/components/btc-deposit/DepositForm";
import TransactionConfirmation from "@/components/btc-deposit/TransactionConfirmation";
import { getBitcoinAddress, getStacksAddress } from "@/lib/address";
import { useAuth } from "@/hooks/useAuth";
// import AuthButton from "@/components/home/AuthButton";
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
  tokenContract: string;
  headerOffset?: number;
  isMarketOpen?: boolean | null;
  prelaunchContract?: string;
  poolContract?: string;
  adapterContract?: string;
  isBonded?: boolean | null;
  bitflowAdapter?: string;
  bitflowPool?: string;
}

export default function BitcoinDeposit({
  dexContract,
  daoName,
  dexId,
  tokenContract,
  isMarketOpen,
  prelaunchContract,
  poolContract,
  adapterContract,
  isBonded,
  bitflowAdapter,
  bitflowPool,
  // headerOffset = 96,
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
  const { refetch: refetchDepositHistory } = useSdkDepositHistory(userAddress);

  // All network deposits - using the provided hook
  const { refetch: refetchAllDeposits } = useSdkAllDepositsHistory();
  // ------------------------------------------------------

  // Determine if we're still loading critical data
  const isDataLoading =
    isBtcPriceLoading || isPoolStatusLoading || btcUsdPrice === undefined;

  // Render authentication prompt if not connected
  // if (!accessToken) {
  //   return (
  //     <div className="max-w-xl mx-auto">
  //       <div className="mb-6 text-center">
  //         <h2 className="text-xl font-semibold">
  //           Deposit {daoName} into your agent account.
  //         </h2>
  //         <p className="text-sm text-muted-foreground">
  //           Fast, secure, and trustless
  //         </p>
  //       </div>

  //       <Card className="p-8 flex flex-col items-center justify-center space-y-6">
  //         <p className="text-center">
  //           Please connect your wallet to access the deposit feature
  //         </p>
  //         <AuthButton redirectUrl="/deposit" />
  //       </Card>
  //     </div>
  //   );
  // }

  return (
    <div className="rounded-sm bg-muted/10 p-4 sm:p-5 lg:p-6 flex flex-col lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto min-h-0">
        {isDataLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader />
            <p className="text-sm text-zinc-400">Loading deposit data...</p>
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
            setConfirmationData={(data) => {
              setConfirmationData(data);
              setShowConfirmation(true);
            }}
            setShowConfirmation={setShowConfirmation}
            activeWalletProvider={activeWalletProvider}
            dexContract={dexContract}
            daoName={daoName}
            userAddress={userAddress}
            dexId={dexId}
            tokenContract={tokenContract}
            swapType="aibtc"
            poolId="aibtc"
            aiAccountReceiver={userAgentAddress || ""}
            isMarketOpen={isMarketOpen}
            prelaunchContract={prelaunchContract}
            poolContract={poolContract}
            adapterContract={adapterContract}
            isBonded={isBonded}
            bitflowAdapter={bitflowAdapter}
            bitflowPool={bitflowPool}
          />
        )}
      </div>

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
          aiAccountReceiver={userAgentAddress || ""}
          poolId="aibtc"
          swapType={swapType}
          dexId={dexId}
          dexContract={dexContract}
        />
      )}
    </div>
  );
}
