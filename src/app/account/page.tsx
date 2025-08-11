"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchAgents } from "@/services/agent.service";
import { AccountTabs } from "@/components/account/AccountTabs";

export default function AccountPage() {
  const { agentWallets, balances, fetchWallets, fetchContractBalance } =
    useWalletStore();
  const { userId, accessToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Get the tab parameter from URL, default to "profile"
  const initialTab = searchParams.get("tab") || "profile";

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentAddress = userAgent?.account_contract || null;
  const userAgentId = userAgent?.id || "";

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

  const { walletAddress: userAgentWalletAddress } =
    getAgentWalletInfo(userAgentId);

  useEffect(() => {
    if (userAgentAddress) {
      fetchContractBalance(userAgentAddress);
    }
  }, [userAgentAddress, fetchContractBalance]);

  const userAgentContractBalance = userAgentAddress
    ? balances[userAgentAddress]
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agent Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and agent account.
        </p>
      </div>
      <AccountTabs
        isClient={isClient}
        userAgentWalletAddress={userAgentWalletAddress}
        userAgentAddress={userAgentAddress}
        userAgentContractBalance={userAgentContractBalance}
        accessToken={accessToken}
        userId={userId}
        fetchWallets={fetchWallets}
        initialTab={initialTab}
      />
    </div>
  );
}
