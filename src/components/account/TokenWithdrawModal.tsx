"use client";

import { useState, useEffect, useMemo } from "react";
import { request } from "@stacks/connect";
import { Pc, Cl } from "@stacks/transactions";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { useBatchContractApprovals } from "@/hooks/useContractApproval";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "@aibtc/types";
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

interface TokenWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentAddress: string;
  tokenData: TokenData | null;
}

export function TokenWithdrawModal({
  isOpen,
  onClose,
  agentAddress,
  tokenData,
}: TokenWithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
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

  // Check if token contract is approved
  const contractIds = useMemo(
    () => (tokenData?.contractPrincipal ? [tokenData.contractPrincipal] : []),
    [tokenData?.contractPrincipal]
  );

  const tokenApprovals = useBatchContractApprovals(
    agentAddress,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
  );

  const isTokenApproved = tokenData
    ? tokenApprovals.data?.[tokenData.contractPrincipal] || false
    : false;

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
      // Clear form and close withdraw modal on success
      setAmount("");
      setIsWithdrawing(false);
      // Keep status modal open to show success
    } else if (transactionStatus === "failed") {
      setIsWithdrawing(false);
      // Keep status modal open to show failure
    }
  }, [transactionStatus]);

  const handleWithdraw = async () => {
    if (!tokenData || !amount || !stacksAddress || !agentAddress) return;
    console.log(agentAddress);
    setIsWithdrawing(true);

    try {
      const amountInMicroTokens = Math.floor(
        parseFloat(amount) * Math.pow(10, tokenData.decimals)
      );

      // Get agent account balance to create post condition
      const agentBalance = balances[agentAddress];
      if (!agentBalance?.fungible_tokens) {
        throw new Error("Agent account balance not available");
      }

      // Find the token in agent's balance
      const tokenKey = Object.keys(agentBalance.fungible_tokens).find((key) =>
        key.startsWith(tokenData.contractPrincipal)
      );

      if (!tokenKey) {
        throw new Error("Token not found in agent account");
      }

      let tokenName = "";
      if (tokenKey && tokenKey.includes("::")) {
        tokenName = tokenKey.split("::")[1];
      }

      // Create post condition to ensure the exact amount is transferred FROM the agent account
      const postCondition = Pc.principal(agentAddress)
        .willSendEq(amountInMicroTokens)
        .ft(tokenData.contractPrincipal as `${string}.${string}`, tokenName);

      const [contractAddress, contractName] =
        tokenData.contractPrincipal.split(".");

      const txResponse = await request("stx_callContract", {
        contract: agentAddress as `${string}.${string}`,
        functionName: "withdraw-ft",
        functionArgs: [
          Cl.contractPrincipal(contractAddress, contractName), // FT contract principal
          Cl.uint(amountInMicroTokens), // amount in base units
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
        postConditions: [postCondition],
        postConditionMode: "deny",
        // onFinish: (data) => {
        //   console.log("Transaction finished:", data);
        // },
        // onCancel: () => {
        //   console.log("Transaction cancelled");
        //   setIsWithdrawing(false);
        // },
      });

      console.log("Token withdrawal initiated successfully", txResponse);

      // Extract transaction ID from response (handle both txId and txid properties)
      const txId = txResponse.txid || null;
      setCurrentTxId(txId);
      setShowStatusModal(true);

      // Start monitoring the transaction
      if (txId) {
        await startMonitoring(txId);
      }
    } catch (error) {
      console.error("Error initiating token withdrawal:", error);
      setIsWithdrawing(false);
    }
  };

  const handleMaxAmount = () => {
    if (tokenData && agentAddress && balances[agentAddress]?.fungible_tokens) {
      const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
        (key) => key.startsWith(tokenData.contractPrincipal)
      );

      if (tokenKey) {
        const tokenBalance =
          balances[agentAddress].fungible_tokens[tokenKey].balance;
        const maxAmount =
          parseFloat(tokenBalance) / Math.pow(10, tokenData.decimals);
        setAmount(maxAmount.toString());
      }
    }
  };

  const isValidAmount = () => {
    if (
      !tokenData ||
      !amount ||
      !agentAddress ||
      !balances[agentAddress]?.fungible_tokens
    ) {
      return false;
    }

    const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
      (key) => key.startsWith(tokenData.contractPrincipal)
    );

    if (!tokenKey) return false;

    const amountNum = parseFloat(amount);
    const tokenBalance =
      balances[agentAddress].fungible_tokens[tokenKey].balance;
    const maxAmount =
      parseFloat(tokenBalance) / Math.pow(10, tokenData.decimals);

    return amountNum > 0 && amountNum <= maxAmount;
  };

  const getAvailableBalance = () => {
    if (
      !tokenData ||
      !agentAddress ||
      !balances[agentAddress]?.fungible_tokens
    ) {
      return "0";
    }

    const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
      (key) => key.startsWith(tokenData.contractPrincipal)
    );

    if (!tokenKey) return "0";

    return balances[agentAddress].fungible_tokens[tokenKey].balance;
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
              Withdraw {tokenData.daoName} from Agent Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Token Info */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {tokenData.daoName}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  Available:{" "}
                  <BalanceDisplay
                    value={getAvailableBalance()}
                    decimals={tokenData.decimals}
                    variant="abbreviated"
                    showSymbol={false}
                    className="inline-block"
                  />
                </span>
              </div>
            </div>

            {/* Token Approval Status */}
            {tokenData && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Token Withdrawal Status
                  </div>
                  <Badge variant={isTokenApproved ? "default" : "secondary"}>
                    {isTokenApproved ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isTokenApproved
                    ? "Token withdrawals are enabled for this contract"
                    : "Token approval required. Enable in the tokens table to withdraw."}
                </div>
              </div>
            )}

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
                    disabled={isWithdrawing}
                  />
                  <Button
                    variant="outline"
                    onClick={handleMaxAmount}
                    size="sm"
                    disabled={isWithdrawing}
                  >
                    MAX
                  </Button>
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div className="text-sm text-muted-foreground mb-1">
                Withdraw to your wallet:
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-mono text-xs">{stacksAddress}</span>
              </div>
            </div>

            {/* Withdraw Button */}
            <Button
              onClick={handleWithdraw}
              disabled={!isValidAmount() || isWithdrawing || !isTokenApproved}
              className="w-full"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Withdrawing...
                </>
              ) : !isTokenApproved ? (
                "Token Approval Required"
              ) : (
                <>
                  Withdraw{" "}
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
        title="Token Withdrawal Status"
        successTitle="Withdrawal Confirmed"
        failureTitle="Withdrawal Failed"
        successDescription={`Your ${tokenData?.daoName} tokens have been successfully withdrawn from the agent account to your wallet.`}
        failureDescription="The token withdrawal could not be completed. Please try again."
        pendingDescription="Your token withdrawal is being processed on the blockchain. This may take a few minutes."
        onRetry={handleRetry}
        showRetryButton={true}
      />
    </>
  );
}
