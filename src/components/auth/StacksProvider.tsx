"use client";

import React from "react";
import { connect, request } from "@stacks/connect";
import { getStacksAddress } from "@/lib/address";

interface ConnectWalletOptions {
  onCancel: () => void;
}

const validateNetworkAddress = (address: string): boolean => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";

  if (isMainnet) {
    // Mainnet addresses start with SP or SM
    return address.startsWith("SP") || address.startsWith("SM");
  } else {
    // Testnet addresses start with ST
    return address.startsWith("ST");
  }
};

export async function connectWallet({ onCancel }: ConnectWalletOptions) {
  try {
    // Clear any existing wallet session data to prevent JSON parse errors
    // when switching between different wallet providers (Leather/Xverse)
    try {
      localStorage.removeItem("blockstack-session");
      localStorage.removeItem("stacks-connect");
      localStorage.removeItem("@stacks/connect");
      localStorage.removeItem("STX_PROVIDER");
      // Clear any other stacks-related session data
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("stacks") ||
          key.startsWith("blockstack") ||
          key.startsWith("@stacks") ||
          key.startsWith("STX")
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Failed to clear wallet session data:", e);
    }

    const response = await connect();

    // After successful connection, validate the network
    const stxAddress = getStacksAddress();
    if (stxAddress && !validateNetworkAddress(stxAddress)) {
      const expectedNetwork =
        process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
          ? "mainnet"
          : "testnet";
      const currentNetwork = stxAddress.startsWith("ST")
        ? "testnet"
        : "mainnet";

      throw new Error(
        `Please switch your wallet to ${expectedNetwork.toUpperCase()} network. Currently connected to ${currentNetwork.toUpperCase()}.`
      );
    }

    return response;
  } catch (error) {
    onCancel();
    throw error;
  }
}

export async function requestSignature(): Promise<string> {
  try {
    const response = await request("stx_signMessage", {
      message: "Please sign the message to authenticate.",
    });

    // Return the signature, slicing to 72 characters as in the original code
    return response.signature.slice(0, 72);
  } catch (error) {
    throw new Error("Signature request cancelled" + error);
  }
}

interface StacksProviderProps {
  children?: React.ReactNode;
}

export default function StacksProvider({ children }: StacksProviderProps) {
  return <>{children}</>;
}
