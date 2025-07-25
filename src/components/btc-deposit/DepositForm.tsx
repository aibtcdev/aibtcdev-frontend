"use client";

import { useState, type ChangeEvent, useEffect } from "react";
import { getBitcoinAddress } from "@/lib/address";
import { useAgentAccount } from "@/hooks/useAgentAccount";
import { fetchDAOByNameWithExtensions } from "@/services/dao.service";
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
import { Bitcoin, Copy, CheckCircle, Wallet } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import AuthButton from "@/components/home/AuthButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";

interface DepositFormProps {
  btcUsdPrice: number | null;
  poolStatus: PoolStatus | null;
  setConfirmationData: (data: ConfirmationData) => void;
  setShowConfirmation: (show: boolean) => void;
  activeWalletProvider: "leather" | "xverse" | null;
}

export interface ConfirmationData {
  depositAmount: string;
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
}: DepositFormProps) {
  const [amount, setAmount] = useState<string>("0.0001");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { toast } = useToast();
  const [feeEstimates, setFeeEstimates] = useState<{
    low: { rate: number; fee: number; time: string };
    medium: { rate: number; fee: number; time: string };
    high: { rate: number; fee: number; time: string };
  }>({
    low: { rate: 1, fee: 0, time: "30 min" },
    medium: { rate: 3, fee: 0, time: "~20 min" },
    high: { rate: 5, fee: 0, time: "~10 min" },
  });

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();

  // Get addresses from the lib - only if we have a session
  const { userAgentAddress: userAddress } = useAgentAccount();

  // Fetch DAO by hardcoded name "FAST11" along with its extensions
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", "FAST11"],
    queryFn: () => fetchDAOByNameWithExtensions("FAST11"),
    enabled: true,
  });

  const btcAddress = userAddress ? getBitcoinAddress() : null;

  // Helper function to copy address to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 2000);
      toast({
        title: "Copied!",
        description: `${type} address copied to clipboard`,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

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

  // Fetch fee estimates from mempool.space
  const fetchMempoolFeeEstimates = async (): Promise<{
    low: { rate: number; fee: number; time: string };
    medium: { rate: number; fee: number; time: string };
    high: { rate: number; fee: number; time: string };
  }> => {
    try {
      // console.log("Fetching fee estimates directly from mempool.space");
      const response = await fetch(
        "https://mempool.space/api/v1/fees/recommended"
      );
      const data = await response.json();

      // Log the raw values to help with debugging
      // console.log("Raw mempool.space fee data:", data);

      // Map to the correct fee estimate fields
      const lowRate = data.hourFee;
      const mediumRate = data.halfHourFee;
      const highRate = data.fastestFee;

      // Don't modify the rates, use them as-is
      return {
        low: {
          rate: lowRate,
          fee: Math.round(lowRate * 148),
          time: "~1 hour",
        },
        medium: {
          rate: mediumRate,
          fee: Math.round(mediumRate * 148),
          time: "~30 min",
        },
        high: {
          rate: highRate,
          fee: Math.round(highRate * 148),
          time: "~10 min",
        },
      };
    } catch (error) {
      console.error("Error fetching fee estimates from mempool.space:", error);
      // Fallback to default values that better reflect current network conditions
      return {
        low: { rate: 3, fee: 444, time: "~1 hour" },
        medium: { rate: 3, fee: 444, time: "~30 min" },
        high: { rate: 5, fee: 740, time: "~10 min" },
      };
    }
  };

  // Fetch fee estimates on component mount
  useEffect(() => {
    const getFeeEstimates = async () => {
      try {
        const estimates = await fetchMempoolFeeEstimates();
        setFeeEstimates(estimates);
      } catch (error) {
        console.error("Error fetching initial fee estimates:", error);
      }
    };

    getFeeEstimates();
  }, []);

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
        const feeRates = await styxSDK.getFeeEstimates();
        const selectedRate = feeRates.medium;
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

    try {
      if (!btcAddress) {
        throw new Error("No Bitcoin address found in your wallet");
      }

      // IMPORTANT: Calculate the total amount including service fee
      const userInputAmount = Number.parseFloat(amount);
      const serviceFee = Number.parseFloat(calculateFee(amount));
      const totalAmount = (userInputAmount + serviceFee).toFixed(8);

      // console.log("Transaction amounts:", {
      //   userInputAmount,
      //   serviceFee,
      //   totalAmount,
      // });

      // Always fetch fresh fee estimates before transaction
      let currentFeeRates: FeeEstimates;
      try {
        // console.log(
        //   "Fetching fresh fee estimates before transaction preparation"
        // );
        const estimatesResult = await fetchMempoolFeeEstimates();
        currentFeeRates = {
          low: estimatesResult.low.rate,
          medium: estimatesResult.medium.rate,
          high: estimatesResult.high.rate,
        };

        // Update the UI fee display
        setFeeEstimates(estimatesResult);
        // console.log("Using fee rates:", currentFeeRates);
      } catch (error) {
        console.warn("Error fetching fee estimates, using defaults:", error);
        currentFeeRates = { low: 1, medium: 3, high: 5 };
      }

      const amountInSats = Math.round(Number.parseFloat(amount) * 100000000);

      // console.log(MIN_DEPOSIT_SATS, MAX_DEPOSIT_SATS);
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

      // Check if btcBalance is available and sufficient
      const currentBalance = btcBalance ?? 0;
      if (currentBalance < totalRequiredBTC) {
        const shortfallBTC = totalRequiredBTC - currentBalance;
        throw new Error(
          `Insufficient funds. You need ${shortfallBTC.toFixed(
            8
          )} BTC more to complete this transaction.`
        );
      }

      // Ensure DAO dex extension is loaded before preparing transaction
      if (isLoadingDAO) {
        toast({
          title: "Loading DAO info",
          description: "Please wait a moment and try again.",
        });
        return;
      }
      const dexExtension = dao?.extensions?.find((ext) => ext.type === "TOKEN");
      if (!dexExtension?.contract_principal) {
        toast({
          title: "DEX Extension Missing",
          description: "Cannot find DEX extension for your DAO.",
          variant: "destructive",
        });
        return;
      }

      try {
        // console.log("Preparing transaction with SDK...");
        // console.log("Preparing transaction parameters:", {
        //   btcAddress,
        //   userAddress,
        //   totalAmount,
        //   feePriority: "medium",
        //   feeRates: currentFeeRates,
        //   extension: dexExtension.contract_principal,
        // });

        const transactionData = await styxSDK.prepareTransaction({
          amount: totalAmount, // Now includes service fee
          userAddress,
          btcAddress,
          feePriority: "medium" as TransactionPriority,
          walletProvider: activeWalletProvider,
          feeRates: currentFeeRates,
          extension: dexExtension,
        } as TransactionPrepareParams);

        // console.log("Transaction prepared:", transactionData);
        // console.log("Agent (STX) Address:", userAddress);

        setConfirmationData({
          depositAmount: totalAmount,
          depositAddress: transactionData.depositAddress,
          stxAddress: userAddress,
          opReturnHex: transactionData.opReturnData,
          // isBlaze: useBlazeSubnet,
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

  // Helper functions for error handling
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

  // Determine button text based on connection state
  const getButtonText = () => {
    if (!accessToken) return "Connect Wallet";
    return `Deposit ${dao?.name || "DAO"} Tokens`;
  };

  // Render loading state while initializing session
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 md:space-y-6 w-full max-w-lg mx-auto">
      {/* Header with clear title */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">
          Deposit {dao?.name || "DAO"} Tokens
        </h2>
        <p className="text-sm text-muted-foreground">Into your agent account</p>
      </div>

      {/* Agent Account Information Card */}
      {accessToken && (userAddress || btcAddress) && (
        <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Agent Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userAddress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Agent Address (STX)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(userAddress, "Agent")}
                    className="h-6 px-2"
                  >
                    {copiedAddress === "Agent" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="font-mono text-xs bg-muted/50 p-2 rounded border break-all">
                  {userAddress}
                </div>
              </div>
            )}

            {btcAddress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Bitcoin Address
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(btcAddress, "Bitcoin")}
                    className="h-6 px-2"
                  >
                    {copiedAddress === "Bitcoin" ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="font-mono text-xs bg-muted/50 p-2 rounded border break-all">
                  {btcAddress}
                </div>
              </div>
            )}

            {dao && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">DAO:</span>
                  <span className="font-medium">{dao.name}</span>
                </div>
                {dao.extensions?.find((ext) => ext.type === "TOKEN")
                  ?.contract_principal && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">
                      Token Contract:
                    </span>
                    <span className="font-mono text-xs bg-muted/30 px-2 py-1 rounded">
                      {/* {dao.extensions.find((ext) => ext.type === "TOKEN") */}
                      {/* ?.contract_principal || "N/A"} */}
                      {/* HARD CODE IT FOR BEAST */}
                      SP2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5E4R0JRM.beast2-faktory
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* From: Bitcoin */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-5 w-5" />
            <span className="font-medium">Bitcoin</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatUsdValue(calculateUsdValue(amount))}
          </span>
        </div>

        <div className="relative">
          <Input
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00000000"
            className="text-right pr-16 pl-16 h-[60px] text-xl"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-md pointer-events-none">
            BTC
          </span>
        </div>

        {/* Display user's BTC balance */}
        {accessToken && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              Balance:{" "}
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

        {/* Preset amounts */}
        <div className="flex gap-2 mt-3">
          {presetAmounts.map((presetAmount, index) => (
            <Button
              key={presetAmount}
              size="sm"
              variant={selectedPreset === presetAmount ? "default" : "outline"}
              className={
                selectedPreset === presetAmount
                  ? "bg-orange-500 hover:bg-orange-600 text-black"
                  : ""
              }
              onClick={() => handlePresetClick(presetAmount)}
            >
              {presetLabels[index]}
            </Button>
          ))}
          <Button
            size="sm"
            variant={selectedPreset === "max" ? "default" : "outline"}
            className={
              selectedPreset === "max"
                ? "bg-orange-500 hover:bg-orange-600 text-black"
                : ""
            }
            onClick={handleMaxClick}
            disabled={btcBalance === null || btcBalance === undefined}
          >
            MAX
          </Button>
        </div>
      </div>

      {/* Fee Information Box */}
      <Card className="border-border/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Estimated time
            </span>
            <span className="text-xs text-muted-foreground">
              {feeEstimates.medium.time}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">Service fee</span>
            <span className="text-xs text-muted-foreground">
              {amount && Number.parseFloat(amount) > 0 && btcUsdPrice
                ? formatUsdValue(
                    Number.parseFloat(calculateFee(amount)) * btcUsdPrice
                  )
                : "$0.00"}{" "}
              ~ {calculateFee(amount)} BTC
            </span>
          </div>

          {/* Add Pool Liquidity information */}
          {poolStatus && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Pool liquidity
              </span>
              <span className="text-xs text-muted-foreground">
                {formatUsdValue(
                  (poolStatus.estimatedAvailable / 100000000) *
                    (btcUsdPrice || 0)
                )}{" "}
                ~ {(poolStatus.estimatedAvailable / 100000000).toFixed(8)} BTC
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accordion with Additional Info */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="how-it-works" className="border-none">
          <div className="flex justify-end">
            <AccordionTrigger className="py-0 text-xs text-muted-foreground">
              How it works
            </AccordionTrigger>
          </div>
          <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
            <p>
              Your BTC deposit unlocks {dao?.name || "DAO"} tokens via
              Clarity&apos;s direct Bitcoin state reading. No intermediaries or
              multi-signature scheme needed. Trustless. Fast. Secure.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Button */}
      {!accessToken ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Connect your wallet to continue
          </p>
          <div className="flex justify-center">
            <AuthButton redirectUrl="/deposit" />
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          className="h-[60px] text-xl bg-primary w-full"
          onClick={handleDepositConfirm}
        >
          {getButtonText()}
        </Button>
      )}
    </div>
  );
}
