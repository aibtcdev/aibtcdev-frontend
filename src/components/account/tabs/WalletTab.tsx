"use client";

import { AssetsDataTable } from "@/components/account/AssetsDataTable";
import { WalletBalance } from "@/store/wallet";
import { AccountCard } from "@/components/account/AccountCard";
import { Bot } from "lucide-react";
import { getStacksAddress } from "@/lib/address";

interface WalletTabProps {
  userAgentContractBalance: WalletBalance | null;
  agentAddress: string | null;
}

export function WalletTab({
  userAgentContractBalance,
  agentAddress,
}: WalletTabProps) {
  const userAddress = getStacksAddress();
  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        <div className="mt-6">
          <AssetsDataTable
            walletBalance={userAgentContractBalance}
            agentAccountId={agentAddress}
            userWalletAddress={userAddress}
          />
        </div>

        {agentAddress && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">
              Agent Contract Account
            </h3>
            <AccountCard
              title="Agent Account"
              subtitle="Smart contract for automated governance"
              address={agentAddress}
              icon={Bot}
              isPrimary={false}
              network={agentAddress?.startsWith("SP") ? "mainnet" : "testnet"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
