"use client";

import type React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";

interface BalanceSummaryCardProps {
  title: string;
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}

export function BalanceSummaryCard({
  title,
  walletBalance,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: BalanceSummaryCardProps) {
  const getAssetCount = () => {
    let count = 0;
    if (walletBalance?.stx) count++;
    if (walletBalance?.fungible_tokens) {
      count += Object.keys(walletBalance.fungible_tokens).length;
    }
    if (walletBalance?.non_fungible_tokens) {
      count += Object.keys(walletBalance.non_fungible_tokens).length;
    }
    return count;
  };

  const assetCount = getAssetCount();

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-sm ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!walletBalance ? (
          <div className="text-center py-6 space-y-2">
            <div className="w-8 h-8 mx-auto rounded-sm bg-muted/20 flex items-center justify-center">
              <Coins className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                No Balance Data
              </h4>
              <p className="text-xs text-muted-foreground">
                Wallet balance will appear when loaded
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Summary */}
            <div className="flex items-center justify-between p-3 bg-muted/10 rounded-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total Assets</p>
                <p className="text-lg font-bold text-foreground">
                  {assetCount}
                </p>
              </div>
              {walletBalance.stx && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">STX Balance</p>
                  <StxBalance
                    value={walletBalance.stx.balance}
                    variant="rounded"
                  />
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/5">
                    <TableHead className="text-foreground font-bold text-xs">
                      Asset
                    </TableHead>
                    <TableHead className="text-foreground font-bold text-xs text-right">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* STX Balance */}
                  {walletBalance.stx && (
                    <TableRow className="border-border hover:bg-muted/5">
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-primary" />
                          <span className="font-semibold">STX</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <StxBalance
                          value={walletBalance.stx.balance}
                          variant="rounded"
                        />
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Fungible Tokens */}
                  {walletBalance.fungible_tokens &&
                    Object.entries(walletBalance.fungible_tokens).map(
                      ([tokenId, token]) => {
                        const [, tokenSymbol] = tokenId.split("::");
                        const isBtc = tokenId.includes("sbtc-token");
                        const displaySymbol = isBtc
                          ? "BTC"
                          : tokenSymbol || "Token";

                        return (
                          <TableRow
                            key={tokenId}
                            className="border-border hover:bg-muted/5"
                          >
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-secondary" />
                                <span className="font-semibold">
                                  {displaySymbol}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isBtc ? (
                                <BtcBalance
                                  value={token.balance}
                                  variant="rounded"
                                />
                              ) : (
                                <TokenBalance
                                  value={token.balance}
                                  symbol={displaySymbol}
                                  variant="rounded"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}

                  {/* NFTs */}
                  {walletBalance.non_fungible_tokens &&
                    Object.entries(walletBalance.non_fungible_tokens).map(
                      ([tokenId, token]) => {
                        const [, tokenSymbol] = tokenId.split("::");
                        const displaySymbol = tokenSymbol || "NFT";

                        return (
                          <TableRow
                            key={tokenId}
                            className="border-border hover:bg-muted/5"
                          >
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-accent" />
                                <span className="font-semibold">
                                  {displaySymbol}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground text-xs font-semibold text-right">
                              {token.count}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {walletBalance.stx && (
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-sm border border-border/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm bg-primary" />
                    <span className="font-semibold text-foreground text-sm">
                      STX
                    </span>
                  </div>
                  <StxBalance
                    value={walletBalance.stx.balance}
                    variant="rounded"
                  />
                </div>
              )}

              {walletBalance.fungible_tokens &&
                Object.entries(walletBalance.fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const isBtc = tokenId.includes("sbtc-token");
                    const displaySymbol = isBtc
                      ? "BTC"
                      : tokenSymbol || "Token";

                    return (
                      <div
                        key={tokenId}
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-sm border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-secondary" />
                          <span className="font-semibold text-foreground text-sm">
                            {displaySymbol}
                          </span>
                        </div>
                        {isBtc ? (
                          <BtcBalance value={token.balance} variant="rounded" />
                        ) : (
                          <TokenBalance
                            value={token.balance}
                            symbol={displaySymbol}
                            variant="rounded"
                          />
                        )}
                      </div>
                    );
                  }
                )}

              {walletBalance.non_fungible_tokens &&
                Object.entries(walletBalance.non_fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const displaySymbol = tokenSymbol || "NFT";

                    return (
                      <div
                        key={tokenId}
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-sm border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-accent" />
                          <span className="font-semibold text-foreground text-sm">
                            {displaySymbol}
                          </span>
                        </div>
                        <span className="font-mono text-muted-foreground text-sm font-semibold">
                          {token.count}
                        </span>
                      </div>
                    );
                  }
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
