"use client";

import { useState, useEffect } from "react";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "./AccountCard";
import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export function ConnectedWallet() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Connected Wallet</h2>
        <Button
          onClick={handleSignOut}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          Sign Out
        </Button>
      </div>
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
