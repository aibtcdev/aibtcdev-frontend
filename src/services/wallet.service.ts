import { supabase } from "./supabase";
import type { WalletBalance } from "@/store/wallet";
import { Wallet } from "@/types";

/**
 * Fetches wallets for a specific user
 *
 * Query key: ['wallets', userId]
 * @param userId - The user ID to fetch wallets for
 * @returns The wallets data with associated agents
 */
export async function fetchWallets(userId: string | null) {
  if (!userId) {
    return [];
  }

  try {
    const { data: walletsData, error: walletsError } = await supabase
      .from("wallets")
      .select("*, agent:agents(*)")
      .eq("profile_id", userId);

    if (walletsError) {
      throw walletsError;
    }

    return walletsData || [];
  } catch (error) {
    console.error("Error fetching wallets:", error);
    throw error;
  }
}

/**
 * Fetches balance for a single wallet address
 *
 * Query key: ['walletBalance', address]
 * @param address - The wallet address to fetch balance for
 * @returns The wallet balance data
 */
export async function fetchWalletBalance(
  address: string
): Promise<WalletBalance> {
  try {
    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
    const response = await fetch(
      `https://api.${network}.hiro.so/extended/v1/address/${address}/balances`,
      {
        // USING force-cache won't work on cloudflare deployment
        next: {
          revalidate: 1200, // Cache for 20 minutes (1200 seconds)
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch balance for ${address}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Fetches balances for multiple wallet addresses
 *
 * Query key: ['walletBalances', addresses]
 * @param addresses - Array of wallet addresses to fetch balances for
 * @returns Object mapping addresses to their balances
 */
export async function fetchWalletBalances(
  addresses: string[]
): Promise<Record<string, WalletBalance>> {
  try {
    const balancePromises = addresses.map(async (address) => {
      const balance = await fetchWalletBalance(address);
      return [address, balance] as [string, WalletBalance];
    });

    const results = await Promise.all(balancePromises);
    return Object.fromEntries(results);
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    throw error;
  }
}

/**
 * Gets wallet address based on network configuration
 * @param wallet - The wallet object
 * @returns The appropriate wallet address for the current network
 */
export function getWalletAddressFromNetwork(wallet: Wallet) {
  if (!wallet) return null;
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
    ? wallet.mainnet_address
    : wallet.testnet_address;
}
