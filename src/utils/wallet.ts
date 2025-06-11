import type { Wallet } from "@/types";

/**
 * Gets the appropriate wallet address based on the current network configuration
 * @param wallet - The wallet object containing both mainnet and testnet addresses
 * @returns The wallet address for the current network, or empty string if wallet is null/undefined
 */
export function getWalletAddress(wallet: Wallet | null | undefined): string {
  if (!wallet) return "";

  return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
    ? wallet.mainnet_address
    : wallet.testnet_address;
}
