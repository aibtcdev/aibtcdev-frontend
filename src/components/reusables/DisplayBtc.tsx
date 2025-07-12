"use client";

import { useEffect, useState } from "react";
import { FaBitcoin } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/store/wallet";

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

  // Format the balance to show like "21.70"
  const formatBalance = (balance: number) => {
    const btcValue = balance / 100000000; // Convert from satoshis to BTC
    return btcValue.toFixed(2);
  };

  return (
    <div className="flex items-center gap-2 animate-pulse-slow justify-center">
      <FaBitcoin className="h-8 w-8 text-primary" />
      <span className="font-inter font-bold tracking-tight text-lg text-primary">
        {formatBalance(totalSbtc)}
      </span>
    </div>
  );
};

export default DisplayBtc;
