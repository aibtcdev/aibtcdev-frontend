"use client";

import { useState, useEffect } from "react";
import { Wallet, Activity } from "lucide-react";
import { AccountCard } from "../AccountCard";
import { getStacksAddress } from "@/lib/address";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";

export function OverviewTab() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const userAgentAddress = userAgent?.account_contract || null;

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  return (
    <div className=" gap-6">
      {/* Left Column: Account Cards */}
      <div className="">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Connected Accounts
          </h2>
          <div className="space-y-3">
            <AccountCard
              title="Primary Wallet"
              subtitle="Your main browser wallet"
              address={stacksAddress}
              icon={Wallet}
              isPrimary={true}
              network={stacksAddress?.startsWith("SP") ? "mainnet" : "testnet"}
            />

            {userAgentAddress && (
              <AccountCard
                title="Agent Account"
                subtitle="Smart contract for automated governance"
                address={userAgentAddress}
                icon={Activity}
                isPrimary={false}
                network={
                  userAgentAddress?.startsWith("SP") ? "mainnet" : "testnet"
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
