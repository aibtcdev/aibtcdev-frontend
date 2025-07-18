"use client";

import { useState, useEffect } from "react";
import { AccountTabs } from "@/components/account/AccountTabs";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
// import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function AccountPage() {
  const { agentWallets, balances, fetchWallets, fetchContractBalance } =
    useWalletStore();
  const { userId, accessToken } = useAuth();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // Fetch the user agent
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentAddress = userAgent?.account_contract || null;
  const userAgentId = userAgent?.id || "";

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

    return { walletAddress: walletAddress ?? null, walletBalance };
  };

  const { walletAddress: userAgentWalletAddress } =
    getAgentWalletInfo(userAgentId);

  // Fetch contract account balance when address is available
  useEffect(() => {
    if (userAgentAddress) {
      fetchContractBalance(userAgentAddress);
    }
  }, [userAgentAddress, fetchContractBalance]);

  const userAgentContractBalance = userAgentAddress
    ? balances[userAgentAddress]
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 ">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* <AccountSidebar
          agentAddress={userAgentAddress}
          xHandle={null}
        /> */}

        {/* Main panel */}
        <div className="flex-1">
          <AccountTabs
            isClient={isClient}
            userAgentWalletAddress={userAgentWalletAddress}
            userAgentAddress={userAgentAddress}
            userAgentContractBalance={userAgentContractBalance}
            accessToken={accessToken}
            userId={userId}
            fetchWallets={fetchWallets}
          />
        </div>
      </div>
    </div>
  );
}
