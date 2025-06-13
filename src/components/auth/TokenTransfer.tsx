"use client";
import { request } from "@stacks/connect";
import { uintCV, principalCV, noneCV } from "@stacks/transactions";
import { Button } from "@/components/ui/button";

interface TokenTransferProps {
  network: "mainnet" | "testnet";
  amount: number;
  recipient: string;
  contractAddress: string;
  contractName: string;
  buttonText?: string;
  onSuccess?: () => void;
}

export function TokenTransfer({
  network,
  amount,
  recipient,
  contractAddress,
  contractName,
  buttonText = "Transfer Tokens",
  onSuccess,
}: TokenTransferProps) {
  const transferToken = async () => {
    try {
      await request("stx_callContract", {
        contract: `${contractAddress}.${contractName}`,
        functionName: "transfer",
        functionArgs: [
          uintCV(amount),
          principalCV(recipient), // Note: sender will be automatically determined by wallet
          principalCV(recipient),
          noneCV(),
        ],
        network: network,
      });

      console.log("Transfer initiated successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error initiating transfer:", error);
    }
  };

  return (
    <Button onClick={transferToken} className="w-full md:w-auto">
      {buttonText}
    </Button>
  );
}
