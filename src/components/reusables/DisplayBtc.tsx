"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/store/wallet";
import { TokenBalance } from "./BalanceDisplay";

const DisplayBtc = () => {
  const { userId, isLoading: isSessionLoading } = useAuth();
  const { agentWallets, balances, fetchWallets, fetchSingleBalance } =
    useWalletStore();
  const [totalSbtc, setTotalSbtc] = useState<number>(0);

  useEffect(() => {
    // Ensure wallets are loaded for the current user
    if (userId) {
      fetchWallets(userId).catch(console.error);
    }
  }, [fetchWallets, userId]);

  useEffect(() => {
    const network =
      process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
        ? "mainnet"
        : "testnet";

    const updateBalances = async () => {
      let sum = 0;
      for (const wallet of agentWallets) {
        const address =
          network === "mainnet"
            ? wallet.mainnet_address
            : wallet.testnet_address;
        if (!address) continue;
        // Fetch balance if missing
        if (!balances[address]) {
          await fetchSingleBalance(address);
        }
        const tokenData = balances[address]?.fungible_tokens;
        if (tokenData) {
          const sbtcKey = Object.keys(tokenData).find((key) =>
            key.endsWith("::sbtc-token")
          );
          const balance = sbtcKey ? Number(tokenData[sbtcKey].balance) : 0;
          sum += balance;
        }
      }
      setTotalSbtc(sum);
    };

    updateBalances().catch(console.error);
  }, [agentWallets, balances, fetchSingleBalance]);

  if (isSessionLoading || !userId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Agent BTC:</span>
      <TokenBalance
        value={totalSbtc.toString()}
        symbol="sBTC"
        decimals={8}
        variant="abbreviated"
        showSymbol={false}
        className="font-medium"
      />
    </div>
  );
};

export default DisplayBtc;
