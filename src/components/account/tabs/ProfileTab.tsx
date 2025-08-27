"use client";

import { useState, useEffect } from "react";
import { useWalletStore, WalletBalance } from "@/store/wallet";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { fetchDAOsWithExtension } from "@/services/dao.service";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "@/components/account/AccountCard";
import { TokenDepositModal } from "@/components/account/TokenDepositModal";
import { TokenWithdrawModal } from "@/components/account/TokenWithdrawModal";
import { AgentTokensTable } from "@/components/account/AgentTokensTable";
import { Wallet, Bot, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function formatBalance(value: string | number, type: "stx" | "btc" | "token") {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  if (type === "stx") {
    num = num / 1e6;
  } else if (type === "btc" || type === "token") {
    num = num / 1e8;
  }

  let decimals = 6;
  if (type === "btc" || type === "token") {
    decimals = 8;
  }

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    // Trim decimals properly for < 1
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

interface ProfileTabProps {
  agentAddress: string | null;
}

export function ProfileTab({ agentAddress }: ProfileTabProps) {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTokenForDeposit, setSelectedTokenForDeposit] = useState<{
    tokenId: string;
    tokenSymbol: string;
    daoName: string;
    contractPrincipal: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositRecipient, setDepositRecipient] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"agent" | "wallet" | null>(
    null
  );
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedTokenForWithdraw, setSelectedTokenForWithdraw] = useState<{
    tokenId: string;
    tokenSymbol: string;
    daoName: string;
    contractPrincipal: string;
    balance: string;
    decimals: number;
  } | null>(null);
  const { agentWallets, balances, fetchSingleBalance, fetchContractBalance } =
    useWalletStore();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentId = userAgent?.id || "";

  const { data: daos = [] } = useQuery({
    queryKey: ["daosWithExtensions"],
    queryFn: fetchDAOsWithExtension,
  });

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

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

    return { walletAddress: walletAddress ?? null, walletBalance };
  };

  const {
    walletAddress: userAgentWalletAddress,
    walletBalance: agentWalletBalance,
  } = getAgentWalletInfo(userAgentId);

  useEffect(() => {
    if (stacksAddress) {
      fetchSingleBalance(stacksAddress);
    }
    if (agentAddress) {
      fetchContractBalance(agentAddress);
    }
    if (userAgentWalletAddress) {
      fetchSingleBalance(userAgentWalletAddress);
    }
  }, [
    stacksAddress,
    agentAddress,
    userAgentWalletAddress,
    fetchSingleBalance,
    fetchContractBalance,
  ]);

  const connectedWalletBalance = stacksAddress ? balances[stacksAddress] : null;
  const agentAccountBalance = agentAddress ? balances[agentAddress] : null;

  const getAllBalances = (walletBalance: WalletBalance | null) => {
    if (!walletBalance) return undefined;

    const metadata: Record<string, string> = {};

    // Add STX balance
    if (walletBalance.stx?.balance) {
      metadata["STX"] =
        formatBalance(walletBalance.stx.balance, "stx") + " STX";
    }

    // Add all fungible tokens
    if (walletBalance.fungible_tokens) {
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const displaySymbol = isBtc ? "sBTC" : tokenSymbol || "Token";
          const balance = token.balance;

          if (balance && parseFloat(balance) > 0) {
            if (isBtc) {
              metadata[`${displaySymbol} `] =
                `${formatBalance(balance, "btc")} ${displaySymbol}`;
            } else {
              metadata[`${displaySymbol} `] =
                `${formatBalance(balance, "token")} ${displaySymbol}`;
            }
          }
        }
      );
    }

    // Add NFTs
    if (walletBalance.non_fungible_tokens) {
      Object.entries(walletBalance.non_fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const displaySymbol = tokenSymbol || "NFT";
          const count = token.count;

          if (count > 0) {
            metadata[`${displaySymbol} NFTs`] = `${count} ${displaySymbol}`;
          }
        }
      );
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  };

  const getLimitedBalances = (walletBalance: WalletBalance | null) => {
    if (!walletBalance) return undefined;

    const metadata: Record<string, string> = {};

    // Add STX balance
    if (walletBalance.stx?.balance) {
      metadata["STX"] =
        formatBalance(walletBalance.stx.balance, "stx") + " STX";
    }

    // Add only sBTC and fake tokens (limit to 3 total including STX)
    if (walletBalance.fungible_tokens) {
      let tokenCount = 1; // STX already added
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          if (tokenCount >= 3) return; // Limit to 3 tokens total

          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const isFakeToken =
            tokenId.includes("fake") ||
            tokenSymbol?.toLowerCase().includes("face");

          if (isBtc || isFakeToken) {
            const displaySymbol = isBtc ? "sBTC" : tokenSymbol || "Token";
            const balance = token.balance;

            if (balance && parseFloat(balance) > 0) {
              if (isBtc) {
                metadata[displaySymbol] =
                  `${formatBalance(balance, "btc")} ${displaySymbol}`;
              } else {
                metadata[displaySymbol] =
                  `${formatBalance(balance, "token")} ${displaySymbol}`;
              }
              tokenCount++;
            }
          }
        }
      );
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        {/* Connected Wallet Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Connected Wallet</h3>
          <p className="text-sm text-muted-foreground">
            Your login and primary funding source.
          </p>
          <div className="mt-4">
            <AccountCard
              title="Connected Wallet"
              address={stacksAddress}
              icon={Wallet}
              isPrimary={true}
              network={
                stacksAddress?.startsWith("SP") ||
                stacksAddress?.startsWith("SM")
                  ? "mainnet"
                  : "testnet"
              }
              metadata={getLimitedBalances(connectedWalletBalance)}
            />
          </div>

          {/* View All Assets Button */}
          {connectedWalletBalance && (
            <div className="mt-3 flex justify-end">
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    View All Assets
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg w-full max-h-[80vh] h-[600px]">
                  <DialogHeader>
                    <DialogTitle>All Wallet Assets</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {getAllBalances(connectedWalletBalance) &&
                        Object.entries(
                          getAllBalances(connectedWalletBalance)!
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center py-2 border-b"
                          >
                            <span className="font-medium">{key}</span>
                            <div className="text-muted-foreground">{value}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Agent Voting Account Section */}
        {agentAddress && (
          <div className="mb-6 border-t pt-6">
            <h3 className="text-lg font-semibold">Agent Voting Account</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Where your agent holds AI DAO tokens to power voting.
            </p>
            <div className="mt-4">
              <AccountCard
                title="Agent Account"
                address={agentAddress}
                icon={Building2}
                isPrimary={false}
                network={agentAddress?.startsWith("SP") ? "mainnet" : "testnet"}
                // metadata={getAllBalances(agentAccountBalance)}
              />
            </div>

            {/* DAO Tokens Management Table */}
            <div className="mt-6">
              <AgentTokensTable
                daos={daos}
                agentAddress={agentAddress}
                agentAccountBalance={agentAccountBalance}
                connectedWalletBalance={connectedWalletBalance}
                userAgentWalletAddress={userAgentWalletAddress}
              />
            </div>
          </div>
        )}

        {/* Agent Wallet Section */}
        {userAgentWalletAddress && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold">Agent Gas Wallet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Where your agent stores STX to cover gas fees for voting.
            </p>
            <div className="mt-4">
              <AccountCard
                title="Agent Wallet"
                address={userAgentWalletAddress}
                icon={Bot}
                isPrimary={false}
                network={
                  userAgentWalletAddress?.startsWith("SP")
                    ? "mainnet"
                    : "testnet"
                }
                metadata={getAllBalances(agentWalletBalance)}
              />
            </div>
          </div>
        )}

        {/* Token Deposit Modal */}
        {depositRecipient && depositType && selectedTokenForDeposit && (
          <TokenDepositModal
            isOpen={depositModalOpen}
            onClose={() => {
              setDepositModalOpen(false);
              setSelectedTokenForDeposit(null);
              setDepositRecipient(null);
              setDepositType(null);
            }}
            recipientAddress={depositRecipient}
            recipientType={depositType}
            tokenData={selectedTokenForDeposit}
          />
        )}

        {/* Token Withdraw Modal */}
        {agentAddress && selectedTokenForWithdraw && (
          <TokenWithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => {
              setWithdrawModalOpen(false);
              setSelectedTokenForWithdraw(null);
            }}
            agentAddress={agentAddress}
            tokenData={selectedTokenForWithdraw}
          />
        )}
      </div>
    </div>
  );
}
