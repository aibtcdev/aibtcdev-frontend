"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Settings, History } from "lucide-react";
import { ProfileTab } from "./tabs/ProfileTab";
import { AgentSettingsTab } from "./tabs/AgentSettingsTab";
import { ContributionHistoryTab } from "./tabs/ContributionHistoryTab";
import { WalletBalance } from "@/store/wallet";

interface AccountTabsProps {
  isClient: boolean;
  userAgentWalletAddress: string | null;
  userAgentAddress: string | null;
  userAgentContractBalance: WalletBalance | null;
  accessToken: string | null;
  userId: string | null;
  fetchWallets: (userId: string) => Promise<void>;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AccountTabs({
  userAgentAddress,
  initialTab = "wallets",
  onTabChange,
}: AccountTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update active tab when initialTab changes (from URL navigation)
  useEffect(() => {
    setActiveTab(initialTab);
    onTabChange?.(initialTab);
  }, [initialTab, onTabChange]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);

    // Create new URLSearchParams to preserve other query parameters
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set("tab", value);

    // Update URL without causing a page reload
    router.replace(`/account?${newSearchParams.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="">
        <TabsList className="grid w-full grid-cols-3 sticky-tabs border rounded-lg p-1">
          <TabsTrigger
            value="wallets"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className=" sm:inline">Wallets</span>
          </TabsTrigger>

          <TabsTrigger
            value="agent-settings"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4" />
            <span className=" sm:inline">Agent Settings</span>
          </TabsTrigger>

          <TabsTrigger
            value="earning-history"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <History className="h-4 w-4" />
            <span className=" sm:inline">Earning History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="py-6">
          <ProfileTab agentAddress={userAgentAddress} />
        </TabsContent>

        <TabsContent value="agent-settings" className="py-6">
          <AgentSettingsTab />
        </TabsContent>

        <TabsContent value="earning-history" className="py-6">
          <ContributionHistoryTab agentAddress={userAgentAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
