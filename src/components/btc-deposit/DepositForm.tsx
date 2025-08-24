"use client";

import { useState, type ChangeEvent, useEffect, useCallback } from "react";
import { getBitcoinAddress, getStacksAddress } from "@/lib/address";
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
import { Loader } from "@/components/reusables/Loader";
import AuthButton from "@/components/home/AuthButton";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import {
  cvToHex,
  uintCV,
  hexToCV,
  cvToJSON,
  Pc,
  contractPrincipalCV,
} from "@stacks/transactions";
import { request } from "@stacks/connect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";

interface DepositFormProps {
  btcUsdPrice: number | null;
  poolStatus: PoolStatus | null;
  setConfirmationData: (data: ConfirmationData) => void;
  setShowConfirmation: (show: boolean) => void;
  activeWalletProvider: "leather" | "xverse" | null;
  dexContract: string;
  daoName: string;
  userAddress: string | null;
  dexId: number;
  targetStx?: number; // New prop for target STX amount
  tokenContract?: string; // New prop for token contract
  currentSlippage?: number; // New prop for slippage percentage
  swapType: "aibtc" | "sbtc";
  poolId: string;
  aiAccountReceiver: string;
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
  dexId: number;
  minTokenOut: number;
  swapType: string;
}

const SBTC_CONTRACT = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

// Helper function to get token asset name - you may need to implement this based on your token structure
const getTokenAssetName = (symbol: string): string => {
  return symbol.toLowerCase(); // Simplified implementation
};

export default function DepositForm({
  btcUsdPrice,
  poolStatus,
  setConfirmationData,
  setShowConfirmation,
  activeWalletProvider,
  dexContract,
  daoName,
  dexId,
  targetStx = 0,
  tokenContract = "SP2Z94F6QX847PMXTPJJ2ZCCN79JZDW3PJ4E6ZABY.fake-faktory", //REMOVE THE HARDCODED LATER IN PROD
  currentSlippage = 4,
  swapType,
  poolId,
  aiAccountReceiver,
}: DepositFormProps) {
  // SET IT TO TRUE IF YOU WANT TO DISABLE BUY
  const BUY_DISABLED = false;

  // Debug poolStatus
  console.log("DepositForm poolStatus:", poolStatus);

  const [amount, setAmount] = useState<string>("0.0001");
  const [isAgentDetailsOpen, setIsAgentDetailsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const { toast } = useToast();
  const [buyQuote, setBuyQuote] = useState<string | null>(null);
  const [rawBuyQuote, setRawBuyQuote] = useState<HiroGetInResponse | null>(
    null
  );
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [buyWithSbtc, setBuyWithSbtc] = useState<boolean>(false);
  const [minTokenOut, setMinTokenOut] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add fee rate fetching function
  const fetchMempoolFeeEstimates = async () => {
    try {
      const response = await fetch(
        `https://mempool.space/api/v1/fees/recommended`
      );
      const data = await response.json();

      // Map to the correct fee estimate fields
      const lowRate = data.hourFee || 1;
      const mediumRate = data.halfHourFee || 3;
      const highRate = data.fastestFee || 5;

      return {
        low: lowRate,
        medium: mediumRate,
        high: highRate,
      };
    } catch (error) {
      console.error("Error fetching fee estimates:", error);
      // Fallback to default values
      return {
        low: 1,
        medium: 3,
        high: 5,
      };
    }
  };

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();

  // Get addresses from the lib - only if we have a session
  const { userAgentAddress } = useAgentAccount();
  const hasAgentAccount = Boolean(userAgentAddress);
  const userAddress = getStacksAddress();

  const btcAddress = userAddress ? getBitcoinAddress() : null;

  useEffect(() => {
    if (btcAddress) {
      console.log(`Querying BTC balance for address: ${btcAddress}`);
    }
  }, [btcAddress]);

  // Fetch STX balance for transaction fees
  const { data: stxBalance } = useQuery<number | null>({
    queryKey: ["stxBalance", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const response = await fetch(
        `https://api.hiro.so/extended/v1/address/${userAddress}/balances`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch STX balance");
      }
      const data = await response.json();
      return parseInt(data.stx.balance) / 10 ** 6; // STX has 6 decimals
    },
    enabled: !!userAddress && buyWithSbtc,
  });

  const { data: sbtcBalance, isLoading: isSbtcBalanceLoading } = useQuery<
    number | null
  >({
    queryKey: ["sbtcBalance", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const response = await fetch(
        `https://api.hiro.so/extended/v1/address/${userAddress}/balances`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sBTC balance");
      }
      const data = await response.json();
      const sbtcAssetIdentifier = `${SBTC_CONTRACT}::sbtc-token`;
      if (data.fungible_tokens && data.fungible_tokens[sbtcAssetIdentifier]) {
        const balance = data.fungible_tokens[sbtcAssetIdentifier].balance;
        return parseInt(balance) / 10 ** 8;
      }
      return 0;
    },
    enabled: !!userAddress && buyWithSbtc,
  });

  const getBuyQuote = useCallback(
    async (amount: string): Promise<HiroGetInResponse | null> => {
      if (!dexContract || !userAddress) return null;
      const [contractAddress, contractName] = dexContract.split(".");
      try {
        const btcAmount = parseFloat(amount) * Math.pow(10, 8);
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
        setRawBuyQuote(quoteData);

        if (quoteData?.result) {
          try {
            const clarityValue = hexToCV(quoteData.result);
            const jsonValue = cvToJSON(clarityValue);
            if (jsonValue.value?.value && jsonValue.value.value["tokens-out"]) {
              const rawAmount = jsonValue.value.value["tokens-out"].value;
              const slippageFactor = 1 - currentSlippage / 100;
              const amountAfterSlippage = Math.floor(
                Number(rawAmount) * slippageFactor
              );
              setMinTokenOut(amountAfterSlippage);
              setBuyQuote(
                (amountAfterSlippage / 10 ** 8).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              );
            } else {
              setBuyQuote(null);
              setMinTokenOut(0);
            }
          } catch (error) {
            console.error("Error parsing quote result:", error);
            setBuyQuote(null);
            setMinTokenOut(0);
          }
        } else {
          setBuyQuote(null);
          setMinTokenOut(0);
        }
        setLoadingQuote(false);
      } else {
        setBuyQuote(null);
        setRawBuyQuote(null);
        setMinTokenOut(0);
      }
    };

    const debounce = setTimeout(() => {
      fetchQuote();
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounce);
  }, [amount, getBuyQuote, currentSlippage]);

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
    enabled: !!btcAddress && !buyWithSbtc, // Only run query when btcAddress is available
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
    if (buyWithSbtc) return "0.00000000";
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
    if (buyWithSbtc) {
      if (sbtcBalance !== null && sbtcBalance !== undefined) {
        setAmount(sbtcBalance.toFixed(8));
        setSelectedPreset("max");
      } else {
        toast({
          title: "sBTC Balance not available",
          description:
            "Your sBTC balance is not available. Please try again later.",
          variant: "destructive",
        });
      }
      return;
    }

    if (btcBalance !== null && btcBalance !== undefined) {
      try {
        const selectedRate = 3;
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

  const handleBuyWithSbtc = async () => {
    if (!accessToken || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    // if ((stxBalance || 0) < 0.01) {
    //   toast({
    //     title: "STX Required for Transaction Fees",
    //     description: "You need at least 0.01 STX to pay for transaction fees.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const ustx = parseFloat(amount) * Math.pow(10, 8);

    if (!rawBuyQuote?.result) {
      toast({
        title: "Error",
        description: "Failed to get quote for buy order.",
        variant: "destructive",
      });
      return;
    }

    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));

    if (ustx > sbtcBalanceInSats) {
      toast({
        title: "Insufficient sBTC balance",
        description: `You need more sBTC to complete this purchase. Required: ${(
          ustx / Math.pow(10, 8)
        ).toFixed(8)} sBTC, Available: ${(
          (sbtcBalanceInSats || 0) / Math.pow(10, 8)
        ).toFixed(8)} sBTC`,
        variant: "destructive",
      });
      return;
    }

    try {
      const clarityValue = hexToCV(rawBuyQuote.result);
      const jsonValue = cvToJSON(clarityValue);

      const quoteAmount = jsonValue.value.value["tokens-out"].value;
      const newStx = Number(jsonValue.value.value["new-stx"].value);
      const tokenBalance = jsonValue.value.value["ft-balance"]?.value;
      const currentStxBalance = Number(
        jsonValue.value.value["total-stx"]?.value || 0
      );

      if (!quoteAmount || !newStx || !tokenBalance) {
        toast({
          title: "Error",
          description: "Invalid quote response",
          variant: "destructive",
        });
        return;
      }

      // Check target limit logic (only if targetStx is provided)
      if (targetStx > 0) {
        const TARGET_STX = targetStx * Math.pow(10, 8);
        const remainingToTarget = Math.max(0, TARGET_STX - currentStxBalance);
        const bufferAmount = remainingToTarget * 1.15;

        if (ustx > bufferAmount) {
          const formattedUstx = (ustx / Math.pow(10, 8)).toFixed(8);
          const formattedMax = (bufferAmount / Math.pow(10, 8)).toFixed(8);

          toast({
            title: "Amount exceeds target limit",
            description: `Maximum purchase amount is ${formattedMax} BTC. You entered ${formattedUstx}.`,
            variant: "destructive",
          });
          return;
        }
      }

      const slippageFactor = 1 - currentSlippage / 100;
      const minTokensOut = Math.floor(Number(quoteAmount) * slippageFactor);

      const [dexAddress, dexName] = dexContract.split(".");
      const [tokenAddress, tokenName] = tokenContract.split(".");
      const [sbtcAddress, sbtcName] = SBTC_CONTRACT.split(".");

      const args = [contractPrincipalCV(tokenAddress, tokenName), uintCV(ustx)];
      const assetName = getTokenAssetName(daoName);
      console.log(assetName);

      const TARGET_STX = targetStx * Math.pow(10, 8);
      const isLastBuy = targetStx > 0 && currentStxBalance + ustx >= TARGET_STX;

      const postConditions = isLastBuy
        ? [
            Pc.principal(userAddress)
              .willSendLte(ustx)
              .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
            Pc.principal(`${dexAddress}.${dexName}`)
              .willSendGte(tokenBalance)
              .ft(`${tokenAddress}.${tokenName}`, assetName),
            Pc.principal(`${dexAddress}.${dexName}`)
              .willSendGte(TARGET_STX)
              .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
          ]
        : [
            Pc.principal(userAddress)
              .willSendLte(ustx)
              .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
            Pc.principal(`${dexAddress}.${dexName}`)
              .willSendGte(minTokensOut)
              .ft(`${tokenAddress}.${tokenName}`, assetName),
          ];

      const params = {
        contract: `${dexAddress}.${dexName}` as `${string}.${string}`,
        functionName: "buy",
        functionArgs: args,
        postConditions,
      };

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        toast({
          title: "Transaction Submitted",
          description: `Your sBTC transaction to buy ${daoName} tokens has been submitted. TxID: ${response.txid}`,
        });
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (error) {
      console.error("Error during sBTC contract call:", error);
      toast({
        title: "Error",
        description: "Failed to submit sBTC buy order.",
        variant: "destructive",
      });
    }
  };

  const handleDepositConfirm = async (): Promise<void> => {
    if (buyWithSbtc) {
      await handleBuyWithSbtc();
      return;
    }

    if (!accessToken || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    // if ((stxBalance || 0) < 0.01) {
    //   toast({
    //     title: "STX Required for Transaction Fees",
    //     description: "You need at least 0.01 STX to pay for transaction fees.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid BTC amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!btcAddress) {
      toast({
        title: "No Bitcoin address",
        description: "No Bitcoin address found in your wallet",
        variant: "destructive",
      });
      return;
    }

    const amountInSats = Math.round(parseFloat(amount) * 100000000);

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

    const userInputAmount = parseFloat(amount);
    const serviceFee = parseFloat(calculateFee(amount));
    const totalAmount = (userInputAmount + serviceFee).toFixed(8);

    const networkFeeInBTC = 0.000006; // 600 sats as network fee
    const totalRequiredBTC = parseFloat(totalAmount) + networkFeeInBTC;

    if ((btcBalance || 0) < totalRequiredBTC) {
      const shortfallBTC = totalRequiredBTC - (btcBalance || 0);
      toast({
        title: "Insufficient funds",
        description: `You need ${shortfallBTC.toFixed(
          8
        )} BTC more to complete this transaction.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feeRates = await fetchMempoolFeeEstimates();
      const currentFeeRates: FeeEstimates = {
        low: feeRates.low,
        medium: feeRates.medium,
        high: feeRates.high,
      };

      const transactionData = await styxSDK.prepareTransaction({
        amount: totalAmount,
        userAddress,
        btcAddress,
        feePriority: "medium" as TransactionPriority,
        walletProvider: activeWalletProvider,
        feeRates: currentFeeRates,
        minTokenOut: minTokenOut,
        swapType: swapType,
        poolId: poolId,
        dexId: dexId,
        aiAccountReceiver: aiAccountReceiver,
      } as TransactionPrepareParams);

      setConfirmationData({
        depositAmount: totalAmount,
        userInputAmount: amount,
        depositAddress: transactionData.depositAddress,
        stxAddress: userAddress,
        opReturnHex: transactionData.opReturnData,
        dexId: dexId,
        minTokenOut: minTokenOut,
        swapType: swapType,
      });

      setShowConfirmation(true);
    } catch (err) {
      const error = err as Error;
      console.error("Error preparing transaction:", error);

      if (isInscriptionError(error)) {
        handleInscriptionError(error);
      } else if (isUtxoCountError(error)) {
        handleUtxoCountError(error);
      } else if (isAddressTypeError(error)) {
        handleAddressTypeError(error, activeWalletProvider);
      } else if (error.message.includes("HTTP error! status: 500")) {
        toast({
          title: "Insufficient funds",
          description:
            "Not enough Bitcoin to cover deposit amount plus fees. Try a smaller amount or add more funds.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error.message || "Failed to prepare transaction. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
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

  // const getButtonText = () => {
  //   if (!accessToken) return "Connect Wallet";
  //   if (!hasAgentAccount) return "No Agent Account";
  //   if (buyWithSbtc && (stxBalance || 0) < 0.01) return "Need STX for Fees";
  //   return buyWithSbtc ? "Trade sBTC for Tokens" : "Trade BTC for Tokens";
  // };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-9 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-semibold text-white">Buy $FACES</h2>
          <Info
            className="h-5 w-5 text-muted-foreground cursor-pointer"
            onClick={() => setIsAgentDetailsOpen(true)}
          />
        </div>
      </div>
      {accessToken && (userAddress || btcAddress) && (
        <Dialog open={isAgentDetailsOpen} onOpenChange={setIsAgentDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Trading Process Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2">How it works:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-primary/10 px-1 rounded text-xs mt-0.5">
                      1
                    </span>
                    <span>
                      You spend {buyWithSbtc ? "sBTC" : "BTC"} from your
                      connected wallet
                    </span>
                  </div>
                  {!buyWithSbtc && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono bg-primary/10 px-1 rounded text-xs mt-0.5">
                        2
                      </span>
                      <span>
                        BTC is swapped for sBTC through deposit process
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-primary/10 px-1 rounded text-xs mt-0.5">
                      {buyWithSbtc ? "2" : "3"}
                    </span>
                    <span>sBTC is traded at DEX for {daoName} tokens</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-primary/10 px-1 rounded text-xs mt-0.5">
                      {buyWithSbtc ? "3" : "4"}
                    </span>
                    <span>
                      {daoName} tokens are deposited into your Agent Account
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-sm mb-2 text-amber-800 dark:text-amber-200">
                  Slippage Protection:
                </h4>
                <div className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    • If quote &lt; minimum receive: sBTC sent to Agent Account
                    instead
                  </p>
                  <p>• If quote ≥ minimum receive: Trade continues normally</p>
                  <p>• Current protection: {currentSlippage}%</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                {userAddress && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      User's Address (STX)
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
                {userAgentAddress && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Agent Account
                    </span>
                    <div className="font-mono bg-muted/50 p-2 rounded border break-all">
                      {userAgentAddress}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Main amount input with integrated currency selector */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0006"
              className="text-4xl font-light bg-transparent border-0 p-0 h-auto text-white placeholder:text-zinc-500 focus-visible:ring-0"
              disabled={!accessToken || BUY_DISABLED}
            />
            <div className="text-sm text-zinc-400 mt-1">
              {formatUsdValue(calculateUsdValue(amount))} ~
            </div>
          </div>

          {/* Currency selector */}
          <Select
            value={buyWithSbtc ? "sbtc" : "btc"}
            onValueChange={(value) => setBuyWithSbtc(value === "sbtc")}
            disabled={!accessToken}
          >
            <SelectTrigger className="w-auto bg-orange-500 hover:bg-orange-600 border-0 text-white font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">₿</span>
                </div>
                <SelectValue />
              </div>
              {/* <ChevronDown className="h-4 w-4 ml-2" /> */}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btc">BTC</SelectItem>
              <SelectItem value="sbtc">sBTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Preset amount buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={selectedPreset === "0.0001" ? "default" : "secondary"}
            size="sm"
            onClick={() => handlePresetClick("0.0001")}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            disabled={!accessToken || BUY_DISABLED}
          >
            0.0001 {buyWithSbtc ? "sBTC" : "BTC"}
          </Button>
          <Button
            variant={selectedPreset === "0.0002" ? "default" : "secondary"}
            size="sm"
            onClick={() => handlePresetClick("0.0002")}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            disabled={!accessToken || BUY_DISABLED}
          >
            0.0002 {buyWithSbtc ? "sBTC" : "BTC"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPreset === "max" ? "default" : "secondary"}
            size="sm"
            onClick={async () => {
              await handleMaxClick();
              setSelectedPreset("max");
            }}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            disabled={!accessToken || BUY_DISABLED}
          >
            MAX
          </Button>
        </div>
      </div>
      {/* Available Balance */}
      {accessToken && (
        <div className="text-sm text-zinc-400">
          Available Balance:{" "}
          <button
            onClick={() => {
              const balance = buyWithSbtc ? sbtcBalance : btcBalance;
              if (balance !== null && balance !== undefined) {
                setAmount(balance.toFixed(8));
                setSelectedPreset(null);
              }
            }}
            className="text-orange-500"
            disabled={
              buyWithSbtc
                ? isSbtcBalanceLoading ||
                  sbtcBalance === null ||
                  sbtcBalance === undefined
                : isBalanceLoading ||
                  btcBalance === null ||
                  btcBalance === undefined
            }
          >
            {buyWithSbtc
              ? isSbtcBalanceLoading
                ? "Loading..."
                : sbtcBalance !== null && sbtcBalance !== undefined
                  ? `${sbtcBalance.toFixed(8)} sBTC`
                  : "Unable to load balance"
              : isBalanceLoading
                ? "Loading..."
                : btcBalance !== null && btcBalance !== undefined
                  ? `${btcBalance.toFixed(8)} BTC`
                  : "Unable to load balance"}
          </button>
        </div>
      )}
      {/* Quote display */}
      {buyQuote && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-semibold text-white">
            {buyQuote} $FACES
          </div>
          {loadingQuote && (
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      )}
      {/* Place Order Button */}
      <Button
        onClick={handleDepositConfirm}
        disabled={
          !accessToken ||
          !hasAgentAccount ||
          parseFloat(amount) <= 0 ||
          isSubmitting ||
          BUY_DISABLED ||
          (buyWithSbtc && (stxBalance || 0) < 0.01)
        }
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 text-lg"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <Loader />
            <span>Processing...</span>
          </div>
        ) : (
          "Place Order"
        )}
      </Button>
      {!accessToken && (
        <div className="text-center">
          <AuthButton />
        </div>
      )}
    </div>
  );
}
