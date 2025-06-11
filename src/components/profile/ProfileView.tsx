"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Copy,
  Check,
  User,
  Wallet,
  Coins,
  Settings,
  DollarSign,
} from "lucide-react";
import { getStacksAddress } from "@/lib/address";
import { getExplorerLink } from "@/helpers/helper";
import { useClipboard } from "@/helpers/clipboard-utils";
import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/queries/agent-queries";
import { AgentPromptForm } from "./AgentPromptForm";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icon button component for inline actions
function IconButton({
  icon: Icon,
  onClick,
  href,
  copied = false,
  size = "sm",
}: {
  icon: React.ElementType;
  onClick?: () => void;
  href?: string;
  copied?: boolean;
  size?: "sm" | "xs";
}) {
  const sizeClasses = size === "xs" ? "w-6 h-6" : "w-8 h-8";
  const iconSize = size === "xs" ? "h-3 w-3" : "h-4 w-4";

  const content = (
    <div
      className={`${sizeClasses} rounded-md hover:bg-muted/50 flex items-center justify-center cursor-pointer transition-colors`}
    >
      <Icon
        className={`${iconSize} ${copied ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div onClick={onClick}>{content}</div>;
}

// Account row component
function AccountRow({
  title,
  subtitle,
  address,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  linkType = "address",
  explorerId,
}: {
  title: string;
  subtitle: string;
  address: string | null;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  linkType?: "address" | "tx" | "contract";
  explorerId?: string | null;
}) {
  const { copyToClipboard, copiedText } = useClipboard();

  if (!address) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/5 rounded-lg border border-border/20">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Not connected</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/5 rounded-lg border border-border/20">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            {address}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <IconButton
          icon={copiedText === address ? Check : Copy}
          onClick={() => copyToClipboard(address)}
          copied={copiedText === address}
          size="xs"
        />
        <IconButton
          icon={ExternalLink}
          href={
            linkType === "address" || linkType === "contract"
              ? address
                ? getExplorerLink(linkType, address)
                : undefined
              : explorerId
                ? getExplorerLink(linkType, explorerId)
                : undefined
          }
          size="xs"
        />
      </div>
    </div>
  );
}

// Primary Assets Card (STX and BTC)
function PrimaryAssetsCard({
  title,
  walletBalance,
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
}: {
  title: string;
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}) {
  if (!walletBalance) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
            >
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
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
        </CardContent>
      </Card>
    );
  }

  // Find BTC token if it exists
  const btcToken = Object.entries(walletBalance.fungible_tokens || {}).find(
    ([tokenId]) => tokenId.includes("sbtc-token")
  );

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-4">
            {btcToken && (
              <div className="p-3 bg-muted/10 rounded-lg">
                <p className="text-xs text-muted-foreground">BTC Balance</p>
                <BtcBalance value={btcToken[1].balance} variant="rounded" />
              </div>
            )}
            {walletBalance.stx && (
              <div className="p-3 bg-muted/10 rounded-lg">
                <p className="text-xs text-muted-foreground">STX Balance</p>
                <StxBalance
                  value={walletBalance.stx.balance}
                  variant="rounded"
                />
              </div>
            )}
          </div>

          {/* Detailed Assets - Desktop Table */}
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
                {/* BTC Balance */}
                {btcToken && (
                  <TableRow className="border-border hover:bg-muted/5">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="font-semibold">BTC</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <BtcBalance
                        value={btcToken[1].balance}
                        variant="rounded"
                      />
                    </TableCell>
                  </TableRow>
                )}

                {/* STX Balance */}
                {walletBalance.stx && (
                  <TableRow className="border-border hover:bg-muted/5">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
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
              </TableBody>
            </Table>
          </div>

          {/* Detailed Assets - Mobile Cards */}
          <div className="md:hidden space-y-2">
            {btcToken && (
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="font-semibold text-foreground text-sm">
                    BTC
                  </span>
                </div>
                <BtcBalance value={btcToken[1].balance} variant="rounded" />
              </div>
            )}

            {walletBalance.stx && (
              <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Token Holdings Card (Other fungible tokens)
function TokenHoldingsCard({
  title,
  walletBalance,
  icon: Icon,
  iconBg = "bg-secondary/10",
  iconColor = "text-secondary",
}: {
  title: string;
  walletBalance: {
    stx: { balance: string };
    fungible_tokens: Record<string, { balance: string }>;
    non_fungible_tokens: Record<string, { count: number }>;
  } | null;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
}) {
  if (!walletBalance || !walletBalance.fungible_tokens) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
            >
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                No Token Holdings
              </h4>
              <p className="text-xs text-muted-foreground">
                Token balances will appear when available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter out BTC token
  const tokenEntries = Object.entries(walletBalance.fungible_tokens).filter(
    ([tokenId]) => !tokenId.includes("sbtc-token")
  );

  if (
    tokenEntries.length === 0 &&
    (!walletBalance.non_fungible_tokens ||
      Object.keys(walletBalance.non_fungible_tokens).length === 0)
  ) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
            >
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 space-y-2">
            <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                No Token Holdings
              </h4>
              <p className="text-xs text-muted-foreground">
                Token balances will appear when available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Fungible Tokens - Desktop Table */}
          {tokenEntries.length > 0 && (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/5">
                    <TableHead className="text-foreground font-bold text-xs">
                      Token
                    </TableHead>
                    <TableHead className="text-foreground font-bold text-xs text-right">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenEntries.map(([tokenId, token], index) => {
                    const [, tokenSymbol] = tokenId.split("::");
                    const displaySymbol = tokenSymbol || "Token";

                    return (
                      <TableRow
                        key={tokenId}
                        className="border-border hover:bg-muted/5"
                      >
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="font-semibold">
                              {displaySymbol}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TokenBalance
                            value={token.balance}
                            symbol={displaySymbol}
                            variant="rounded"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Fungible Tokens - Mobile Cards */}
          {tokenEntries.length > 0 && (
            <div className="md:hidden space-y-2">
              {tokenEntries.map(([tokenId, token]) => {
                const [, tokenSymbol] = tokenId.split("::");
                const displaySymbol = tokenSymbol || "Token";

                return (
                  <div
                    key={tokenId}
                    className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-foreground text-sm">
                        {displaySymbol}
                      </span>
                    </div>
                    <TokenBalance
                      value={token.balance}
                      symbol={displaySymbol}
                      variant="rounded"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* NFT Holdings */}
          {walletBalance.non_fungible_tokens &&
            Object.keys(walletBalance.non_fungible_tokens).length > 0 && (
              <>
                <div className="pt-2 pb-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    NFT Collections
                  </h3>
                </div>

                {/* NFTs - Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/5">
                        <TableHead className="text-foreground font-bold text-xs">
                          Collection
                        </TableHead>
                        <TableHead className="text-foreground font-bold text-xs text-right">
                          Count
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(walletBalance.non_fungible_tokens).map(
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
                                  <div className="w-2 h-2 rounded-full bg-purple-500" />
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

                {/* NFTs - Mobile Cards */}
                <div className="md:hidden space-y-2">
                  {Object.entries(walletBalance.non_fungible_tokens).map(
                    ([tokenId, token]) => {
                      const [, tokenSymbol] = tokenId.split("::");
                      const displaySymbol = tokenSymbol || "NFT";
                      return (
                        <div
                          key={tokenId}
                          className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
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
              </>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileView() {
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useAuth();
  const { toast } = useToast();
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Fetch the DAO Manager agent
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const daoManagerAgentId = agents[0]?.id || "";

  // Fetch wallet information when userId is available
  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
        toast({
          title: "Error",
          description: "Failed to fetch wallet information",
          variant: "destructive",
        });
      });
    }
  }, [userId, fetchWallets, toast]);

  useEffect(() => {
    setIsClient(true);
    setStacksAddress(getStacksAddress());
  }, []);

  // Get agent wallet information
  const getAgentWalletInfo = (agentId: string) => {
    if (!agentId) return { walletAddress: null, walletBalance: null };

    const agentWallet = agentWallets.find(
      (wallet) => wallet.agent_id === agentId
    );

    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
    const walletAddress =
      network === "mainnet"
        ? agentWallet?.mainnet_address
        : agentWallet?.testnet_address;

    const walletBalance = walletAddress ? balances[walletAddress] : null;

    return { walletAddress, walletBalance };
  };

  const {
    walletAddress: daoManagerWalletAddress,
    walletBalance: daoManagerWalletBalance,
  } = getAgentWalletInfo(daoManagerAgentId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your account and connected wallet information
          </p>
        </div>
      </div>

      {/* Connected Accounts and Primary Assets - Side by Side on Desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Accounts Section */}
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!isClient ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-8 h-8 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-muted-foreground animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    Initializing...
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Establishing secure connection with your wallet
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AccountRow
                  title="Personal Wallet"
                  subtitle="Your connected browser wallet"
                  address={stacksAddress}
                  icon={User}
                  iconBg="bg-primary/10"
                  iconColor="text-primary"
                  linkType="address"
                />
                {daoManagerWalletAddress && (
                  <>
                    <AccountRow
                      title="Agent Wallet"
                      subtitle="Automated governance account"
                      address={daoManagerWalletAddress}
                      icon={Wallet}
                      iconBg="bg-secondary/10"
                      iconColor="text-secondary"
                      linkType="address"
                    />
                    <AccountRow
                      title="Agent Account"
                      subtitle="Smart contract account for secure delegation"
                      address={
                        stacksAddress && daoManagerWalletAddress
                          ? `.aibtc-user-agent-account-${stacksAddress.slice(0, 5)}-${stacksAddress.slice(-5)}-${daoManagerWalletAddress.slice(0, 5)}-${daoManagerWalletAddress.slice(-5)}`
                          : null
                      }
                      explorerId={
                        stacksAddress && daoManagerWalletAddress
                          ? `.aibtc-user-agent-account-${stacksAddress.slice(0, 5)}-${stacksAddress.slice(-5)}-${daoManagerWalletAddress.slice(0, 5)}-${daoManagerWalletAddress.slice(-5)}`
                          : null
                      }
                      icon={Settings}
                      iconBg="bg-muted/20"
                      iconColor="text-muted-foreground"
                      linkType="tx"
                    />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primary Assets (STX and BTC) */}
        <PrimaryAssetsCard
          title="Primary Agent Assets"
          walletBalance={daoManagerWalletBalance}
          icon={Coins}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Token Holdings - Full Width Below */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-foreground">Token Holdings</h2>
        </div>

        <TokenHoldingsCard
          title="Other Assets & Collections"
          walletBalance={daoManagerWalletBalance}
          icon={DollarSign}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      <AgentPromptForm />
    </div>
  );
}
