"use client";
export const runtime = "edge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Copy,
  Check,
  User,
  Wallet,
  Coins,
  Settings,
} from "lucide-react";
import { getStacksAddress } from "@/lib/address";
import { getExplorerLink } from "@/utils/format";
import { useClipboard } from "@/hooks/useClipboard";
import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { AgentPromptForm } from "@/components/account/AgentPromptForm";
import { fundTestnetSBTC, fundTestnetSTX } from "@/services/tool.service";
import {
  StxBalance,
  BtcBalance,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";
import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
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

// Balance summary card
function BalanceSummaryCard({
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
  // Calculate total value (simplified - in a real app you'd use market prices)
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
    <Card className="bg-card border border-border ">
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
        {!walletBalance ? (
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
        ) : (
          <div className="space-y-4">
            {/* Quick Summary */}
            <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
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
                  {/* STX Balance */}
                  {walletBalance.stx && (
                    <TableRow className="border-border hover:bg-muted/5">
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
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
                                <div className="w-2 h-2 rounded-full bg-secondary" />
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
                                <div className="w-2 h-2 rounded-full bg-accent" />
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

            {/* Detailed Assets - Mobile Cards */}
            <div className="md:hidden space-y-2">
              {walletBalance.stx && (
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
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
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-secondary" />
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
                        className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-accent" />
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

export default function AccountPage() {
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId, accessToken } = useAuth();
  const { toast } = useToast();
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [isRequestingSTX, setIsRequestingSTX] = useState(false);

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

  // Handler for requesting testnet sBTC
  const handleRequestSBTC = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSBTC(true);
    try {
      const result = await fundTestnetSBTC(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: "Testnet sBTC requested successfully",
          variant: "default",
        });
        // Refresh wallet balances
        fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request testnet sBTC",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request testnet sBTC:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet sBTC from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSBTC(false);
    }
  };

  // Handler for requesting testnet STX
  const handleRequestSTX = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSTX(true);
    try {
      const result = await fundTestnetSTX(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: "Testnet STX requested successfully",
          variant: "default",
        });
        // Refresh wallet balances
        fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request testnet STX",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request testnet STX:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet STX from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSTX(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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

      {/* Testnet Faucet Section - Only show on testnet */}
      {process.env.NEXT_PUBLIC_STACKS_NETWORK !== "mainnet" && (
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Coins className="h-4 w-4 text-accent" />
              </div>
              Testnet Faucet
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get free testnet tokens for development and testing purposes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRequestSBTC}
                  disabled={isRequestingSBTC || !accessToken}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20 rounded-lg hover:bg-secondary/20 hover:scale-105 focus:ring-2 ring-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 motion-reduce:transition-none"
                >
                  {isRequestingSBTC ? (
                    <>
                      <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Request Testnet sBTC
                    </>
                  )}
                </button>

                <button
                  onClick={handleRequestSTX}
                  disabled={isRequestingSTX || !accessToken}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 hover:scale-105 focus:ring-2 ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 motion-reduce:transition-none"
                >
                  {isRequestingSTX ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Request Testnet STX
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg">
                <p className="font-medium mb-1">Note:</p>
                <p>
                  Testnet tokens have no real value and are only for development
                  purposes. Faucet requests may have rate limits applied.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Balances Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">
            Account Balances
          </h2>
        </div>

        <div className="grid gap-6">
          <BalanceSummaryCard
            title="Agent Wallet"
            walletBalance={daoManagerWalletBalance}
            icon={Wallet}
            iconBg="bg-secondary/10"
            iconColor="text-secondary"
          />
        </div>
      </div>

      <AgentPromptForm />
    </div>
  );
}
