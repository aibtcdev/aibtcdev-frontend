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
import { Cl, Pc } from "@stacks/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";

interface AssetsDataTableProps {
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
  agentAccountId?: string | null | undefined;
  userWalletAddress?: string | null;
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
  userWalletAddress, // not needed for post-conditions; receiver is implied by contract call
}: AssetsDataTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingContract, setUpdatingContract] = useState<string | null>(null);
  const [withdrawingContract, setWithdrawingContract] = useState<string | null>(
    null
  );
  const [withdrawAmounts, setWithdrawAmounts] = useState<
    Record<string, string>
  >({});

  const assets = useMemo(() => {
    try {
      const rows: AssetRow[] = [];
      if (walletBalance?.stx) {
        rows.push({
          id: "stx",
          symbol: "STX",
          name: "Stacks",
          balance: walletBalance.stx.balance,
          fiatValue: 850.32,
          change24h: 2.4,
          type: "stx",
        });
      }
      if (walletBalance?.fungible_tokens) {
        Object.entries(walletBalance.fungible_tokens).forEach(
          ([tokenId, token]) => {
            // tokenId e.g. "SPXXXX.contract::token-name"
            const [, tokenSymbol] = tokenId.split("::");
            const isBtc = tokenId.includes("sbtc-token");
            const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";
            const contractPrincipal = tokenId.split("::")[0]; // "SPXXXX.contract"
            rows.push({
              id: tokenId,
              symbol: displaySymbol,
              name: isBtc ? "Bitcoin" : displaySymbol,
              balance: token.balance,
              fiatValue: isBtc ? 384.24 : 0,
              change24h: isBtc ? -1.2 : 0,
              type: "fungible",
              contractId: contractPrincipal,
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
            });
          }
        );
      }
      return rows;
    } catch (error) {
      console.error("Error in assets useMemo:", error);
      console.error("walletBalance:", walletBalance);
      return [];
    }
  }, [walletBalance]);

  const contractIds = useMemo(
    () =>
      assets
        .filter((a) => a.contractId && a.type === "fungible")
        .map((a) => a.contractId!),
    [assets]
  );

  // ===== Withdraw FT (WITH post conditions) =====
  const withdrawFtMutation = useMutation({
    mutationFn: async ({
      contractId,
      amount,
    }: {
      contractId: string;
      amount: string | number;
    }) => {
      try {
        if (!agentAccountId) throw new Error("No agent account ID");
        if (!amount || Number(amount) <= 0)
          throw new Error("Enter a valid amount");

        setWithdrawingContract(contractId);

        const asset = assets.find((a) => a.contractId === contractId);
        if (!asset) throw new Error("Asset not found");

        // tokenId: "SPXXXX.contract::token-name"
        if (!asset.id.includes("::")) {
          throw new Error(`Invalid token ID format: ${asset.id}`);
        }
        const [assetContractId, tokenName] = asset.id.split("::"); // "SP....contract", "token-name"
        if (!assetContractId.includes(".")) {
          throw new Error(`Invalid contract principal: ${assetContractId}`);
        }
        const [assetAddress, assetContractName] = assetContractId.split(".");

        // Amount is in base units (you control decimals upstream)
        const amountUint = Math.floor(Number(amount));
        if (Number.isNaN(amountUint) || amountUint <= 0) {
          throw new Error("Invalid amount");
        }

        // ---- POST CONDITION: agent account must SEND exactly 'amountUint' of this FT
        const ftPostCondition = Pc.principal(
          agentAccountId as `${string}.${string}`
        )
          .willSendEq(amountUint)
          .ft(
            `${assetAddress}.${assetContractName}` as `${string}.${string}`,
            tokenName
          );

        // Contract call with post-conditions enforced (deny anything outside)
        const response = await request("stx_callContract", {
          contract: agentAccountId as `${string}.${string}`,
          functionName: "withdraw-ft",
          functionArgs: [
            Cl.contractPrincipal(assetAddress, assetContractName), // FT contract principal
            Cl.uint(amountUint), // exact base units
          ],
          postConditions: [ftPostCondition],
          postConditionMode: "deny",
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
            | "mainnet"
            | "testnet",
        });

        if (!response || !("txid" in response)) {
          throw new Error(
            "Transaction failed before broadcasting (no txid in response)"
          );
        }

        return { txid: response.txid, contractId, amount, tokenName };
      } catch (error: any) {
        // Log the original error for debugging
        console.error("Original error:", error);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error code:", error?.code);

        // Handle specific error cases
        if (error?.code === 4001) {
          throw new Error("User cancelled the transaction");
        }

        // Re-throw the original error message instead of wrapping it
        if (error?.message) {
          throw new Error(error.message);
        }

        // Fallback for unknown errors
        throw new Error("Unknown error occurred");
      } finally {
        setWithdrawingContract(null);
      }
    },
    onSuccess: (data) => {
      console.log("Withdraw success:", data);
      setWithdrawingContract(null);
      toast({
        title: "Withdrawal Submitted",
        description: `TXID: ${data.txid}`,
      });
      setWithdrawAmounts((prev) => ({ ...prev, [data.contractId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (error) => {
      console.error("Withdraw mutation error:", error);
      setWithdrawingContract(null);
      toast({
        title:
          (error as Error).message === "User cancelled the transaction"
            ? "Transaction Cancelled"
            : "Withdrawal Error",
        description: (error as Error).message,
        variant:
          (error as Error).message === "User cancelled the transaction"
            ? undefined
            : "destructive",
      });
    },
  });

  // ===== Approvals (with error logging) =====
  const tokenApprovals = useBatchContractApprovals(
    agentAccountId || null,
    contractIds,
    AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN
  );

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
      try {
        if (!agentAccountId) throw new Error("No agent account ID");
        setUpdatingContract(contractId);
        const functionName = enabled ? "approve-contract" : "revoke-contract";

        const response = await request("stx_callContract", {
          contract: agentAccountId as `${string}.${string}`,
          functionName,
          functionArgs: [Cl.principal(contractId), Cl.uint(type)],
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
            | "mainnet"
            | "testnet",
        });

        return { txid: response.txid, contractId, enabled, type };
      } catch (error: any) {
        // Log the original error for debugging
        console.error("Original approval error:", error);
        console.error("Error name:", error?.name);
        console.error("Error message:", error?.message);
        console.error("Error code:", error?.code);
        console.error("Contract ID:", contractId);
        console.error("Enabled:", enabled);
        console.error("Type:", type);

        // Handle specific error cases
        if (error?.code === 4001) {
          throw new Error("User cancelled the transaction");
        }

        // Re-throw the original error message
        if (error?.message) {
          throw new Error(error.message);
        }

        throw new Error("Unknown error occurred");
      }
    },
    onSuccess: async (data) => {
      console.log("Approval success:", data);
      setUpdatingContract(null);
      await queryClient.invalidateQueries({
        queryKey: ["batch-approvals", agentAccountId, contractIds, data.type],
      });
      await queryClient.refetchQueries({
        queryKey: ["batch-approvals", agentAccountId, contractIds, data.type],
        type: "all",
      });
      toast({
        title: "Transaction Submitted",
        description: `Contract ${data.enabled ? "approval" : "revocation"} submitted. TXID: ${data.txid}`,
      });
    },
    onError: (error) => {
      console.error("Approval mutation error:", error);
      setUpdatingContract(null);
      toast({
        title:
          (error as Error).message === "User cancelled the transaction"
            ? "Transaction Cancelled"
            : "Error",
        description: (error as Error).message,
        variant:
          (error as Error).message === "User cancelled the transaction"
            ? undefined
            : "destructive",
      });
    },
  });

  const handleToggleClick = (contractId: string, currentApproval: boolean) => {
    try {
      updateApprovalMutation.mutate({
        contractId,
        enabled: !currentApproval,
        type: AGENT_ACCOUNT_APPROVAL_TYPES.TOKEN,
      });
    } catch (error) {
      console.error("Error in handleToggleClick:", error);
    }
  };

  const setAmount = (contractId: string, v: string) => {
    try {
      const numericValue = v.replace(/[^0-9]/g, "").slice(0, 18);
      setWithdrawAmounts((prev) => ({
        ...prev,
        [contractId]: numericValue,
      }));
    } catch (error) {
      console.error("Error in setAmount:", error);
      console.error("contractId:", contractId);
      console.error("value:", v);
    }
  };

  const handleWithdraw = (contractId: string) => {
    try {
      const amount = withdrawAmounts[contractId];
      if (!amount || Number(amount) <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount to withdraw",
          variant: "destructive",
        });
        return;
      }

      const asset = assets.find((a) => a.contractId === contractId);
      if (asset && Number(amount) > Number(asset.balance)) {
        toast({
          title: "Insufficient Balance",
          description: "Amount exceeds available balance",
          variant: "destructive",
        });
        return;
      }

      withdrawFtMutation.mutate({ contractId, amount });
    } catch (error) {
      console.error("Error in handleWithdraw:", error);
      console.error("contractId:", contractId);
      console.error("withdrawAmounts:", withdrawAmounts);
    }
  };

  const renderBalance = (asset: AssetRow) => {
    try {
      if (asset.type === "stx")
        return <StxBalance value={asset.balance as string} variant="rounded" />;
      if (asset.type === "fungible")
        return asset.symbol === "BTC" ? (
          <BtcBalance value={asset.balance as string} variant="rounded" />
        ) : (
          <TokenBalance
            value={asset.balance as string}
            symbol={asset.symbol}
            variant="rounded"
          />
        );
      return <span className="font-mono text-sm">{asset.balance}</span>;
    } catch (error) {
      console.error("Error in renderBalance:", error);
      console.error("Asset:", asset);
      return <span className="font-mono text-sm">Error</span>;
    }
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
                  Token Approval
                </TableHead>
                <TableHead className="text-center min-w-[160px] px-2 py-3 hidden sm:table-cell">
                  Withdraw
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                try {
                  const isApprovalApplicable =
                    !!agentAccountId &&
                    !!asset.contractId &&
                    asset.type === "fungible" &&
                    asset.symbol !== "BTC";
                  const currentApproval =
                    tokenApprovals.data?.[asset.contractId!] || false;

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
                      <TableCell className="text-center px-2 py-3 hidden sm:table-cell">
                        {isApprovalApplicable ? (
                          <FunctionalToggle
                            approved={currentApproval}
                            loading={
                              tokenApprovals.isLoading ||
                              updatingContract === asset.contractId
                            }
                            label="Token approval"
                            onClick={() =>
                              handleToggleClick(
                                asset.contractId!,
                                currentApproval
                              )
                            }
                            disabled={updatingContract === asset.contractId}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 py-3 hidden sm:table-cell">
                        {asset.type === "fungible" && asset.contractId ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={withdrawAmounts[asset.contractId] ?? ""}
                              onChange={(e) =>
                                setAmount(asset.contractId!, e.target.value)
                              }
                              placeholder="amount"
                              className="h-8 w-28 rounded border bg-transparent px-2 text-sm"
                            />
                            <button
                              onClick={() => handleWithdraw(asset.contractId!)}
                              disabled={
                                withdrawingContract === asset.contractId ||
                                !tokenApprovals.data?.[asset.contractId!] ||
                                !withdrawAmounts[asset.contractId] ||
                                Number(withdrawAmounts[asset.contractId]) <= 0
                              }
                              className={`h-8 px-3 rounded text-xs font-medium transition-colors ${
                                tokenApprovals.data?.[asset.contractId!] &&
                                withdrawAmounts[asset.contractId] &&
                                Number(withdrawAmounts[asset.contractId]) > 0
                                  ? "bg-primary text-primary-foreground hover:opacity-90"
                                  : "bg-muted text-muted-foreground cursor-not-allowed"
                              }`}
                            >
                              {withdrawingContract === asset.contractId
                                ? "Withdrawing..."
                                : "Withdraw"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                } catch (error) {
                  console.error("Error rendering asset row:", error);
                  console.error("Asset:", asset);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell
                        colSpan={4}
                        className="text-center text-red-500"
                      >
                        Error rendering asset: {asset.symbol}
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
