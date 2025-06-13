"use client";

import { useState, useEffect, memo } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Dynamically import TokenTransfer component to avoid SSR issues
const TokenTransfer = dynamic(
  () =>
    import("@/components/auth/TokenTransfer").then((mod) => mod.TokenTransfer),
  { ssr: false }
);

interface TransferModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agent: {
    id: string;
    name: string;
    tokenSymbol: string;
    dexPrincipal: string;
    contractPrincipal: string;
    walletAddress: string;
  } | null;
  onSuccess: () => void;
  onError: () => void;
}

/**
 * TransferTokenModal Component
 * Handles token transfer functionality with amount input and confirmation
 */
export const TransferTokenModal = memo(
  ({ isOpen, onOpenChange, agent, onSuccess }: TransferModalProps) => {
    const [amount, setAmount] = useState("");

    // Reset amount when modal closes
    useEffect(() => {
      if (!isOpen) {
        setAmount("");
      }
    }, [isOpen]);

    if (!agent) return null;

    // Extract contract details from dexPrincipal
    const { contractAddress, contractName } = (() => {
      const [address, name] = agent.dexPrincipal.split(".");
      const cleanedContractName = name.endsWith("-dex")
        ? name.slice(0, -4)
        : name;
      return { contractAddress: address, contractName: cleanedContractName };
    })();

    const amountInMicroTokens = Number(amount) * 1000000;

    const handleTransferSuccess = () => {
      // console.log({
      //   amount: amountInMicroTokens,
      //   contractName,
      //   tokenSymbol: agent.tokenSymbol,
      //   sender: contractAddress,
      //   receiver: agent.walletAddress,
      // });
      onSuccess();
    };

    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Tokens to {agent.name}</DialogTitle>
            <DialogDescription>
              Transfer {agent.tokenSymbol} tokens
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <TokenTransfer
              network={
                process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
                  ? "mainnet"
                  : "testnet"
              }
              amount={amountInMicroTokens}
              recipient={agent.walletAddress}
              contractAddress={contractAddress}
              contractName={contractName}
              buttonText="Transfer"
              onSuccess={handleTransferSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

TransferTokenModal.displayName = "TransferTokenModal";
