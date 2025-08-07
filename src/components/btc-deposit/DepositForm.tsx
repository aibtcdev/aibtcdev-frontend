"use client";

import { useState, type ChangeEvent, useEffect, useCallback } from "react";
import { getBitcoinAddress } from "@/lib/address";
import { useAgentAccount } from "@/hooks/useAgentAccount";
import { styxSDK } from "@faktoryfun/styx-sdk";
import type {
  FeeEstimates,
  PoolStatus,
  TransactionPrepareParams,
  TransactionPriority,
  UTXO,
} from "@faktoryfun/styx-sdk";
import { MIN_DEPOSIT_SATS, MAX_DEPOSIT_SATS } from "@faktoryfun/styx-sdk";
import { useToast } from "@/hooks/useToast";
// import { Bitcoin } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import AuthButton from "@/components/home/AuthButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { cvToHex, uintCV, hexToCV, cvToJSON } from "@stacks/transactions";

interface DepositFormProps {
  btcUsdPrice: number | null;
  poolStatus: PoolStatus | null;
  setConfirmationData: (data: ConfirmationData) => void;
  setShowConfirmation: (show: boolean) => void;
  activeWalletProvider: "leather" | "xverse" | null;
  dexContract: string;
  daoName: string;
  userAddress: string | null;
}

interface HiroGetInResponse {
  result?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ConfirmationData {
  depositAmount: string;
  userInputAmount: string;
  depositAddress: string;
  stxAddress: string;
  opReturnHex: string;
  isBlaze?: boolean;
}

export default function DepositForm({
  btcUsdPrice,
  poolStatus,
  setConfirmationData,
  setShowConfirmation,
  activeWalletProvider,
  dexContract,
  daoName,
}: DepositFormProps) {
  const [amount, setAmount] = useState<string>("0.0001");
  const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const { toast } = useToast();
  const [feeEstimates] = useState<{
    low: { rate: number; fee: number; time: string };
    medium: { rate: number; fee: number; time: string };
    high: { rate: number; fee: number; time: string };
  }>({
    low: { rate: 1, fee: 0, time: "30 min" },
    medium: { rate: 3, fee: 0, time: "~20 min" },
    high: { rate: 5, fee: 0, time: "~10 min" },
  });
  const [buyQuote, setBuyQuote] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();

  // Get addresses from the lib - only if we have a session
  const { userAgentAddress: userAddress } = useAgentAccount();

  // TODO: HARDCODE IT FOR NOW AND REMOVE IT LATER AND UNCOMMENT THE ABOVE LINE
  // const userAddress =
  //   "SP16PP6EYRCB7NCTGWAC73DH5X0KXWAPEQ8RKWAKS.no-ai-account-2";

  const btcAddress = userAddress ? getBitcoinAddress() : null;

  const getBuyQuote = useCallback(
    async (amount: string): Promise<HiroGetInResponse | null> => {
      if (!dexContract || !userAddress) return null;
      const [contractAddress, contractName] = dexContract.split(".");
      try {
        const btcAmount = Math.floor(parseFloat(amount) * Math.pow(10, 8));
        const url = `https://api.hiro.so/v2/contracts/call-read/${contractAddress}/${contractName}/get-in?tip=latest`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: userAddress,
            arguments: [cvToHex(uintCV(btcAmount))],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as HiroGetInResponse;
        return data;
      } catch (error) {
        console.error("Error fetching buy quote:", error);
        return null;
      }
    },
    [userAddress, dexContract]
  );

  useEffect(() => {
    const fetchQuote = async () => {
      if (amount && Number.parseFloat(amount) > 0) {
        setLoadingQuote(true);
        const quoteData = await getBuyQuote(amount);
        if (quoteData?.result) {
          try {
            const clarityValue = hexToCV(quoteData.result);
            const jsonValue = cvToJSON(clarityValue);
            if (jsonValue.value?.value && jsonValue.value.value["tokens-out"]) {
              const rawAmount = jsonValue.value.value["tokens-out"].value;
              const slippageFactor = 1 - 4 / 100; // 4% slippage
              const amountAfterSlippage = Math.floor(
                Number(rawAmount) * slippageFactor
              );
              setBuyQuote(
                (amountAfterSlippage / 10 ** 6).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              );
            } else {
              setBuyQuote(null);
            }
          } catch (error) {
            console.error("Error parsing quote result:", error);
            setBuyQuote(null);
          }
        } else {
          setBuyQuote(null);
        }
        setLoadingQuote(false);
      } else {
        setBuyQuote(null);
      }
    };

    const debounce = setTimeout(() => {
      fetchQuote();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounce);
  }, [amount, getBuyQuote]);

  // Fetch BTC balance using React Query with 40-minute cache
  const { data: btcBalance, isLoading: isBalanceLoading } = useQuery<
    number | null
  >({
    queryKey: ["btcBalance", btcAddress],
    queryFn: async () => {
      if (!btcAddress) return null;

      const blockstreamUrl = `https://blockstream.info/api/address/${btcAddress}/utxo`;
      const response = await fetch(blockstreamUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const utxos = await response.json();
      const totalSats = utxos.reduce(
        (sum: number, utxo: UTXO) => sum + utxo.value,
        0
      );
      return totalSats / 100000000; // Convert satoshis to BTC
    },
    enabled: !!btcAddress, // Only run query when btcAddress is available
    staleTime: 40 * 60 * 1000, // 40 minutes in milliseconds
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const formatUsdValue = (amount: number): string => {
    if (!amount || amount <= 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateUsdValue = (btcAmount: string): number => {
    if (!btcAmount || !btcUsdPrice) return 0;
    const numAmount = Number.parseFloat(btcAmount);
    return isNaN(numAmount) ? 0 : numAmount * btcUsdPrice;
  };

  const calculateFee = (btcAmount: string): string => {
    if (!btcAmount || Number.parseFloat(btcAmount) <= 0) return "0.00000000";
    const numAmount = Number.parseFloat(btcAmount);
    if (isNaN(numAmount)) return "0.00003000";

    return numAmount <= 0.002 ? "0.00003000" : "0.00006000";
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setSelectedPreset(null);
    }
  };

  const handlePresetClick = (presetAmount: string): void => {
    setAmount(presetAmount);
    setSelectedPreset(presetAmount);
  };

  const handleMaxClick = async (): Promise<void> => {
    if (btcBalance !== null && btcBalance !== undefined) {
      try {
        const selectedRate = feeEstimates.medium.rate;
        const estimatedSize = 1 * 70 + 2 * 33 + 12;
        const networkFeeSats = estimatedSize * selectedRate;
        const networkFee = networkFeeSats / 100000000;
        const maxAmount = Math.max(0, btcBalance - networkFee);
        const formattedMaxAmount = maxAmount.toFixed(8);

        setAmount(formattedMaxAmount);
        setSelectedPreset("max");
      } catch (error) {
        console.error("Error calculating max amount:", error);
        const networkFee = 0.000006;
        const maxAmount = Math.max(0, btcBalance - networkFee);
        setAmount(maxAmount.toFixed(8));
        setSelectedPreset("max");
      }
    } else {
      toast({
        title: "Balance not available",
        description:
          "Your BTC balance is not available. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDepositConfirm = async (): Promise<void> => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid BTC amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken || !userAddress) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Manual address type check before preparing transaction
    if (btcAddress && !btcAddress.startsWith("bc1")) {
      handleAddressTypeError(
        new Error("Non-SegWit address detected"),
        activeWalletProvider
      );
      return;
    }

    try {
      if (!btcAddress) {
        throw new Error("No Bitcoin address found in your wallet");
      }

      const userInputAmount = Number.parseFloat(amount);
      const serviceFee = Number.parseFloat(calculateFee(amount));
      const totalAmount = (userInputAmount + serviceFee).toFixed(8);

      const currentFeeRates: FeeEstimates = {
        low: feeEstimates.low.rate,
        medium: feeEstimates.medium.rate,
        high: feeEstimates.high.rate,
      };

      const amountInSats = Math.round(Number.parseFloat(amount) * 100000000);

      if (amountInSats < MIN_DEPOSIT_SATS) {
        toast({
          title: "Minimum deposit required",
          description: `Please deposit at least ${
            MIN_DEPOSIT_SATS / 100000000
          } BTC`,
          variant: "destructive",
        });
        return;
      }

      if (amountInSats > MAX_DEPOSIT_SATS) {
        toast({
          title: "Beta limitation",
          description: `During beta, the maximum deposit amount is ${
            MAX_DEPOSIT_SATS / 100000000
          } BTC. Thank you for your understanding.`,
          variant: "destructive",
        });
        return;
      }

      if (poolStatus && amountInSats > poolStatus.estimatedAvailable) {
        toast({
          title: "Insufficient liquidity",
          description: `The pool currently has ${
            poolStatus.estimatedAvailable / 100000000
          } BTC available. Please try a smaller amount.`,
          variant: "destructive",
        });
        return;
      }

      const amountInBTC = Number.parseFloat(amount);
      const networkFeeInBTC = 0.000006;
      const totalRequiredBTC = amountInBTC + networkFeeInBTC;

      const currentBalance = btcBalance ?? 0;
      if (currentBalance < totalRequiredBTC) {
        const shortfallBTC = totalRequiredBTC - currentBalance;
        throw new Error(
          `Insufficient funds. You need ${shortfallBTC.toFixed(
            8
          )} BTC more to complete this transaction.`
        );
      }

      if (!dexContract) {
        toast({
          title: "DEX Contract Missing",
          description: "DEX contract has not been specified.",
          variant: "destructive",
        });
        return;
      }

      try {
        const transactionData = await styxSDK.prepareTransaction({
          amount: totalAmount, // Now includes service fee
          userAddress,
          btcAddress,
          feePriority: "medium" as TransactionPriority,
          walletProvider: activeWalletProvider,
          feeRates: currentFeeRates,
          dexContract: dexContract,
        } as TransactionPrepareParams);

        setConfirmationData({
          depositAmount: totalAmount,
          userInputAmount: amount,
          depositAddress: transactionData.depositAddress,
          stxAddress: userAddress,
          opReturnHex: transactionData.opReturnData,
        });

        setShowConfirmation(true);
      } catch (err) {
        console.error("Error preparing transaction:", err);

        if (err instanceof Error) {
          if (isInscriptionError(err)) {
            handleInscriptionError(err);
          } else if (isUtxoCountError(err)) {
            handleUtxoCountError(err);
          } else if (isAddressTypeError(err)) {
            handleAddressTypeError(err, activeWalletProvider);
          } else {
            toast({
              title: "Error",
              description:
                err.message ||
                "Failed to prepare transaction. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to prepare transaction. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error("Error preparing Bitcoin transaction:", err);

      if (err instanceof Error) {
        toast({
          title: "Error",
          description:
            err.message ||
            "Failed to prepare Bitcoin transaction. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            "Failed to prepare Bitcoin transaction. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  function isAddressTypeError(error: Error): boolean {
    return (
      error.message.includes("inputType: sh without redeemScript") ||
      error.message.includes("P2SH") ||
      error.message.includes("redeem script")
    );
  }

  function handleAddressTypeError(
    error: Error,
    walletProvider: "leather" | "xverse" | null
  ): void {
    if (walletProvider === "leather") {
      toast({
        title: "Unsupported Address Type",
        description:
          "Leather wallet does not support P2SH addresses (starting with '3'). Please use a SegWit address (starting with 'bc1') instead.",
        variant: "destructive",
      });
    } else if (walletProvider === "xverse") {
      toast({
        title: "P2SH Address Error",
        description:
          "There was an issue with the P2SH address. This might be due to wallet limitations. Try using a SegWit address (starting with 'bc1') instead.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "P2SH Address Not Supported",
        description:
          "Your wallet doesn't provide the necessary information for your P2SH address. Please try using a SegWit address (starting with bc1) instead.",
        variant: "destructive",
      });
    }
  }

  function isInscriptionError(error: Error): boolean {
    return error.message.includes("with inscriptions");
  }

  function handleInscriptionError(error: Error): void {
    toast({
      title: "Inscriptions Detected",
      description: error.message,
      variant: "destructive",
    });
  }

  function isUtxoCountError(error: Error): boolean {
    return error.message.includes("small UTXOs");
  }

  function handleUtxoCountError(error: Error): void {
    toast({
      title: "Too Many UTXOs",
      description: error.message,
      variant: "destructive",
    });
  }

  const presetAmounts: string[] = ["0.0001", "0.0002"];
  const presetLabels: string[] = ["0.0001 BTC", "0.0002 BTC"];

  const getButtonText = () => {
    if (!accessToken) return "Connect Wallet";
    return `Deposit`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 w-full max-w-lg mx-auto">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 text-sm rounded">
        ⚠️ Still in testing phase. Do not send real transaction.
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl ">
          Deposit <span className="font-bold">{daoName}</span>
        </h2>
        {accessToken && (userAddress || btcAddress) && (
          <Dialog
            open={isAgentDetailsOpen}
            onOpenChange={setIsAgentDetailsOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="text-xs text-muted-foreground h-auto p-0"
              >
                View Agent Details
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agent Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 pt-2 text-xs">
                {userAddress && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Agent Address (STX)
                    </span>
                    <div className="font-mono bg-muted/50 p-2 rounded border break-all">
                      {userAddress}
                    </div>
                  </div>
                )}
                {btcAddress && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Bitcoin Address
                    </span>
                    <div className="font-mono bg-muted/50 p-2 rounded border break-all">
                      {btcAddress}
                    </div>
                  </div>
                )}
                {dexContract && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Token Contract
                    </span>
                    <div className="font-mono bg-muted/50 p-2 rounded border break-all">
                      {dexContract}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div>
        <div className="flex justify-end items-center mb-1">
          <span className="font-medium text-sm ">
            You will spend {formatUsdValue(calculateUsdValue(amount))}
          </span>
        </div>

        <div className="relative">
          <Input
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00000000"
            className="text-right pr-12 pl-12 h-12 text-lg"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            BTC
          </span>
        </div>

        {accessToken && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              Available Balance:{" "}
              {isBalanceLoading
                ? "Loading..."
                : btcBalance !== null && btcBalance !== undefined
                  ? `${btcBalance.toFixed(8)} BTC${
                      btcUsdPrice
                        ? ` (${formatUsdValue(btcBalance * (btcUsdPrice || 0))})`
                        : ""
                    }`
                  : "Unable to load balance"}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-2 justify-end">
          {presetAmounts.map((presetAmount, index) => (
            <Button
              key={presetAmount}
              size="sm"
              variant={selectedPreset === presetAmount ? "default" : "outline"}
              onClick={() => handlePresetClick(presetAmount)}
            >
              {presetLabels[index]}
            </Button>
          ))}
          <Button
            size="sm"
            variant={selectedPreset === "max" ? "default" : "outline"}
            onClick={handleMaxClick}
            disabled={btcBalance === null || btcBalance === undefined}
          >
            MAX
          </Button>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-end items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              Your agent account will receive
            </span>
          </div>
        </div>
        <div className="relative">
          <Input
            value={loadingQuote ? "Loading..." : buyQuote || "0.00"}
            readOnly
            className="text-right pr-32 pl-12 h-12 text-lg bg-muted/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            {daoName} Tokens
          </span>
        </div>
        <div className="text-xs text-muted-foreground text-right mt-1">
          Includes 4% slippage protection
        </div>
      </div>

      <Card className="border-border/30">
        <CardContent className="p-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Your Deposit</span>
            <span>{amount || "0.00"} BTC</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-muted-foreground">Service Fee</span>
            <span>{calculateFee(amount)} BTC</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium mt-2 pt-2 border-t border-border/30">
            <span>Total</span>
            <span>
              {(Number(amount || 0) + Number(calculateFee(amount))).toFixed(8)}{" "}
              BTC
            </span>
          </div>
        </CardContent>
      </Card>

      {!accessToken ? (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground mb-1">
            Connect your wallet to continue
          </p>
          <div className="flex justify-center">
            <AuthButton redirectUrl="/deposit" />
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          className="h-12 text-lg bg-primary w-full"
          onClick={handleDepositConfirm}
        >
          {getButtonText()}
        </Button>
      )}
    </div>
  );
}
