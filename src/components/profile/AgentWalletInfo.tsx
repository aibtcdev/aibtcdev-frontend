"use client";

import { Copy, Check, ExternalLink, Wallet, Coins } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";
import { getAddressExplorerUrl } from "@/utils/explorer";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";

interface WalletInfoCardProps {
  walletAddress?: string | null;
  walletBalance?: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
}

// Mobile Asset Card Component
function MobileAssetCard({
  symbol,
  balance,
  isStx = false,
  isBtc = false,
  isNft = false,
}: {
  symbol: string;
  balance: string | number;
  isStx?: boolean;
  isBtc?: boolean;
  isNft?: boolean;
}) {
  const renderBalance = () => {
    if (isStx) {
      return <StxBalance value={balance as string} variant="rounded" />;
    }
    if (isBtc) {
      return <BtcBalance value={balance as string} variant="rounded" />;
    }
    if (isNft) {
      return (
        <span className="font-mono text-muted-foreground text-sm font-semibold">
          {balance}
        </span>
      );
    }
    return (
      <TokenBalance
        value={balance as string}
        symbol={symbol}
        variant="rounded"
      />
    );
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="font-semibold text-foreground text-sm">{symbol}</span>
      </div>
      <div className="text-right">{renderBalance()}</div>
    </div>
  );
}

export function WalletInfoCard({
  walletAddress,
  walletBalance,
}: WalletInfoCardProps) {
  const { copiedText, copyToClipboard } = useClipboard();

  // Prepare asset data for mobile cards
  const assets: Array<{
    symbol: string;
    balance: string | number;
    isStx?: boolean;
    isBtc?: boolean;
    isNft?: boolean;
  }> = [];

  if (walletBalance?.stx) {
    assets.push({
      symbol: "STX",
      balance: walletBalance.stx.balance,
      isStx: true,
    });
  }

  if (walletBalance?.fungible_tokens) {
    Object.entries(walletBalance.fungible_tokens).forEach(
      ([tokenId, token]) => {
        const [, tokenSymbol] = tokenId.split("::");
        const isBtc = tokenId.includes("sbtc-token");
        const displaySymbol = isBtc ? "BTC" : tokenSymbol || "Token";

        assets.push({
          symbol: displaySymbol,
          balance: token.balance,
          isBtc,
        });
      }
    );
  }

  if (walletBalance?.non_fungible_tokens) {
    Object.entries(walletBalance.non_fungible_tokens).forEach(
      ([tokenId, token]) => {
        const [, tokenSymbol] = tokenId.split("::");
        const displaySymbol = tokenSymbol || "NFT";

        assets.push({
          symbol: displaySymbol,
          balance: token.count,
          isNft: true,
        });
      }
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-4">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
          <Wallet className="h-4 w-4 text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Agent Wallet</h3>
          <p className="text-xs text-muted-foreground">
            Automated governance account
          </p>
        </div>
      </div>

      {/* Wallet Address Section */}
      {walletAddress ? (
        <div className="space-y-3">
          <div className="p-3 bg-muted/10 rounded-lg border border-border/20">
            <p className="font-mono text-xs text-foreground break-all mb-1">
              {walletAddress}
            </p>
            <p className="text-xs text-muted-foreground">
              Agent Wallet Address
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(walletAddress)}
              className="text-muted-foreground hover:text-foreground"
            >
              {copiedText === walletAddress ? (
                <Check className="h-3 w-3 mr-1 text-primary" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              <span className="text-xs">
                {copiedText === walletAddress ? "Copied!" : "Copy"}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground"
            >
              <a
                href={getAddressExplorerUrl(walletAddress)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="text-xs">Explorer</span>
              </a>
            </Button>
          </div>
        </div>
      ) : (
        /* No Wallet State */
        <div className="text-center py-6 space-y-2">
          <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              No Wallet Configured
            </h4>
            <p className="text-xs text-muted-foreground">
              Agent wallet will appear when configured
            </p>
          </div>
        </div>
      )}

      {/* Asset Balances Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground">Asset Balances</h4>
        </div>

        {/* Mobile Layout - Cards */}
        <div className="lg:hidden space-y-2">
          {assets.length > 0 ? (
            assets.map((asset, index) => (
              <MobileAssetCard
                key={`${asset.symbol}-${index}`}
                symbol={asset.symbol}
                balance={asset.balance}
                isStx={asset.isStx}
                isBtc={asset.isBtc}
                isNft={asset.isNft}
              />
            ))
          ) : (
            <div className="text-center py-4 space-y-2">
              <div className="w-6 h-6 mx-auto rounded bg-muted/20 flex items-center justify-center">
                <Coins className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-foreground">
                  No Assets Found
                </h5>
                <p className="text-xs text-muted-foreground">
                  Balances will appear when wallet holds tokens
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden lg:block bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/5">
                <TableHead className="text-foreground font-bold px-4 py-2 text-xs">
                  Asset
                </TableHead>
                <TableHead className="text-foreground font-bold px-4 py-2 text-xs">
                  Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* STX Balance */}
              {walletBalance?.stx && (
                <TableRow className="border-border hover:bg-muted/5">
                  <TableCell className="font-semibold text-foreground px-4 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      STX
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <StxBalance
                      value={walletBalance.stx.balance}
                      variant="rounded"
                    />
                  </TableCell>
                </TableRow>
              )}

              {/* Fungible Tokens */}
              {walletBalance &&
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
                        <TableCell className="font-semibold text-foreground px-4 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary" />
                            {displaySymbol}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2">
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
              {walletBalance &&
                Object.entries(walletBalance.non_fungible_tokens).map(
                  ([tokenId, token]) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const displaySymbol = tokenSymbol || "NFT";
                    return (
                      <TableRow
                        key={tokenId}
                        className="border-border hover:bg-muted/5"
                      >
                        <TableCell className="font-semibold text-foreground px-4 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            {displaySymbol}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground px-4 py-2 text-xs font-semibold">
                          {token.count}
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}

              {/* Empty State */}
              {(!walletBalance ||
                (Object.entries(walletBalance.fungible_tokens).length === 0 &&
                  Object.entries(walletBalance.non_fungible_tokens).length ===
                    0 &&
                  !walletBalance.stx)) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-semibold text-foreground">
                          No Assets Found
                        </h5>
                        <p className="text-xs text-muted-foreground">
                          Balances will appear when wallet holds tokens
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
