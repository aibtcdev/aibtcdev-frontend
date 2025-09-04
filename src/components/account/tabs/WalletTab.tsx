"use client";

import { AssetsDataTable } from "@/components/account/AssetsDataTable";
import { WalletBalance } from "@/store/wallet";
import { AccountCard } from "@/components/account/AccountCard";
import { Bot } from "lucide-react";

interface WalletTabProps {
  userAgentContractBalance: WalletBalance | null;
  agentAddress: string | null;
}

export function WalletTab({
  userAgentContractBalance,
  agentAddress,
}: WalletTabProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        {/* Assets Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Your Assets</h3>
          <div className="w-full">
            <AssetsDataTable walletBalance={userAgentContractBalance} />
          </div>
        </div>

        {/* Agent Account Section */}
        {agentAddress && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Agent Contract Account
            </h3>
            <div className="w-full">
              <AccountCard
                title="Agent Account"
                address={agentAddress}
                icon={Bot}
                isPrimary={false}
                network={agentAddress?.startsWith("SP") ? "mainnet" : "testnet"}
                helpText="Smart contract between you and the agent for autonomous operations"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
