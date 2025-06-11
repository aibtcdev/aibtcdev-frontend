"use client";

import { useState, useEffect, useCallback } from "react";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import type { WalletBalance } from "@/store/wallet";

const AssetTracker = () => {
  const { balances, agentWallets, fetchSingleBalance, fetchWallets } =
    useWalletStore();
  const { userId, isLoading: isSessionLoading } = useAuth();
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
    <div className="w-full max-w-2xl mx-auto my-4 bg-[#2A2A2A] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-zinc-800 p-4 flex items-center gap-3">
      {/* Status Icon */}
      <span className="flex-shrink-0">
        {!isLoaded ? (
          // Spinner
          <svg
            className="animate-spin h-6 w-6 text-zinc-400"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : hasAnySbtc ? (
          // Bitcoin icon (replace with your icon set)
          <svg
            className="h-6 w-6 text-[#FF6B00]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#FF6B00"
              strokeWidth="2"
              fill="#232323"
            />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="10"
              fill="#FF6B00"
              fontWeight="bold"
            >
              ₿
            </text>
          </svg>
        ) : agentWallets.length > 0 ? (
          // Wallet icon (replace with your icon set)
          <svg
            className="h-6 w-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <rect
              x="3"
              y="7"
              width="18"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="#232323"
            />
            <circle cx="17" cy="12" r="1" fill="#FF6B00" />
          </svg>
        ) : (
          // Alert icon for no wallets
          <svg
            className="h-6 w-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="#232323"
            />
            <path
              d="M12 8v4m0 4h.01"
              stroke="#FF6B00"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      <div className="flex-1">
        {!isLoaded && (
          <span className="text-zinc-400 text-sm">
            Checking your agents BTC status...
          </span>
        )}
        {isLoaded && hasAnySbtc && (
          <span className="text-[#FF6B00] font-medium text-sm">
            Your agent account has BTC! You can buy FACES and start sending
            proposals.
          </span>
        )}
        {isLoaded && !hasAnySbtc && agentWallets.length > 0 && (
          <span className="text-zinc-400 text-sm flex items-center gap-2">
            Your agent account does not have BTC.
            <Link href="/deposit" legacyBehavior>
              <a className="ml-2 px-3 py-1 rounded bg-[#FF6B00] text-white text-xs font-semibold hover:bg-[#FF8533] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2">
                Deposit BTC
              </a>
            </Link>
          </span>
        )}
        {isLoaded && agentWallets.length === 0 && (
          <span className="text-zinc-400 text-sm">
            No agent wallets found.{" "}
            <Link href="/agents/new" className="underline text-[#FF6B00]">
              Create an agent
            </Link>{" "}
            to check for BTC.
          </span>
        )}
      </div>
    </div>
  );
};

export default AssetTracker;
