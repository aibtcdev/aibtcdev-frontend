"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Settings } from "lucide-react";
import { ProfileTab } from "./tabs/ProfileTab";
import { AgentSettingsTab } from "./tabs/AgentSettingsTab";
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
  initialTab = "profile",
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
        <TabsList className="grid w-full grid-cols-2 sticky-tabs border rounded-lg p-1">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className=" sm:inline">Profile</span>
          </TabsTrigger>

          <TabsTrigger
            value="agent-settings"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4" />
            <span className=" sm:inline">Agent Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="py-6">
          <ProfileTab agentAddress={userAgentAddress} />
        </TabsContent>

        <TabsContent value="agent-settings" className="py-6">
          <AgentSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
