"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, RotateCcw } from "lucide-react";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";
import { useBatchContractApprovals } from "@/hooks/useContractApproval";
import { AGENT_ACCOUNT_APPROVAL_TYPES } from "@aibtc/types";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";

interface AssetsDataTableProps {
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
  agentAccountId?: string | null | undefined;
}

interface AssetRow {
  id: string;
  symbol: string;
  name: string;
  balance: string | number;
  fiatValue: number;
  change24h: number;
  type: "stx" | "fungible" | "nft";
  contractId?: string;
}

// Functional toggle component with click handler
const FunctionalToggle = ({
  approved,
  loading,
  label,
  onClick,
  disabled,
}: {
  approved?: boolean;
  loading: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative inline-flex h-4 w-7 items-center rounded-full bg-muted">
          <RotateCcw className="w-3 h-3 animate-spin text-muted-foreground mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative inline-flex h-4 w-7 items-center rounded-full transition-colors cursor-pointer
          ${approved ? "bg-primary" : "bg-muted"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}
        `}
        aria-label={label}
      >
        <span
          className={`
            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
            ${approved ? "translate-x-3.5" : "translate-x-0.5"}
          `}
        />
      </button>
    </div>
  );
};

export function AssetsDataTable({
  walletBalance,
  agentAccountId,
}: AssetsDataTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingContract, setUpdatingContract] = useState<string | null>(null);

  // Transform wallet balance into table rows
  const assets = useMemo(() => {
    const rows: AssetRow[] = [];

    if (walletBalance?.stx) {
      rows.push({
        id: "stx",
        symbol: "STX",
        name: "Stacks",
        balance: walletBalance.stx.balance,
        fiatValue: 850.32, // Mock value
        change24h: 2.4,
        type: "stx",
        // No contractId for STX - won't show approvals
      });
    }

    if (walletBalance?.fungible_tokens) {
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";

          // Extract contract principal (remove the ::token-name part)
          const contractPrincipal = tokenId.split("::")[0];

          rows.push({
            id: tokenId,
            symbol: displaySymbol,
            name: isBtc ? "Bitcoin" : displaySymbol,
            balance: token.balance,
            fiatValue: isBtc ? 384.24 : 0, // Mock values
            change24h: isBtc ? -1.2 : 0,
            type: "fungible",
            // Only add contractId for non-BTC fungible tokens, use contract principal only
            contractId: !isBtc ? contractPrincipal : undefined,
          });
        }
      );
    }

    if (walletBalance?.non_fungible_tokens) {
      Object.entries(walletBalance.non_fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const displaySymbol = tokenSymbol || "NFT";

          rows.push({
            id: tokenId,
            symbol: displaySymbol,
            name: displaySymbol,
            balance: token.count,
            fiatValue: 0,
            change24h: 0,
            type: "nft",
            // No contractId for NFTs - won't show approvals
          });
        }
      );
    }
    console.log(
      "All asset IDs:",
      rows.map((row) => row.id)
    );
    return rows;
  }, [walletBalance]);

  // Get all contract IDs for batch approval checking
  const contractIds = useMemo(() => {
    const ids = assets
      .filter(
        (asset) =>
          asset.contractId &&
          asset.type === "fungible" &&
          asset.symbol !== "BTC"
      )
      .map((asset) => asset.contractId!);

    console.log("Contract IDs for approval checking:", ids);
    return ids;
  }, [assets]);

  // Fetch approvals for token type only
  const tokenApprovals = useBatchContractApprovals(
    agentAccountId || null,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
  );

  // Mutation for updating contract approvals
  const updateApprovalMutation = useMutation({
    mutationFn: async ({
      contractId,
      enabled,
      type,
    }: {
      contractId: string;
      enabled: boolean;
      type: number;
    }) => {
      if (!agentAccountId) throw new Error("No agent account ID");

      // Set the contract that's being updated
      setUpdatingContract(contractId);

      const functionName = enabled ? "approve-contract" : "revoke-contract";

      try {
        const response = await request("stx_callContract", {
          contract: agentAccountId as `${string}.${string}`,
          functionName,
          functionArgs: [Cl.principal(contractId), Cl.uint(type)],
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
            | "mainnet"
            | "testnet",
        });

        return {
          txid: response.txid,
          contractId,
          enabled,
          type,
        };
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error("User cancelled the transaction");
        }
        throw new Error(
          `Failed to update approval: ${error.message || "Unknown error"}`
        );
      }
    },
    onSuccess: async (data) => {
      // Clear the updating state
      setUpdatingContract(null);

      // Invalidate and refetch approval queries with cache busting
      await queryClient.invalidateQueries({
        queryKey: ["batch-approvals", agentAccountId, contractIds, data.type],
      });

      // Force refetch with cache busting
      await queryClient.refetchQueries({
        queryKey: ["batch-approvals", agentAccountId, contractIds, data.type],
        type: "all",
      });

      toast({
        title: "Transaction Submitted",
        description: `Contract ${data.enabled ? "approval" : "revocation"} submitted. Transaction ID: ${data.txid}`,
      });
    },
    onError: (error) => {
      // Clear the updating state
      setUpdatingContract(null);

      if (error.message === "User cancelled the transaction") {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the approval update.",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update approval: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  // Handle toggle click
  const handleToggleClick = (contractId: string, currentApproval: boolean) => {
    updateApprovalMutation.mutate({
      contractId,
      enabled: !currentApproval,
      type: AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
    });
  };

  // Debug logging
  console.log("Agent Account ID:", agentAccountId);
  console.log("Contract IDs:", contractIds);
  console.log("Token Approvals:", {
    loading: tokenApprovals.isLoading,
    data: tokenApprovals.data,
    error: tokenApprovals.error,
  });

  const renderBalance = (asset: AssetRow) => {
    if (asset.type === "stx") {
      return <StxBalance value={asset.balance as string} variant="rounded" />;
    }
    if (asset.type === "fungible") {
      const isBtc = asset.symbol === "BTC";
      return isBtc ? (
        <BtcBalance value={asset.balance as string} variant="rounded" />
      ) : (
        <TokenBalance
          value={asset.balance as string}
          symbol={asset.symbol}
          variant="rounded"
        />
      );
    }
    return <span className="font-mono text-sm">{asset.balance}</span>;
  };

  if (!walletBalance) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
          <Coins className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No Assets Found</h3>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view assets
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/5">
              <TableRow className="border-b">
                <TableHead className="min-w-[180px] px-4 py-3">Asset</TableHead>
                <TableHead className="text-right min-w-[120px] px-4 py-3">
                  Balance
                </TableHead>
                <TableHead className="text-center min-w-[100px] px-2 py-3 hidden sm:table-cell">
                  <span className="hidden md:inline">Token Approval</span>
                  <span className="md:hidden">Token</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                // Only show approvals for fungible tokens (excluding STX and BTC)
                const isApprovalApplicable =
                  !!agentAccountId &&
                  !!asset.contractId &&
                  asset.type === "fungible" &&
                  asset.symbol !== "BTC";
                const isLoading = tokenApprovals.isLoading;
                const currentApproval =
                  tokenApprovals.data?.[asset.contractId!] || false;
                const isThisContractUpdating =
                  updatingContract === asset.contractId;

                return (
                  <TableRow
                    key={asset.id}
                    className="hover:bg-muted/5 transition-colors"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {asset.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {asset.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-4 py-3">
                      {renderBalance(asset)}
                    </TableCell>
                    {/* Token Approval */}
                    <TableCell className="text-center px-2 py-3 hidden sm:table-cell">
                      {isApprovalApplicable ? (
                        <FunctionalToggle
                          approved={currentApproval}
                          loading={isLoading || isThisContractUpdating}
                          label="Token approval"
                          onClick={() =>
                            handleToggleClick(
                              asset.contractId!,
                              currentApproval
                            )
                          }
                          disabled={isThisContractUpdating}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
