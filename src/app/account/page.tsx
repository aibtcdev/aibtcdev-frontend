"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchAgents } from "@/services/agent.service";
import { AccountTabs } from "@/components/account/AccountTabs";
import { Loader } from "@/components/reusables/Loader";

function AccountPageContent() {
  const { agentWallets, balances, fetchWallets, fetchContractBalance } =
    useWalletStore();
  const { userId, accessToken } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

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

  const getTabInfo = (tab: string) => {
    switch (tab) {
      case "agent-settings":
        return {
          title: "Agent Settings",
          description:
            "Configure your AI agent permissions and voting instructions for DAO operations.",
        };
      default:
        return {
          title: "Wallets",
          description:
            "View your connected wallet, agent account, and agent wallet information.",
        };
    }
  };

  const tabInfo = getTabInfo(activeTab);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{tabInfo.title}</h1>
        <p className="text-muted-foreground">{tabInfo.description}</p>
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
        onTabChange={setActiveTab}
      />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Wallets</h1>
            <p className="text-muted-foreground">
              View your connected wallet, agent account, and agent wallet
              information.
            </p>
          </div>
          <div className="flex justify-center items-center py-8">
            <Loader />
          </div>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
