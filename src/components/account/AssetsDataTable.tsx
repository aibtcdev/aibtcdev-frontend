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
import { Coins } from "lucide-react";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";

interface AssetsDataTableProps {
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
}

interface AssetRow {
  id: string;
  symbol: string;
  name: string;
  balance: string | number;
  fiatValue: number;
  change24h: number;
  type: "stx" | "fungible" | "nft";
}

export function AssetsDataTable({ walletBalance }: AssetsDataTableProps) {
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
      });
    }

    if (walletBalance?.fungible_tokens) {
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";

          rows.push({
            id: tokenId,
            symbol: displaySymbol,
            name: isBtc ? "Bitcoin" : displaySymbol,
            balance: token.balance,
            fiatValue: isBtc ? 384.24 : 0, // Mock values
            change24h: isBtc ? -1.2 : 0,
            type: "fungible",
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
  }, [walletBalance]);

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
    <div className="space-y-4">
      {/* Data Table */}
      <div className="rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full divide-y divide-muted/20">
            <TableHeader className="bg-muted/10 sticky top-0 z-10">
              <TableRow className="border-b">
                <TableHead className="w-[200px]">Asset</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="hover:bg-muted/5 even:bg-muted/10 transition"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{asset.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {renderBalance(asset)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
