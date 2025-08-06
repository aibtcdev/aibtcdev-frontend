"use client";

import { useState, useEffect } from "react";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "./AccountCard";
import { Wallet } from "lucide-react";

export function ConnectedWallet() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        Connected Wallet
      </h2>
      <AccountCard
        title="Primary Wallet"
        subtitle="Your main browser wallet"
        address={stacksAddress}
        icon={Wallet}
        isPrimary={true}
        network={stacksAddress?.startsWith("SP") ? "mainnet" : "testnet"}
      />
    </div>
  );
}
