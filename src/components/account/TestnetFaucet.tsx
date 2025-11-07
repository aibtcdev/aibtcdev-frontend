"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { request } from "@stacks/connect";
import { useAuth } from "@/hooks/useAuth";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";

interface TestnetFaucetProps {
  fetchWallets?: () => Promise<void>;
}

export function TestnetFaucet({ fetchWallets }: TestnetFaucetProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | undefined>();

  const {
    transactionStatus,
    transactionMessage,
    startMonitoring,
    stopMonitoring,
    reset,
  } = useTransactionVerification();

  const handleRequestSBTC = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSBTC(true);
    reset(); // Reset transaction verification state

    try {
      const txResponse = await request("stx_callContract", {
        contract:
          "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token" as `${string}.${string}`,
        functionName: "faucet",
        functionArgs: [],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
      });

      console.log("sBTC faucet transaction initiated successfully", txResponse);

      // Extract transaction ID from response
      const txId = txResponse.txid || null;
      if (txId) {
        setCurrentTxId(txId);
        setShowStatusModal(true);

        // Start monitoring the transaction
        await startMonitoring(txId);

        toast({
          title: "Transaction Submitted",
          description: "sBTC faucet transaction submitted and being monitored",
          variant: "default",
        });
      } else {
        throw new Error("No transaction ID received");
      }
    } catch (error) {
      console.error("Failed to request testnet sBTC:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet sBTC from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSBTC(false);
    }
  };

  const handleCloseModal = () => {
    setShowStatusModal(false);
    stopMonitoring();

    // If transaction was successful, refresh wallets
    if (transactionStatus === "success" && fetchWallets) {
      fetchWallets();
    }
  };

  const handleRetry = () => {
    setShowStatusModal(false);
    handleRequestSBTC();
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-accent" />
          </div>
          Testnet Faucet
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get free testnet tokens for development and testing purposes.
          </p>
          <button
            onClick={handleRequestSBTC}
            disabled={isRequestingSBTC || !isAuthenticated}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20 rounded-sm hover:bg-secondary/20 hover:scale-105 focus:ring-2 ring-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 motion-reduce:transition-none"
          >
            {isRequestingSBTC ? (
              <>
                <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-sm animate-spin" />
                Requesting...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                Request Testnet sBTC
              </>
            )}
          </button>
          <div className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-sm">
            <p className="font-medium mb-1">Note:</p>
            <p>
              Calls the testnet sBTC contract faucet function directly. Testnet
              tokens have no real value and are for development purposes only.
            </p>
          </div>
        </div>
      </CardContent>

      <TransactionStatusModal
        isOpen={showStatusModal}
        onClose={handleCloseModal}
        txId={currentTxId}
        transactionStatus={transactionStatus}
        transactionMessage={transactionMessage}
        title="sBTC Faucet Transaction"
        successTitle="sBTC Received!"
        failureTitle="Faucet Request Failed"
        successDescription="Your testnet sBTC has been successfully received from the faucet."
        failureDescription="The sBTC faucet request could not be completed. Please try again."
        pendingDescription="Your sBTC faucet request is being processed on the blockchain. This may take a few minutes."
        onRetry={handleRetry}
        showRetryButton={true}
      />
    </Card>
  );
}
