"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { fetchAgents } from "@/services/agent.service";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountTabs } from "@/components/account/AccountTabs";
import { AssetsDataTable } from "@/components/account/AssetsDataTable";
import { Button } from "@/components/ui/button";
import { fundTestnetSBTC, fundTestnetSTX } from "@/services/tool.service";

export default function AccountPage() {
  const { agentWallets, balances, fetchWallets, fetchContractBalance } =
    useWalletStore();
  const { userId, accessToken } = useAuth();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [isRequestingSTX, setIsRequestingSTX] = useState(false);

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

  const handleRequestToken = async (type: "sbtc" | "stx") => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const isSTX = type === "stx";
    const setter = isSTX ? setIsRequestingSTX : setIsRequestingSBTC;
    const service = isSTX ? fundTestnetSTX : fundTestnetSBTC;

    setter(true);
    try {
      const result = await service(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: `Testnet ${isSTX ? "STX" : "sBTC"} requested successfully`,
        });
        if (userId) fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description:
            result.error ||
            `Failed to request testnet ${isSTX ? "STX" : "sBTC"}`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: `Failed to request testnet ${isSTX ? "STX" : "sBTC"}`,
        variant: "destructive",
      });
    } finally {
      setter(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 ">
      <div className="flex flex-col-reverse items-center lg:items-start lg:flex-row gap-8">
        <AccountSidebar
          agentAddress={userAgentAddress}
          xHandle={null /* TODO: plug your data */}
        />

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

          <div className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Asset Portfolio
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your tokens and balances
                </p>
              </div>
            </div>

            <div className="mt-6">
              <AssetsDataTable walletBalance={userAgentContractBalance} />
            </div>

            {process.env.NEXT_PUBLIC_STACKS_NETWORK !== "mainnet" && (
              <div className="border-t border-border pt-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Need test tokens?
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestToken("sbtc")}
                      disabled={isRequestingSBTC || !accessToken}
                    >
                      {isRequestingSBTC ? "Requesting..." : "Get sBTC"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestToken("stx")}
                      disabled={isRequestingSTX || !accessToken}
                    >
                      {isRequestingSTX ? "Requesting..." : "Get STX"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
