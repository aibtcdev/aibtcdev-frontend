"use client";

import { useState, useEffect } from "react";
import { getStacksAddress } from "@/lib/address";
import { AccountCard } from "./AccountCard";
import { useWalletStore, WalletBalance, TokenBalance } from "@/store/wallet";
import { Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
// import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { request } from "@stacks/connect";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConnectedWalletProps {
  fetchWallets?: () => Promise<void>;
}

function formatBalance(value: string | number, type: "stx" | "btc" | "token") {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  if (type === "stx") {
    num = num / 1e6;
  } else if (type === "btc" || type === "token") {
    num = num / 1e8;
  }

  let decimals = 6;
  if (type === "btc" || type === "token") {
    decimals = 8;
  }

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

export function ConnectedWallet({ fetchWallets }: ConnectedWalletProps) {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentTxId, setCurrentTxId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { balances } = useWalletStore();

  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  // const router = useRouter();

  const {
    transactionStatus,
    transactionMessage,
    startMonitoring,
    stopMonitoring,
    reset,
  } = useTransactionVerification();

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  const connectedWalletBalance = stacksAddress
    ? balances[stacksAddress]
    : undefined;

  const getAllBalances = (balance?: WalletBalance) => {
    if (!balance) return undefined;

    const metadata: Record<string, string> = {};

    if (balance.stx?.balance) {
      metadata["STX"] = `${formatBalance(balance.stx.balance, "stx")} STX`;
    }

    if (balance.fungible_tokens) {
      Object.entries(balance.fungible_tokens).forEach(
        ([tokenId, tokenData]) => {
          // Extract clean token name - handle different formats
          let tokenName = tokenId;
          let tokenSymbol = tokenId;

          // If it contains "::", split by that first
          if (tokenId.includes("::")) {
            tokenName = tokenId.split("::")[1] || tokenId;
          } else if (tokenId.includes(".")) {
            // Otherwise split by "." and take the last part
            tokenName = tokenId.split(".").pop() || tokenId;
          }

          // Map specific tokens to their proper names and symbols
          if (tokenName === "sbtc-token") {
            tokenName = "sBTC";
            tokenSymbol = "sBTC";
          } else if (tokenName.includes("faktory")) {
            // Handle faktory tokens - extract the speed part
            const speedMatch = tokenName.match(/(fast|slow)\d+/);
            if (speedMatch) {
              tokenName = speedMatch[0].toUpperCase();
              tokenSymbol = speedMatch[0].toUpperCase();
            }
          } else {
            // For other tokens, use the extracted name as both name and symbol
            tokenSymbol = tokenName.toUpperCase();
          }

          metadata[tokenName] =
            `${formatBalance(tokenData.balance, "token")} ${tokenSymbol}`;
        }
      );
    }

    if (balance.non_fungible_tokens) {
      Object.entries(balance.non_fungible_tokens).forEach(
        ([nftId, nftData]) => {
          const nftName = nftId.split(".").pop() || nftId;
          metadata[nftName] = `${nftData.count} NFTs`;
        }
      );
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  };

  // const handleSignOut = async () => {
  //   await signOut();
  //   router.push("/");
  // };

  const handleRequestSBTC = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSBTC(true);
    reset();

    try {
      const txResponse = await request("stx_callContract", {
        contract:
          "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token" as `${string}.${string}`,
        functionName: "faucet",
        functionArgs: [],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
      });

      const txId = txResponse.txid || null;
      if (txId) {
        setCurrentTxId(txId);
        setShowStatusModal(true);
        await startMonitoring(txId);

        toast({
          title: "Transaction Submitted",
          description: "sBTC faucet transaction submitted",
          variant: "default",
        });
      } else {
        throw new Error("No transaction ID received");
      }
    } catch (error) {
      console.error("Failed to request testnet sBTC:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet sBTC from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSBTC(false);
    }
  };

  const handleCloseModal = () => {
    setShowStatusModal(false);
    stopMonitoring();

    if (transactionStatus === "success" && fetchWallets) {
      fetchWallets();
    }
  };

  const handleRetry = () => {
    setShowStatusModal(false);
    handleRequestSBTC();
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Connected Wallet
          </h2>
          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet" && (
              <Button
                onClick={handleRequestSBTC}
                disabled={isRequestingSBTC || !isAuthenticated}
                size="sm"
                variant="secondary"
                className="flex items-center gap-1.5 text-xs"
              >
                {isRequestingSBTC ? "Requesting..." : "Get testnet sBTC"}
              </Button>
            )}
            {/* <Button
              onClick={handleSignOut}
              variant="destructive"
              size="sm"
              className="text-sm font-medium"
            >
              Sign Out
            </Button> */}
          </div>
        </div>
        <AccountCard
          title="Connected Wallet"
          address={stacksAddress}
          icon={Wallet}
          isPrimary={true}
          network={
            stacksAddress?.startsWith("SP") || stacksAddress?.startsWith("SM")
              ? "mainnet"
              : "testnet"
          }
          helpText="Connected wallet through the browser"
          metadata={getAllBalances(connectedWalletBalance)}
        />

        {/* All Assets Modal */}
        {connectedWalletBalance && (
          <div className="mt-4">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  View All Assets
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>All Wallet Assets</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  {/* STX Balance */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">STX</h4>
                    <p className="text-sm text-muted-foreground">
                      Balance:{" "}
                      {formatBalance(
                        connectedWalletBalance.stx?.balance || "0",
                        "stx"
                      )}{" "}
                      STX
                    </p>
                  </div>

                  {/* Fungible Tokens */}
                  {Object.entries(
                    connectedWalletBalance.fungible_tokens || {}
                  ).map(([tokenId, tokenData]) => {
                    // Extract clean token name - handle different formats
                    let tokenName = tokenId;
                    let tokenSymbol = tokenId;

                    // If it contains "::", split by that first
                    if (tokenId.includes("::")) {
                      tokenName = tokenId.split("::")[1] || tokenId;
                    } else if (tokenId.includes(".")) {
                      // Otherwise split by "." and take the last part
                      tokenName = tokenId.split(".").pop() || tokenId;
                    }

                    // Map specific tokens to their proper names and symbols
                    if (tokenName === "sbtc-token") {
                      tokenName = "sBTC";
                      tokenSymbol = "sBTC";
                    } else if (tokenName.includes("faktory")) {
                      // Handle faktory tokens - extract the speed part
                      const speedMatch = tokenName.match(/(fast|slow)\d+/);
                      if (speedMatch) {
                        tokenName = speedMatch[0].toUpperCase();
                        tokenSymbol = speedMatch[0].toUpperCase();
                      }
                    } else {
                      // For other tokens, use the extracted name as both name and symbol
                      tokenSymbol = tokenName.toUpperCase();
                    }

                    return (
                      <div key={tokenId} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{tokenName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Balance:{" "}
                          {formatBalance(
                            (tokenData as TokenBalance).balance,
                            "token"
                          )}{" "}
                          {tokenSymbol}
                        </p>
                      </div>
                    );
                  })}

                  {/* Non-Fungible Tokens */}
                  {Object.entries(
                    connectedWalletBalance.non_fungible_tokens || {}
                  ).map(([nftId, nftData]) => (
                    <div key={nftId} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{nftId}</h4>
                      <p className="text-sm text-muted-foreground">
                        Count: {(nftData as { count: number }).count} NFTs
                      </p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <TransactionStatusModal
        isOpen={showStatusModal}
        onClose={handleCloseModal}
        txId={currentTxId}
        transactionStatus={transactionStatus}
        transactionMessage={transactionMessage}
        title="sBTC Faucet Transaction"
        successTitle="sBTC Received!"
        failureTitle="Faucet Request Failed"
        successDescription="Your testnet sBTC has been successfully received from the faucet."
        failureDescription="The sBTC faucet request could not be completed. Please try again."
        pendingDescription="Your sBTC faucet request is being processed on the blockchain. This may take a few minutes."
        onRetry={handleRetry}
        showRetryButton={true}
      />
    </>
  );
}
