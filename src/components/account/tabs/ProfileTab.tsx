"use client";

import { useState, useEffect } from "react";
import { useWalletStore } from "@/store/wallet";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "@/components/account/AccountCard";
import { Wallet, Bot, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileTabProps {
  agentAddress: string | null;
}

export function ProfileTab({ agentAddress }: ProfileTabProps) {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { agentWallets, balances, fetchSingleBalance, fetchContractBalance } =
    useWalletStore();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentId = userAgent?.id || "";

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

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return (num / 1000000).toFixed(6);
  };

  const getAllBalances = (walletBalance: any) => {
    if (!walletBalance) return undefined;

    const metadata: Record<string, string> = {};

    // Add STX balance
    if (walletBalance.stx?.balance) {
      metadata["STX"] = `${formatBalance(walletBalance.stx.balance)} STX`;
    }

    // Add all fungible tokens
    if (walletBalance.fungible_tokens) {
      Object.entries(walletBalance.fungible_tokens).forEach(
        ([tokenId, token]) => {
          const [, tokenSymbol] = tokenId.split("::");
          const isBtc = tokenId.includes("sbtc-token");
          const displaySymbol = isBtc ? "sBTC" : tokenSymbol || "Token";
          const balance = (token as any).balance;

          if (balance && parseFloat(balance) > 0) {
            metadata[`${displaySymbol} `] =
              `${formatBalance(balance)} ${displaySymbol}`;
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
          const count = (token as any).count;

          if (count > 0) {
            metadata[`${displaySymbol} NFTs`] = `${count} ${displaySymbol}`;
          }
        }
      );
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  };

  const getLimitedBalances = (walletBalance: any) => {
    if (!walletBalance) return undefined;

    const metadata: Record<string, string> = {};

    // Add STX balance
    if (walletBalance.stx?.balance) {
      metadata["STX"] = `${formatBalance(walletBalance.stx.balance)} STX`;
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
            const balance = (token as any).balance;

            if (balance && parseFloat(balance) > 0) {
              metadata[displaySymbol] =
                `${formatBalance(balance)} ${displaySymbol}`;
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
          <h3 className="text-lg font-semibold mb-4">Connected Wallet</h3>
          <AccountCard
            title="Connected Wallet"
            subtitle="Connected wallet through the browser"
            address={stacksAddress}
            icon={Wallet}
            isPrimary={true}
            network={stacksAddress?.startsWith("SP") ? "mainnet" : "testnet"}
            metadata={getLimitedBalances(connectedWalletBalance)}
          />

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
                            <span className="text-muted-foreground">
                              {value}
                            </span>
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
          <div className="mb-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Agent Voting Account</h3>
            <AccountCard
              title="Agent Account"
              subtitle="Smart contract between you and the agent"
              address={agentAddress}
              icon={Building2}
              isPrimary={false}
              network={agentAddress?.startsWith("SP") ? "mainnet" : "testnet"}
              metadata={getAllBalances(agentAccountBalance)}
            />
          </div>
        )}

        {/* Agent Wallet Section */}
        {userAgentWalletAddress && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Agent Wallet</h3>
            <AccountCard
              title="Agent Wallet"
              subtitle="Agent wallet used for autonomous operations"
              address={userAgentWalletAddress}
              icon={Bot}
              isPrimary={false}
              network={
                userAgentWalletAddress?.startsWith("SP") ? "mainnet" : "testnet"
              }
              metadata={getAllBalances(agentWalletBalance)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
