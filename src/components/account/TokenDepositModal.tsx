"use client";

import { useState, useEffect } from "react";
import { request } from "@stacks/connect";
import { Pc, Cl } from "@stacks/transactions";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { BalanceDisplay } from "@/components/reusables/BalanceDisplay";

interface TokenData {
  tokenId: string;
  tokenSymbol: string;
  daoName: string;
  contractPrincipal: string;
  balance: string;
  decimals: number;
}

interface TokenDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientType: "agent" | "wallet";
  tokenData: TokenData | null;
}

export function TokenDepositModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientType,
  tokenData,
}: TokenDepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { balances } = useWalletStore();
  const {
    transactionMessage,
    transactionStatus,
    startMonitoring,
    stopMonitoring,
    reset: resetVerification,
  } = useTransactionVerification();

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  // Reset amount when modal opens/closes or token changes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setCurrentTxId(null);
      setShowStatusModal(false);
      stopMonitoring();
      resetVerification();
    }
  }, [isOpen, tokenData, stopMonitoring, resetVerification]);

  // Handle transaction status changes
  useEffect(() => {
    if (transactionStatus === "success") {
      // Clear form and close deposit modal on success
      setAmount("");
      setIsTransferring(false);
      // Keep status modal open to show success
    } else if (transactionStatus === "failed") {
      setIsTransferring(false);
      // Keep status modal open to show failure
    }
  }, [transactionStatus]);

  const handleTransfer = async () => {
    if (!tokenData || !amount || !stacksAddress) return;

    setIsTransferring(true);

    try {
      const amountInMicroTokens = Math.floor(
        parseFloat(amount) * Math.pow(10, tokenData.decimals)
      );

      // Create post condition to ensure the exact amount is transferred
      const tokenKey = Object.keys(
        balances[stacksAddress].fungible_tokens
      ).find((key) => key.startsWith(tokenData.contractPrincipal));

      let tokenName = "";
      if (tokenKey && tokenKey.includes("::")) {
        tokenName = tokenKey.split("::")[1];
      }

      const postCondition = Pc.principal(stacksAddress)
        .willSendEq(amountInMicroTokens)
        .ft(tokenData.contractPrincipal as `${string}.${string}`, tokenName);

      const [contractAddress, contractName] =
        tokenData.contractPrincipal.split(".");

      const txResponse = await request("stx_callContract", {
        contract: recipientAddress as `${string}.${string}`,
        functionName: "deposit-ft",
        functionArgs: [
          Cl.contractPrincipal(contractAddress, contractName),
          Cl.uint(amountInMicroTokens), // amount in base units
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
        postConditions: [postCondition],
        postConditionMode: "deny",
      });

      console.log("Token deposit initiated successfully", txResponse);

      // Extract transaction ID from response
      const txId = txResponse.txid || null;
      setCurrentTxId(txId);
      setShowStatusModal(true);

      // Start monitoring the transaction
      if (txId) {
        await startMonitoring(txId);
      }
    } catch (error) {
      console.error("Error initiating token deposit:", error);
      setIsTransferring(false);
    }
  };

  const handleMaxAmount = () => {
    if (tokenData) {
      const maxAmount =
        parseFloat(tokenData.balance) / Math.pow(10, tokenData.decimals);
      setAmount(maxAmount.toString());
    }
  };

  const isValidAmount = () => {
    if (!tokenData || !amount) return false;
    const amountNum = parseFloat(amount);
    const maxAmount =
      parseFloat(tokenData.balance) / Math.pow(10, tokenData.decimals);
    return amountNum > 0 && amountNum <= maxAmount;
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    if (transactionStatus === "success") {
      // Close the main modal on success
      onClose();
    }
  };

  const handleRetry = () => {
    setShowStatusModal(false);
    resetVerification();
    setCurrentTxId(null);
    // Keep the main modal open for retry
  };

  if (!tokenData) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Deposit {tokenData.daoName} to{" "}
              {recipientType === "agent" ? "Agent Account" : "Agent Wallet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Token Info */}
            <div className="bg-muted p-3 rounded-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {tokenData.daoName}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Available:{" "}
                  <BalanceDisplay
                    value={tokenData.balance}
                    decimals={tokenData.decimals}
                    variant="abbreviated"
                    showSymbol={false}
                    className="inline-block"
                  />
                </span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="any"
                    min="0"
                    max={
                      parseFloat(tokenData.balance) /
                      Math.pow(10, tokenData.decimals)
                    }
                    disabled={isTransferring}
                  />
                  <Button
                    variant="outline"
                    onClick={handleMaxAmount}
                    size="sm"
                    disabled={isTransferring}
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-muted p-3 rounded-sm space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-mono text-xs">{recipientAddress}</span>
              </div>
            </div>

            {/* Transfer Button */}
            <Button
              onClick={handleTransfer}
              disabled={!isValidAmount() || isTransferring}
              className="w-full"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                <>
                  Deposit{" "}
                  <BalanceDisplay
                    value={
                      parseFloat(amount || "0") *
                      Math.pow(10, tokenData.decimals)
                    }
                    symbol={tokenData.tokenSymbol}
                    decimals={tokenData.decimals}
                    variant="abbreviated"
                    showSymbol={true}
                    className="inline-block font-bold"
                  />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={showStatusModal}
        onClose={handleStatusModalClose}
        txId={currentTxId || undefined}
        transactionStatus={transactionStatus}
        transactionMessage={transactionMessage}
        title="Token Deposit Status"
        successTitle="Deposit Confirmed"
        failureTitle="Deposit Failed"
        successDescription={`Your ${tokenData?.daoName} tokens have been successfully deposited to the ${recipientType === "agent" ? "agent account" : "agent wallet"}.`}
        failureDescription="The token deposit could not be completed. Please try again."
        pendingDescription="Your token deposit is being processed on the blockchain. This may take a few minutes."
        onRetry={handleRetry}
        showRetryButton={true}
      />
    </>
  );
}
