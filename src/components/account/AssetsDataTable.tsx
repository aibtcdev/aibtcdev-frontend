"use client";

import { useMemo } from "react";
import { Coins, TrendingUp, TrendingDown } from "lucide-react";
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
  // Transform wallet balance into asset rows
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
      <div className="w-full">
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto rounded-sm bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6">
            <Coins className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            No Assets Found
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Connect your wallet to view your digital assets and balances
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Your Assets</h2>
        <span className="text-sm text-muted-foreground">
          {assets.length} {assets.length === 1 ? "asset" : "assets"}
        </span>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-3">
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            className="group relative overflow-hidden rounded-sm border border-border/50 bg-gradient-to-r from-card to-card/80 p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center gap-4">
              {/* Asset Icon & Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon with gradient background */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                      asset.type === "stx"
                        ? "bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200/50"
                        : asset.symbol === "BTC"
                          ? "bg-gradient-to-br from-yellow-100 to-yellow-50 border border-yellow-200/50"
                          : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        asset.type === "stx"
                          ? "text-orange-700"
                          : asset.symbol === "BTC"
                            ? "text-yellow-700"
                            : "text-primary"
                      }`}
                    >
                      {asset.symbol.slice(0, 2)}
                    </span>
                  </div>
                  {/* Rank indicator for first few assets - Hidden on mobile */}
                  {index < 3 && (
                    <div className="hidden sm:flex absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-sm items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>

                {/* Asset Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-base truncate">
                      {asset.symbol}
                    </h3>
                    {asset.type === "stx" && (
                      <span className="hidden sm:inline px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-sm">
                        Native
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {asset.name}
                  </p>
                </div>
              </div>

              {/* Balance & Value */}
              <div className="text-right flex-shrink-0">
                <div className="mb-1">
                  <div className="font-bold text-foreground">
                    {renderBalance(asset)}
                  </div>
                </div>
                {/* Mock USD value and change - Hidden on mobile */}
                <div className="hidden sm:flex items-center justify-end gap-1 text-xs">
                  <span className="text-muted-foreground">
                    ${asset.fiatValue.toFixed(2)}
                  </span>
                  <div
                    className={`flex items-center gap-0.5 ${
                      asset.change24h >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {asset.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="font-medium">
                      {Math.abs(asset.change24h)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer - Hidden on mobile */}
      <div className="hidden sm:block mt-6 p-4 rounded-sm bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Portfolio Value</span>
          <span className="font-bold text-foreground">
            $
            {assets.reduce((sum, asset) => sum + asset.fiatValue, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
