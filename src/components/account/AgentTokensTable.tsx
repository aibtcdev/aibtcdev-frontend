"use client";

import { useState, useMemo } from "react";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TokenDepositModal } from "@/components/account/TokenDepositModal";
import { TokenWithdrawModal } from "@/components/account/TokenWithdrawModal";
import { WalletBalance } from "@/store/wallet";
import { useBatchContractApprovals } from "@/hooks/useContractApproval";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "@aibtc/types";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface TokenData {
  tokenId: string;
  tokenSymbol: string;
  daoName: string;
  contractPrincipal: string;
  balance: string;
  decimals: number;
}

interface DAOExtension {
  type: string;
  subtype: string;
  contract_principal?: string;
}

interface DAO {
  id: string;
  name: string;
  extensions?: DAOExtension[];
}

interface AgentTokensTableProps {
  daos: DAO[];
  agentAddress: string;
  agentAccountBalance: WalletBalance | null;
  connectedWalletBalance: WalletBalance | null;
  userAgentWalletAddress?: string | null;
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

export function AgentTokensTable({
  daos,
  agentAddress,
  agentAccountBalance,
  connectedWalletBalance,
}: AgentTokensTableProps) {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [depositRecipient, setDepositRecipient] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"agent" | "wallet" | null>(
    null
  );
  const [updatingApproval, setUpdatingApproval] = useState(false);
  const [currentApprovalTxId, setCurrentApprovalTxId] = useState<string | null>(
    null
  );
  const [showApprovalStatusModal, setShowApprovalStatusModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    transactionMessage: approvalTransactionMessage,
    transactionStatus: approvalTransactionStatus,
    startMonitoring: startApprovalMonitoring,
    // stopMonitoring: stopApprovalMonitoring,
    reset: resetApprovalVerification,
  } = useTransactionVerification();

  // Get contract principals for token and swap approvals
  const tokenContractIds = useMemo(() => {
    return daos
      .map(
        (dao) =>
          dao.extensions?.find(
            (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
          )?.contract_principal
      )
      .filter(Boolean) as string[];
  }, [daos]);

  // Get contract principals for voting approvals (EXTENSIONS type with ACTION_PROPOSAL_VOTING subtype)
  const votingContractIds = useMemo(() => {
    return daos
      .map(
        (dao) =>
          dao.extensions?.find(
            (ext) =>
              ext.type === "EXTENSIONS" &&
              ext.subtype === "ACTION_PROPOSAL_VOTING"
          )?.contract_principal
      )
      .filter(Boolean) as string[];
  }, [daos]);

  // Fetch approvals for all types
  const tokenApprovals = useBatchContractApprovals(
    agentAddress,
    tokenContractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
  );

  const swapApprovals = useBatchContractApprovals(
    agentAddress,
    tokenContractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.SWAP
  );

  const votingApprovals = useBatchContractApprovals(
    agentAddress,
    votingContractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.VOTING
  );

  // Approval toggle mutation
  const updateApprovalMutation = useMutation({
    mutationFn: async ({
      enabled,
      type,
      contractPrincipal,
    }: {
      enabled: boolean;
      type: keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES;
      contractPrincipal: string;
    }) => {
      if (!agentAddress) throw new Error("Missing agent address");
      setUpdatingApproval(true);
      setApprovalAction(enabled ? "approve" : "revoke");

      const functionName = enabled ? "approve-contract" : "revoke-contract";

      const response = await request("stx_callContract", {
        contract: agentAddress as `${string}.${string}`,
        functionName,
        functionArgs: [
          Cl.principal(contractPrincipal),
          Cl.uint(AGENT_ACCOUNT_APPROVAL_TYPES[type]),
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
      });

      return { txid: response.txid, enabled, type, contractPrincipal };
    },
    onSuccess: async (data) => {
      setUpdatingApproval(false);
      // Invalidate queries for all approval types
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "batch-approvals",
            agentAddress,
            tokenContractIds,
            AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "batch-approvals",
            agentAddress,
            tokenContractIds,
            AGENT_ACCOUNT_APPROVAL_TYPES.SWAP,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "batch-approvals",
            agentAddress,
            votingContractIds,
            AGENT_ACCOUNT_APPROVAL_TYPES.VOTING,
          ],
        }),
      ]);
      toast({
        title: "Transaction Submitted",
        description: `${data.type} contract ${data.enabled ? "approval" : "revocation"} submitted. TXID: ${data.txid}`,
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

  // Get all DAO tokens and their balances
  const getTokensData = () => {
    const tokensData: Array<{
      dao: DAO;
      tokenExtension: DAOExtension;
      agentBalance: string;
      userBalance: string;
      tokenData: TokenData;
    }> = [];

    daos.forEach((dao) => {
      const tokenExtension = dao.extensions?.find(
        (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
      );

      if (tokenExtension?.contract_principal) {
        // Get agent balance
        let agentBalance = "0";
        if (agentAccountBalance?.fungible_tokens) {
          const agentTokenEntry = Object.entries(
            agentAccountBalance.fungible_tokens
          ).find(([tokenId]) =>
            tokenId.startsWith(tokenExtension.contract_principal!)
          );
          agentBalance = agentTokenEntry?.[1]?.balance || "0";
        }

        // Get user balance
        let userBalance = "0";
        if (connectedWalletBalance?.fungible_tokens) {
          const userTokenEntry = Object.entries(
            connectedWalletBalance.fungible_tokens
          ).find(([tokenId]) =>
            tokenId.startsWith(tokenExtension.contract_principal!)
          );
          userBalance = userTokenEntry?.[1]?.balance || "0";
        }

        // Create token data
        const tokenId = `${tokenExtension.contract_principal}::${dao.name.toLowerCase()}`;
        const tokenData: TokenData = {
          tokenId,
          tokenSymbol: dao.name,
          daoName: dao.name,
          contractPrincipal: tokenExtension.contract_principal,
          balance: userBalance, // For deposits, we use user balance
          decimals: 8,
        };

        tokensData.push({
          dao,
          tokenExtension,
          agentBalance,
          userBalance,
          tokenData,
        });
      }
    });

    return tokensData;
  };

  const handleDeposit = (
    tokenData: TokenData,
    recipient: string,
    type: "agent" | "wallet"
  ) => {
    setSelectedToken(tokenData);
    setDepositRecipient(recipient);
    setDepositType(type);
    setDepositModalOpen(true);
  };

  const handleWithdraw = (tokenData: TokenData, agentBalance: string) => {
    // Create token data with agent balance for withdrawal
    const withdrawTokenData = {
      ...tokenData,
      balance: agentBalance,
    };
    setSelectedToken(withdrawTokenData);
    setWithdrawModalOpen(true);
  };

  const tokensData = getTokensData();

  if (tokensData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No DAO tokens found</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-4">
        {tokensData.map(({ dao, agentBalance, userBalance, tokenData }) => {
          const hasAgentBalance = parseFloat(agentBalance) > 0;
          const hasUserBalance = parseFloat(userBalance) > 0;
          const contractPrincipal = tokenData.contractPrincipal;

          // Get voting contract principal (different from token contract)
          const votingContractPrincipal = dao.extensions?.find(
            (ext) =>
              ext.type === "EXTENSIONS" &&
              ext.subtype === "ACTION_PROPOSAL_VOTING"
          )?.contract_principal;

          // Get approval statuses
          const isTokenApproved =
            tokenApprovals.data?.[contractPrincipal] || false;
          const isSwapApproved =
            swapApprovals.data?.[contractPrincipal] || false;
          const isVotingApproved = votingContractPrincipal
            ? votingApprovals.data?.[votingContractPrincipal] || false
            : false;

          return (
            <div
              key={dao.id}
              className="rounded-lg border bg-card p-4 space-y-3"
            >
              {/* Token Header */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {dao.name}
                </Badge>
                <span className="font-mono text-sm font-medium">
                  {formatBalance(agentBalance, 8)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleDeposit(tokenData, agentAddress, "agent")
                  }
                  disabled={!hasUserBalance}
                  className="flex-1 text-xs"
                >
                  Deposit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWithdraw(tokenData, agentBalance)}
                  disabled={!hasAgentBalance || !isTokenApproved}
                  className="flex-1 text-xs"
                >
                  Withdraw
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center">Token</TableHead>
              <TableHead className="text-center">Swap</TableHead>
              <TableHead className="text-center">Voting</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokensData.map(({ dao, agentBalance, userBalance, tokenData }) => {
              const hasAgentBalance = parseFloat(agentBalance) > 0;
              const hasUserBalance = parseFloat(userBalance) > 0;
              const contractPrincipal = tokenData.contractPrincipal;

              // Get voting contract principal (different from token contract)
              const votingContractPrincipal = dao.extensions?.find(
                (ext) =>
                  ext.type === "EXTENSIONS" &&
                  ext.subtype === "ACTION_PROPOSAL_VOTING"
              )?.contract_principal;

              // Get approval statuses
              const isTokenApproved =
                tokenApprovals.data?.[contractPrincipal] || false;
              const isSwapApproved =
                swapApprovals.data?.[contractPrincipal] || false;
              const isVotingApproved = votingContractPrincipal
                ? votingApprovals.data?.[votingContractPrincipal] || false
                : false;

              // Get loading states
              const isTokenLoading = tokenApprovals.isLoading;
              const isSwapLoading = swapApprovals.isLoading;
              const isVotingLoading = votingApprovals.isLoading;

              const ApprovalToggle = ({
                type,
                isApproved,
                isLoading,
                targetContractPrincipal,
              }: {
                type: keyof typeof AGENT_ACCOUNT_APPROVAL_TYPES;
                isApproved: boolean;
                isLoading: boolean;
                targetContractPrincipal?: string;
              }) => {
                // Don't show toggle if no contract principal available (e.g., voting extension not found)
                if (!targetContractPrincipal) {
                  return (
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">N/A</span>
                    </div>
                  );
                }

                return (
                  <div className="flex items-center justify-center">
                    {isLoading || updatingApproval ? (
                      <RotateCcw className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <button
                        onClick={() =>
                          updateApprovalMutation.mutate({
                            enabled: !isApproved,
                            type,
                            contractPrincipal: targetContractPrincipal,
                          })
                        }
                        disabled={updatingApproval}
                        className={`
                          flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors
                          ${
                            isApproved
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                          }
                          ${updatingApproval ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}
                        `}
                      >
                        {isApproved ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{isApproved ? "On" : "Off"}</span>
                      </button>
                    )}
                  </div>
                );
              };

              return (
                <TableRow key={dao.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {dao.name}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatBalance(agentBalance, 8)}
                  </TableCell>
                  <TableCell>
                    <ApprovalToggle
                      type="TOKEN"
                      isApproved={isTokenApproved}
                      isLoading={isTokenLoading}
                      targetContractPrincipal={contractPrincipal}
                    />
                  </TableCell>
                  <TableCell>
                    <ApprovalToggle
                      type="SWAP"
                      isApproved={isSwapApproved}
                      isLoading={isSwapLoading}
                      targetContractPrincipal={contractPrincipal}
                    />
                  </TableCell>
                  <TableCell>
                    <ApprovalToggle
                      type="VOTING"
                      isApproved={isVotingApproved}
                      isLoading={isVotingLoading}
                      targetContractPrincipal={votingContractPrincipal}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-2">
                      {/* Deposit to Agent Account */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDeposit(tokenData, agentAddress, "agent")
                        }
                        disabled={!hasUserBalance}
                        className="text-xs"
                      >
                        Deposit
                      </Button>

                      {/* Withdraw from Agent Account */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(tokenData, agentBalance)}
                        disabled={!hasAgentBalance || !isTokenApproved}
                        className="text-xs"
                      >
                        Withdraw
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Deposit Modal */}
      {depositRecipient && depositType && selectedToken && (
        <TokenDepositModal
          isOpen={depositModalOpen}
          onClose={() => {
            setDepositModalOpen(false);
            setSelectedToken(null);
            setDepositRecipient(null);
            setDepositType(null);
          }}
          recipientAddress={depositRecipient}
          recipientType={depositType}
          tokenData={selectedToken}
        />
      )}

      {/* Withdraw Modal */}
      {selectedToken && (
        <TokenWithdrawModal
          isOpen={withdrawModalOpen}
          onClose={() => {
            setWithdrawModalOpen(false);
            setSelectedToken(null);
          }}
          agentAddress={agentAddress}
          tokenData={selectedToken}
        />
      )}

      {/* Approval Status Modal */}
      <TransactionStatusModal
        isOpen={showApprovalStatusModal}
        onClose={() => setShowApprovalStatusModal(false)}
        txId={currentApprovalTxId || undefined}
        transactionStatus={approvalTransactionStatus}
        transactionMessage={approvalTransactionMessage}
        title={`Contract ${approvalAction === "approve" ? "Approval" : "Revocation"} Status`}
        successTitle={`${approvalAction === "approve" ? "Approval" : "Revocation"} Confirmed`}
        failureTitle={`${approvalAction === "approve" ? "Approval" : "Revocation"} Failed`}
        successDescription={`The contract has been successfully ${approvalAction}d.`}
        failureDescription={`The contract ${approvalAction} could not be completed. Please try again.`}
        pendingDescription={`The contract ${approvalAction} is being processed on the blockchain. This may take a few minutes.`}
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
