"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info, Loader2, Wallet } from "lucide-react";
import { TokenBuyInput } from "./dao-buy-input";
import AgentWalletSelector from "@/components/chat/agent-selector";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { useWalletStore } from "@/store/wallet";
import { fetchDAOExtensions, fetchToken } from "@/queries/dao-queries";
import type { DAO, Token, Extension } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import type { WalletBalance, WalletWithAgent } from "@/store/wallet";
import AuthButton from "../home/auth-button";

interface DAOChatModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  presetAmount?: string;
}

export function DAOBuyModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  token,
  presetAmount = "",
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(presetAmount);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const {
    isLoading: isChatLoading,
    isConnected,
    selectedAgentId,
    setSelectedAgent,
    connect,
  } = useChatStore();

  const { accessToken } = useSessionStore();
  const { balances, userWallet, agentWallets } = useWalletStore();

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600000,
    enabled: open && !token,
  });

  // Add this line near the beginning of the component, after the variable declarations
  const tokenName = tokenData?.symbol || token?.symbol || "DAO";

  useEffect(() => {
    // Update current amount when presetAmount changes
    if (presetAmount) {
      setCurrentAmount(presetAmount);
    }
  }, [presetAmount]);

  const { data: daoExtensions, isLoading: isExtensionsLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000,
    enabled: open,
  });

  const memoizedConnect = useCallback(
    (token: string) => {
      if (!isConnected && token) {
        console.log("Attempting to connect...");
        connect(token);
      }
    },
    [connect, isConnected]
  );

  useEffect(() => {
    if (!accessToken || !open) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        memoizedConnect(accessToken);
      }
    };

    memoizedConnect(accessToken);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accessToken, memoizedConnect, isConnected, open]);

  const handleAmountChange = (newAmount: string) => {
    setCurrentAmount(newAmount);
  };

  const handleSendMessage = () => {
    setPurchaseSuccess(true);
    // Don't close the modal immediately, let the user see the success state
  };

  // Format the balance from microSTX to STX with 6 decimal places
  const formatBalance = (balance: string) => {
    if (!balance) return "0.000000";
    return (Number(balance) / 1_000_000).toFixed(6);
  };

  // Convert satoshis to BTC
  const satoshiToBTC = (satoshis: string) => {
    if (!satoshis || isNaN(Number(satoshis))) return "0.00000000";
    return (Number(satoshis) / 100000000).toFixed(8);
  };

  // Get the current agent's wallet and balance
  const getCurrentAgentWallet = () => {
    if (!selectedAgentId && !userWallet) return null;

    const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";

    if (!selectedAgentId) {
      // User wallet selected
      if (!userWallet) return null;

      const address = isMainnet
        ? userWallet.mainnet_address
        : userWallet.testnet_address;
      if (!address) return null;

      return {
        address,
        walletBalance: balances[address] as WalletBalance | undefined,
      };
    } else {
      // Agent wallet selected
      const agentWallet = agentWallets.find(
        (w) => w.agent_id === selectedAgentId
      ) as WalletWithAgent | undefined;
      if (!agentWallet) return null;

      const address = isMainnet
        ? agentWallet.mainnet_address
        : agentWallet.testnet_address;
      if (!address) return null;

      return {
        address,
        walletBalance: balances[address] as WalletBalance | undefined,
      };
    }
  };

  const agentWalletData = getCurrentAgentWallet();
  const btcValue = satoshiToBTC(currentAmount);

  const renderBuySection = () => {
    if (purchaseSuccess) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Transaction Successful!</h3>
          <p className="text-muted-foreground mb-6">
            The agent will receive {currentAmount} {tokenName} shortly.
          </p>
          <Button
            onClick={() => {
              setPurchaseSuccess(false);
              setOpen(false);
            }}
            className="w-full max-w-xs"
          >
            Close
          </Button>
        </div>
      );
    }

    if (!accessToken) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <p className="text-lg mb-6">
              Please connect your wallet to buy tokens
            </p>
            <AuthButton />
          </div>
        </div>
      );
    }

    if (isExtensionsLoading || isTokenLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="ml-3 text-lg">Loading...</span>
        </div>
      );
    }

    const tokenDexExtension = daoExtensions?.find(
      (ext: Extension) => ext.type === "TOKEN_DEX"
    );
    // Using the component-level tokenName variable

    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AgentWalletSelector
              selectedAgentId={selectedAgentId}
              onSelect={setSelectedAgent}
              disabled={isChatLoading || !isConnected}
            />
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-muted p-4 rounded-lg flex items-start mb-6">
            <Info className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0 text-primary" />
            <div className="text-base">
              <p>
                The selected agent will receive{" "}
                <strong>{tokenName} tokens</strong> worth:
              </p>
              <div className="flex items-center mt-3">
                <div className="text-muted-foreground text-base text-orange-500">
                  <strong>{btcValue} BTC</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Wallet Balance Display - Simplified */}
          {agentWalletData && agentWalletData.walletBalance && (
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Available Balance
              </h3>

              <div className="space-y-3">
                {/* STX Balance */}
                {agentWalletData.walletBalance.stx && (
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-base">STX Balance</span>
                    <span className="font-medium text-base">
                      {formatBalance(agentWalletData.walletBalance.stx.balance)}{" "}
                      STX
                    </span>
                  </div>
                )}

                {/* Fungible tokens - simplified display */}
                {agentWalletData.walletBalance.fungible_tokens &&
                  Object.entries(
                    agentWalletData.walletBalance.fungible_tokens
                  ).map(([tokenId, token], index, arr) => {
                    const tokenSymbol = tokenId.split("::")[1] || "Token";
                    const isLast = index === arr.length - 1;
                    return (
                      <div
                        key={tokenId}
                        className={`flex justify-between items-center ${
                          !isLast ? "border-b pb-3" : ""
                        }`}
                      >
                        <span className="text-base">{tokenSymbol}</span>
                        <span className="font-medium text-base">
                          {formatBalance(token.balance)}
                        </span>
                      </div>
                    );
                  })}

                {/* Show message if no tokens found */}
                {(!agentWalletData.walletBalance.stx ||
                  Object.keys(
                    agentWalletData.walletBalance.fungible_tokens || {}
                  ).length === 0) && (
                  <div className="text-center py-2 text-base text-muted-foreground">
                    No tokens found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 w-full min-w-0 pb-safe shadow-lg z-20 bg-background border-t">
          {tokenDexExtension ? (
            <TokenBuyInput
              tokenName={tokenName}
              contractPrincipal={tokenDexExtension.contract_principal}
              disabled={isChatLoading || !isConnected}
              onSend={handleSendMessage}
              initialAmount={currentAmount}
              onAmountChange={handleAmountChange}
            />
          ) : (
            <div className="p-6 text-center text-lg text-muted-foreground">
              Unavailable to buy tokens
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!open) {
      setPurchaseSuccess(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] h-[650px] p-0 rounded-lg">
        <DialogTitle className="sr-only">Buy {tokenName} Tokens</DialogTitle>
        <DialogDescription className="sr-only">
          Purchase {tokenName} tokens with sBtc through your selected agent
        </DialogDescription>
        <div className="h-full overflow-hidden">{renderBuySection()}</div>
      </DialogContent>
    </Dialog>
  );
}
