"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Info,
  Wallet,
  XCircle,
  CheckCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { TokenBuyInput } from "@/components/aidaos/DaoBuy";
import type { ApiResponse } from "@/services/tool.service";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/store/wallet";
import { fetchDAOExtensions, fetchToken } from "@/services/dao.service";
import type { DAO, Token, Extension } from "@/types";
import { Button } from "@/components/ui/button";
import type { WalletBalance } from "@/store/wallet";
import AuthButton from "../home/AuthButton";
import {
  formatStxBalance,
  formatTokenBalance,
  satoshiToBTC,
} from "@/utils/format";
import { getWalletAddress } from "@/utils/wallet";

interface TokenPurchaseModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  presetAmount?: string;
}

type ParsedOutput = {
  success: boolean;
  message: string;
  data?: { link?: string };
};

export function TokenPurchaseModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  token,
  presetAmount = "",
}: TokenPurchaseModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const [currentAmount, setCurrentAmount] = useState(presetAmount);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const { accessToken } = useAuth();
  const { balances, userWallet } = useWalletStore();

  const { data: tokenData } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600_000,
    enabled: open && !token,
  });

  const tokenName = tokenData?.symbol || token?.symbol || "DAO";

  useEffect(() => {
    if (presetAmount) setCurrentAmount(presetAmount);
  }, [presetAmount]);

  const { data: daoExtensions, isLoading: isExtLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600_000,
    enabled: open,
  });

  const tokenDexExtension = daoExtensions?.find(
    (ext: Extension) => ext.type === "TOKEN" && ext.subtype === "DEX"
  );

  /* wallet & helpers */
  const agentWalletData = (() => {
    if (!userWallet) return null;
    const address = getWalletAddress(userWallet);
    if (!address) return null;
    return {
      address,
      walletBalance: balances[address] as WalletBalance | undefined,
    };
  })();

  const btcValue = satoshiToBTC(currentAmount);

  /* reset on close */
  useEffect(() => {
    if (!open) setApiResponse(null);
  }, [open]);

  /* ------ Pre-purchase screen ------ */
  const renderPurchaseScreen = () => (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 shadow-md bg-background">
        <h2 className="text-lg font-medium">Buy {tokenName} Tokens</h2>
      </div>

      {/* body */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-muted p-4 rounded-lg flex items-start mb-6">
          <Info className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0 text-primary" />
          <p>
            You will spend <strong>{btcValue} BTC</strong> to receive{" "}
            <strong>{tokenName}</strong>.
          </p>
        </div>

        {agentWalletData && agentWalletData.walletBalance && (
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-4 flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Available Balance
            </h3>

            <div className="space-y-3">
              {agentWalletData.walletBalance.stx && (
                <div className="flex justify-between items-center  pb-3">
                  <span>STX Balance</span>
                  <span className="font-medium">
                    {formatStxBalance(
                      agentWalletData.walletBalance.stx.balance
                    )}{" "}
                    STX
                  </span>
                </div>
              )}

              {agentWalletData.walletBalance.fungible_tokens &&
                Object.entries(
                  agentWalletData.walletBalance.fungible_tokens
                ).map(([tokenId, token], idx, arr) => (
                  <div
                    key={tokenId}
                    className={`flex justify-between items-center ${
                      idx !== arr.length - 1 ? "border-b pb-3" : ""
                    }`}
                  >
                    <span>{tokenId.split("::")[1]}</span>
                    <span className="font-medium">
                      {formatTokenBalance(token.balance)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div className="sticky bottom-0 w-full pb-safe shadow-lg bg-background border-t">
        {tokenDexExtension ? (
          <TokenBuyInput
            tokenName={tokenName}
            contractPrincipal={tokenDexExtension.contract_principal}
            initialAmount={currentAmount}
            onAmountChange={setCurrentAmount}
            onResult={setApiResponse}
          />
        ) : (
          <div className="p-6 text-center text-lg text-muted-foreground">
            Unavailable to buy tokens
          </div>
        )}
      </div>
    </div>
  );

  /* ------ Post-purchase modal ------ */
  const renderResultScreen = () => {
    if (!apiResponse) return null;

    const isSuccess = apiResponse.success;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 h-16 flex items-center justify-between px-6 shadow-md bg-background">
          <h2 className="text-lg font-medium">Transaction Result</h2>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="text-center mb-6">
            {isSuccess ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto  rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Purchase Successful!
                  </h3>
                  <p className="text-muted-foreground">
                    Your {tokenName} token purchase has been broadcast on-chain
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto  rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Transaction Failed
                  </h3>
                  <p className="text-red-600">
                    {(() => {
                      try {
                        const parsed = JSON.parse(
                          apiResponse.output || "{}"
                        ) as ParsedOutput;
                        return (
                          parsed.message ||
                          apiResponse.error ||
                          "Unknown error occurred"
                        );
                      } catch {
                        return apiResponse.error || "Unknown error occurred";
                      }
                    })()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          {isSuccess && (
            <div className="space-y-4">
              {(() => {
                try {
                  const parsed = JSON.parse(apiResponse.output) as ParsedOutput;
                  const txLink = parsed.data?.link;
                  return txLink ? (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Transaction Details
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          View your transaction on the blockchain:
                        </p>
                        <a
                          href={txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
                        >
                          View Transaction
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <p className="text-muted-foreground">
                        Transaction completed successfully. Check your wallet
                        for the new tokens.
                      </p>
                    </div>
                  );
                } catch {
                  return (
                    <div className="border rounded-lg p-4">
                      <p className="text-muted-foreground">
                        Transaction completed successfully. Check your wallet
                        for the new tokens.
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 ">
          <div className="flex gap-3 justify-end">
            {!isSuccess && (
              <Button
                variant="outline"
                onClick={() => setApiResponse(null)}
                className="flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button
              onClick={() => {
                setApiResponse(null);
                setOpen(false);
              }}
            >
              {isSuccess ? "Close" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* -- main render -- */
  const body = apiResponse ? (
    renderResultScreen()
  ) : isExtLoading ? (
    <div className="flex items-center justify-center h-full">
      <Loader />
      <span className="ml-3 text-lg">Loading…</span>
    </div>
  ) : !accessToken ? (
    <div className="flex items-center justify-center h-full p-6">
      <div className="text-center">
        <p className="text-lg mb-6">Please connect your wallet to buy tokens</p>
        <AuthButton />
      </div>
    </div>
  ) : (
    renderPurchaseScreen()
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] h-[500px] p-0 rounded-lg overflow-hidden">
        <DialogTitle className="sr-only">
          {apiResponse ? "Transaction Result" : `Buy ${tokenName} Tokens`}
        </DialogTitle>
        {body}
      </DialogContent>
    </Dialog>
  );
}
