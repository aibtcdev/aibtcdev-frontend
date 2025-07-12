"use client";

import React from "react";
import { connect, request } from "@stacks/connect";

interface ConnectWalletOptions {
  onCancel: () => void;
}

export async function connectWallet({ onCancel }: ConnectWalletOptions) {
  try {
    const response = await connect();
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
