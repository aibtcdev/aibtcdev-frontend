"use client";

import { useMemo } from "react";
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

// Simple toggle component
const SimpleToggle = ({
  approved,
  loading,
  label,
}: {
  approved?: boolean;
  loading: boolean;
  label: string;
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
      <div
        className={`
        relative inline-flex h-4 w-7 items-center rounded-full transition-colors
        ${approved ? "bg-primary" : "bg-muted"}
      `}
      >
        <span
          className={`
          inline-block h-3 w-3 transform rounded-full bg-white transition-transform
          ${approved ? "translate-x-3.5" : "translate-x-0.5"}
        `}
        />
      </div>
    </div>
  );
};

export function AssetsDataTable({
  walletBalance,
  agentAccountId,
}: AssetsDataTableProps) {
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

  // Fetch approvals for all types
  const swapApprovals = useBatchContractApprovals(
    agentAccountId || null,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.SWAP
  );

  const votingApprovals = useBatchContractApprovals(
    agentAccountId || null,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.VOTING
  );

  const tokenApprovals = useBatchContractApprovals(
    agentAccountId || null,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
  );

  // Debug logging
  console.log("Agent Account ID:", agentAccountId);
  console.log("Contract IDs:", contractIds);
  console.log("Swap Approvals:", {
    loading: swapApprovals.isLoading,
    data: swapApprovals.data,
    error: swapApprovals.error,
  });
  console.log("Voting Approvals:", {
    loading: votingApprovals.isLoading,
    data: votingApprovals.data,
    error: votingApprovals.error,
  });
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
                  <span className="hidden md:inline">Token</span>
                  <span className="md:hidden">T</span>
                </TableHead>
                <TableHead className="text-center min-w-[100px] px-2 py-3 hidden sm:table-cell">
                  <span className="hidden md:inline">Voting</span>
                  <span className="md:hidden">V</span>
                </TableHead>
                <TableHead className="text-center min-w-[100px] px-2 py-3 hidden sm:table-cell">
                  <span className="hidden md:inline">Swap</span>
                  <span className="md:hidden">S</span>
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
                const isLoading =
                  tokenApprovals.isLoading ||
                  votingApprovals.isLoading ||
                  swapApprovals.isLoading;
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
                        <SimpleToggle
                          approved={tokenApprovals.data?.[asset.contractId!]}
                          loading={isLoading}
                          label="Token approval"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Voting Approval */}
                    <TableCell className="text-center px-2 py-3 hidden sm:table-cell">
                      {isApprovalApplicable ? (
                        <SimpleToggle
                          approved={votingApprovals.data?.[asset.contractId!]}
                          loading={isLoading}
                          label="Voting approval"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {/* Swap Approval */}
                    <TableCell className="text-center px-2 py-3 hidden sm:table-cell">
                      {isApprovalApplicable ? (
                        <SimpleToggle
                          approved={swapApprovals.data?.[asset.contractId!]}
                          loading={isLoading}
                          label="Swap approval"
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
