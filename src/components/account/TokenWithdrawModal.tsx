"use client";

import { useState, useEffect } from "react";
import { request } from "@stacks/connect";
import { uintCV, principalCV, noneCV, Pc, Cl } from "@stacks/transactions";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { useBatchContractApprovals } from "@/hooks/useContractApproval";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
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
import { Loader2, RotateCcw } from "lucide-react";

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

function formatBalance(value: string | number, decimals: number = 8) {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  num = num / Math.pow(10, decimals);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
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
  const [updatingApproval, setUpdatingApproval] = useState(false);
  const [currentApprovalTxId, setCurrentApprovalTxId] = useState<string | null>(
    null
  );
  const [showApprovalStatusModal, setShowApprovalStatusModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);

  const { balances } = useWalletStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    transactionMessage,
    transactionStatus,
    startMonitoring,
    stopMonitoring,
    reset: resetVerification,
  } = useTransactionVerification();

  // Separate transaction verification for approval operations
  const {
    transactionMessage: approvalTransactionMessage,
    transactionStatus: approvalTransactionStatus,
    startMonitoring: startApprovalMonitoring,
    stopMonitoring: stopApprovalMonitoring,
    reset: resetApprovalVerification,
  } = useTransactionVerification();

  // Check if token contract is approved
  const contractIds = tokenData?.contractPrincipal
    ? [tokenData.contractPrincipal]
    : [];

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
      setCurrentApprovalTxId(null);
      setShowApprovalStatusModal(false);
      stopMonitoring();
      stopApprovalMonitoring();
      resetVerification();
      resetApprovalVerification();
    }
  }, [
    isOpen,
    tokenData,
    stopMonitoring,
    stopApprovalMonitoring,
    resetVerification,
    resetApprovalVerification,
  ]);

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

  // Handle approval transaction status changes
  useEffect(() => {
    if (approvalTransactionStatus === "success") {
      setUpdatingApproval(false);
      // Refresh approval data after successful approval/revoke
      queryClient.invalidateQueries({
        queryKey: [
          "batch-approvals",
          agentAddress,
          contractIds,
          AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
        ],
      });
    } else if (approvalTransactionStatus === "failed") {
      setUpdatingApproval(false);
    }
  }, [approvalTransactionStatus, queryClient, agentAddress, contractIds]);

  // Approval toggle mutation
  const updateApprovalMutation = useMutation({
    mutationFn: async ({ enabled }: { enabled: boolean }) => {
      if (!tokenData || !agentAddress) throw new Error("Missing data");
      setUpdatingApproval(true);
      setApprovalAction(enabled ? "approve" : "revoke");

      const functionName = enabled ? "approve-contract" : "revoke-contract";

      const response = await request("stx_callContract", {
        contract: agentAddress as `${string}.${string}`,
        functionName,
        functionArgs: [
          Cl.principal(tokenData.contractPrincipal),
          Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN), // Use numeric value directly
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
      });

      return { txid: response.txid, enabled };
    },
    onSuccess: async (data) => {
      setUpdatingApproval(false);
      await queryClient.invalidateQueries({
        queryKey: [
          "batch-approvals",
          agentAddress,
          [tokenData?.contractPrincipal],
          AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
        ],
      });
      toast({
        title: "Transaction Submitted",
        description: `Contract ${data.enabled ? "approval" : "revocation"} submitted. TXID: ${data.txid}`,
      });

      if (data.txid) {
        setCurrentApprovalTxId(data.txid);
        setShowApprovalStatusModal(true);
        startApprovalMonitoring(data.txid);
      }
    },
    onError: (error) => {
      setUpdatingApproval(false);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

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

    const tokenBalance =
      balances[agentAddress].fungible_tokens[tokenKey].balance;
    return formatBalance(tokenBalance, tokenData.decimals);
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

  const handleApprovalStatusModalClose = () => {
    setShowApprovalStatusModal(false);
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
                  Available: {getAvailableBalance()}
                </span>
              </div>
            </div>

            {/* Token Approval Section */}
            {tokenData && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Token Contract Approval
                  </div>
                  <div className="flex items-center space-x-2">
                    {tokenApprovals.isLoading || updatingApproval ? (
                      <RotateCcw className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <button
                        onClick={() =>
                          updateApprovalMutation.mutate({
                            enabled: !isTokenApproved,
                          })
                        }
                        disabled={updatingApproval}
                        className={`
                          relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer
                          ${isTokenApproved ? "bg-primary" : "bg-muted"}
                          ${updatingApproval ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                            ${isTokenApproved ? "translate-x-3.5" : "translate-x-0.5"}
                          `}
                        />
                      </button>
                    )}
                    <Badge variant={isTokenApproved ? "default" : "secondary"}>
                      {isTokenApproved ? "Approved" : "Not Approved"}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {isTokenApproved
                    ? "Token contract is approved for withdrawals"
                    : "Approve token contract to enable withdrawals"}
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
                "Approve Contract First"
              ) : (
                `Withdraw ${amount || "0"} ${tokenData.tokenSymbol}`
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

      {/* Approval Status Modal */}
      <TransactionStatusModal
        isOpen={showApprovalStatusModal}
        onClose={handleApprovalStatusModalClose}
        txId={currentApprovalTxId || undefined}
        transactionStatus={approvalTransactionStatus}
        transactionMessage={approvalTransactionMessage}
        title={`Token Contract ${approvalAction === "approve" ? "Approval" : "Revocation"} Status`}
        successTitle={`${approvalAction === "approve" ? "Approval" : "Revocation"} Confirmed`}
        failureTitle={`${approvalAction === "approve" ? "Approval" : "Revocation"} Failed`}
        successDescription={`The token contract has been successfully ${approvalAction}d for withdrawals.`}
        failureDescription={`The token contract ${approvalAction} could not be completed. Please try again.`}
        pendingDescription={`The token contract ${approvalAction} is being processed on the blockchain. This may take a few minutes.`}
        onRetry={() => {
          setShowApprovalStatusModal(false);
          resetApprovalVerification();
          setCurrentApprovalTxId(null);
        }}
        showRetryButton={true}
      />
    </>
  );
}
