"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletStore } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import Link from "next/link";
import type { WalletBalance } from "@/store/wallet";

const AssetTracker = () => {
  const { balances, agentWallets, fetchSingleBalance, fetchWallets } =
    useWalletStore();
  const { userId, isLoading: isSessionLoading } = useSessionStore();
  const [agentSbtcStatus, setAgentSbtcStatus] = useState<
    Record<string, boolean>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Function to find BTC token in fungible tokens
  const findSbtcToken = (
    fungibleTokens: WalletBalance["fungible_tokens"] | undefined
  ) => {
    if (!fungibleTokens) return false;

    const sbtcTokenKey = Object.keys(fungibleTokens).find((key) =>
      key.endsWith("::sbtc-token")
    );

    return !!sbtcTokenKey;
  };

  // Memoize fetchData to prevent unnecessary recreations
  const fetchData = useCallback(
    async (address: string) => {
      try {
        await fetchSingleBalance(address);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    },
    [fetchSingleBalance]
  );

  // Fetch wallets when component mounts
  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
      });
    }
  }, [userId, fetchWallets]);

  // Check agent wallets for BTC
  useEffect(() => {
    if (!userId || agentWallets.length === 0) return;

    const checkAgentWallets = async () => {
      const statusMap: Record<string, boolean> = {};
      const network =
        process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
          ? "mainnet"
          : "testnet";

      console.log("--- Agent Wallets Information ---");
      console.log(`Total agent wallets: ${agentWallets.length}`);

      // Process each agent wallet
      for (const wallet of agentWallets) {
        const mainnetAddress = wallet.mainnet_address;
        const testnetAddress = wallet.testnet_address;
        const address = network === "mainnet" ? mainnetAddress : testnetAddress;

        console.log(`\nAgent ID: ${wallet.agent_id}`);
        console.log(`Mainnet Address: ${mainnetAddress}`);
        console.log(`Testnet Address: ${testnetAddress}`);
        console.log(`Using Address (${network}): ${address}`);

        if (address) {
          // Fetch balance if not already in store
          if (!balances[address]) {
            console.log(`Fetching balance for address: ${address}`);
            await fetchData(address);
          }

          // Check if this agent wallet has BTC and log balance details
          if (balances[address]) {
            const hasSbtc = findSbtcToken(balances[address]?.fungible_tokens);
            statusMap[address] = hasSbtc;

            console.log(`Balance for ${address}:`);
            console.log(
              `STX Balance: ${balances[address]?.stx?.balance || "0"}`
            );

            // Log fungible tokens (including BTC if present)
            if (balances[address]?.fungible_tokens) {
              console.log("Fungible Tokens:");
              Object.entries(balances[address]?.fungible_tokens || {}).forEach(
                ([tokenId, tokenData]) => {
                  console.log(`  ${tokenId}: ${tokenData.balance}`);
                  if (tokenId.endsWith("::sbtc-token")) {
                    console.log(`  *** BTC FOUND: ${tokenData.balance} ***`);
                  }
                }
              );
            } else {
              console.log("No fungible tokens found");
            }

            console.log(`Has BTC: ${hasSbtc ? "YES" : "NO"}`);
          } else {
            console.log(`No balance data available for ${address}`);
            statusMap[address] = false;
          }
        } else {
          console.log(`No valid address found for this agent wallet`);
        }
      }

      console.log("\n--- Summary ---");
      console.log(
        "Agent wallets with BTC:",
        Object.entries(statusMap)
          .filter(([hasSbtc]) => hasSbtc)
          .map(([address]) => address)
      );

      setAgentSbtcStatus(statusMap);
      setIsLoaded(true);
    };

    checkAgentWallets();
  }, [userId, agentWallets, balances, fetchData]);

  // Return nothing if there's no user session or if session is still loading
  if (isSessionLoading) {
    return null;
  }

  if (!userId) {
    return null;
  }

  // Check if any agent wallet has BTC
  const hasAnySbtc = Object.values(agentSbtcStatus).some((status) => status);

  // Only render content if user is logged in
  return (
    <div className="w-full border-b border-border py-3 px-4 shadow-sm">
      {!isLoaded && (
        <p className="text-center text-foreground">
          Checking your agents&apos; BTC status...
        </p>
      )}

      {isLoaded && hasAnySbtc && (
        <p className="text-center text-primary font-medium">
          Your agent account has BTC! You can buy FACES and start sending
          proposals.
        </p>
      )}

      {isLoaded && !hasAnySbtc && agentWallets.length > 0 && (
        <p className="text-center text-primary">
          Your agent account does not have BTC.{" "}
          <Link href="/deposit" className="font-medium underline">
            Click here
          </Link>{" "}
          to make a deposit.
        </p>
      )}

      {isLoaded && agentWallets.length === 0 && (
        <p className="text-center text-primary">
          No agent wallets found. Create an agent to check for BTC.
        </p>
      )}
    </div>
  );
};

export default AssetTracker;
