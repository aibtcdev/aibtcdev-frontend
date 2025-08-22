"use client";

import { useState, useEffect } from "react";
import { request } from "@stacks/connect";
import { uintCV, principalCV, noneCV, Pc } from "@stacks/transactions";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from "lucide-react";

interface TokenData {
  tokenId: string;
  tokenSymbol: string;
  daoName: string;
  contractPrincipal: string;
  balance: string;
  decimals: number;
}

interface TokenDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientAddress: string;
  recipientType: "agent" | "wallet";
  tokenData: TokenData | null;
}

function formatBalance(value: string | number, decimals: number = 8) {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  num = num / Math.pow(10, decimals);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

export function TokenDepositModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientType,
  tokenData,
}: TokenDepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);

  const { balances } = useWalletStore();

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  // Reset amount when modal opens/closes or token changes
  useEffect(() => {
    if (!isOpen) {
      setAmount("");
    }
  }, [isOpen, tokenData]);

  const handleTransfer = async () => {
    if (!tokenData || !amount || !stacksAddress) return;

    setIsTransferring(true);

    try {
      const amountInMicroTokens = Math.floor(
        parseFloat(amount) * Math.pow(10, tokenData.decimals)
      );

      // Create post condition to ensure the exact amount is transferred
      const tokenKey = Object.keys(
        balances[stacksAddress].fungible_tokens
      ).find((key) => key.startsWith(tokenData.contractPrincipal));

      let tokenName = "";
      if (tokenKey && tokenKey.includes("::")) {
        tokenName = tokenKey.split("::")[1];
      }

      const postCondition = Pc.principal(stacksAddress)
        .willSendEq(amountInMicroTokens)
        .ft(tokenData.contractPrincipal as `${string}.${string}`, tokenName);

      const [contractAddress, contractName] =
        tokenData.contractPrincipal.split(".");

      await request("stx_callContract", {
        contract: `${contractAddress}.${contractName}`,
        functionName: "transfer",
        functionArgs: [
          uintCV(amountInMicroTokens),
          principalCV(stacksAddress),
          principalCV(recipientAddress),
          noneCV(),
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
        postConditions: [postCondition],
        postConditionMode: "deny",
      });

      console.log("Token deposit initiated successfully");
      onClose();
      setAmount("");
    } catch (error) {
      console.error("Error initiating token deposit:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleMaxAmount = () => {
    if (tokenData) {
      const maxAmount =
        parseFloat(tokenData.balance) / Math.pow(10, tokenData.decimals);
      setAmount(maxAmount.toString());
    }
  };

  const isValidAmount = () => {
    if (!tokenData || !amount) return false;
    const amountNum = parseFloat(amount);
    const maxAmount =
      parseFloat(tokenData.balance) / Math.pow(10, tokenData.decimals);
    return amountNum > 0 && amountNum <= maxAmount;
  };

  if (!tokenData) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Deposit {tokenData.daoName} to{" "}
            {recipientType === "agent" ? "Agent Account" : "Agent Wallet"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {tokenData.daoName}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                Available:{" "}
                {formatBalance(tokenData.balance, tokenData.decimals)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="any"
                  min="0"
                  max={
                    parseFloat(tokenData.balance) /
                    Math.pow(10, tokenData.decimals)
                  }
                />
                <Button variant="outline" onClick={handleMaxAmount} size="sm">
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-mono text-xs">{recipientAddress}</span>
            </div>
          </div>

          {/* Transfer Button */}
          <Button
            onClick={handleTransfer}
            disabled={!isValidAmount() || isTransferring}
            className="w-full"
          >
            {isTransferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Depositing...
              </>
            ) : (
              `Deposit ${amount || "0"} ${tokenData.tokenSymbol}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
