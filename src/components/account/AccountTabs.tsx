"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Coins, Bot } from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { AssetsTab } from "./tabs/AssetsTab";
import { AgentTab } from "./tabs/AgentTab";
import { WalletBalance } from "@/store/wallet";

interface AccountTabsProps {
  isClient: boolean;
  userAgentWalletAddress: string | null;
  userAgentAddress: string | null;
  userAgentContractBalance: WalletBalance | null;
  accessToken: string | null;
  userId: string | null;
  fetchWallets: (userId: string) => Promise<void>;
}

export function AccountTabs({
  userAgentContractBalance,
  accessToken,
  userId,
  fetchWallets,
}: AccountTabsProps) {
  return (
    <div className="max-w-7xl mx-auto">
      <Tabs defaultValue="overview" className="">
        <TabsList className="flex justify-center sm:justify-end gap-2 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className=" sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            <span className=" sm:inline">Assets</span>
          </TabsTrigger>
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className=" sm:inline">Agent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <AssetsTab
            userAgentContractBalance={userAgentContractBalance}
            accessToken={accessToken}
            userId={userId}
            fetchWallets={fetchWallets}
          />
        </TabsContent>

        <TabsContent value="agent" className="space-y-6">
          <AgentTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
