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
import { Card, CardContent } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
}: DepositFormProps) {
  // SET IT TO TRUE IF YOU WANT TO DISABLE BUY
  const BUY_DISABLED = false;
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
  const [rawBuyQuote, setRawBuyQuote] = useState<HiroGetInResponse | null>(
    null
  );
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [buyWithSbtc, setBuyWithSbtc] = useState<boolean>(false);

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();

  // Get addresses from the lib - only if we have a session
  const { userAgentAddress } = useAgentAccount();
  const hasAgentAccount = Boolean(userAgentAddress);
  const userAddress = getStacksAddress();

  const btcAddress = userAddress ? getBitcoinAddress() : null;

  // Fetch STX balance for transaction fees
  const { data: stxBalance, isLoading: isStxBalanceLoading } = useQuery<
    number | null
  >({
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
        setRawBuyQuote(null);
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
    if (buyWithSbtc) return "0.00";
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

  const handleBuyWithSbtc = async () => {
    if (!accessToken || !userAddress) {
      toast({
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Check STX balance for transaction fees
    if ((stxBalance || 0) < 0.01) {
      toast({
        title: "STX Required for Transaction Fees",
        description: "You need at least 0.01 STX to pay for transaction fees.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const ustx = Math.floor(parseFloat(amount) * Math.pow(10, 8)); // 8 decimals for BTC

    if (!rawBuyQuote?.result) {
      toast({
        title: "Error",
        description: "Failed to get quote for buy order.",
        variant: "destructive",
      });
      return;
    }

    // Parse buyQuote result to get all necessary data
    const clarityValue = hexToCV(rawBuyQuote.result);
    const jsonValue = cvToJSON(clarityValue);
    const quoteAmount = jsonValue.value?.value?.["tokens-out"]?.value;
    const newStx = Number(jsonValue.value?.value?.["new-stx"]?.value || 0);
    const tokenBalance = jsonValue.value?.value?.["ft-balance"]?.value;
    const currentStxBalance = Number(
      jsonValue.value?.value?.["total-stx"]?.value || 0
    );

    if (!quoteAmount || !newStx || !tokenBalance) {
      toast({
        title: "Error",
        description: "Invalid quote response",
        variant: "destructive",
      });
      return;
    }

    // Check target limit logic
    if (targetStx > 0) {
      const TARGET_STX = targetStx * Math.pow(10, 8); // 8 decimals for BTC
      const remainingToTarget = Math.max(0, TARGET_STX - currentStxBalance);
      const bufferAmount = remainingToTarget * 1.15; // 15% buffer

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

    const assetName = getTokenAssetName(daoName);

    // Determine if this is the last buy
    const TARGET_STX = targetStx * Math.pow(10, 8);
    const isLastBuy = targetStx > 0 && currentStxBalance + ustx >= TARGET_STX;

    // Enhanced post conditions logic
    const postConditions = isLastBuy
      ? [
          // Last buy conditions
          // 1. User's sBTC out
          Pc.principal(userAddress)
            .willSendLte(ustx)
            .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
          // 2. Contract's all tokens out
          Pc.principal(`${dexAddress}.${dexName}`)
            .willSendGte(tokenBalance)
            .ft(`${tokenAddress}.${tokenName}`, assetName),
          // 3. Contract's total sBTC out
          Pc.principal(`${dexAddress}.${dexName}`)
            .willSendGte(TARGET_STX)
            .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
        ]
      : [
          // Normal buy conditions
          Pc.principal(userAddress)
            .willSendLte(ustx)
            .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
          Pc.principal(`${dexAddress}.${dexName}`)
            .willSendGte(minTokensOut)
            .ft(`${tokenAddress}.${tokenName}`, assetName),
        ];

    try {
      const params = {
        contract: `${dexAddress}.${dexName}` as `${string}.${string}`,
        functionName: "buy",
        functionArgs: [
          contractPrincipalCV(tokenAddress, tokenName),
          uintCV(ustx),
        ],
        postConditions,
        // eslint-disable-next-line
        onFinish: (data: any) => {
          toast({
            title: "Transaction Submitted",
            description: `Your transaction to buy ${daoName} tokens has been submitted. TxID: ${data.txId}`,
          });
          // You may want to add additional success handling here
        },
        onCancel: () => {
          toast({
            title: "Transaction Canceled",
            description: "You have canceled the transaction.",
            variant: "destructive",
          });
        },
      };

      await request("stx_callContract", params);
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
        title: "Not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    if (!hasAgentAccount) {
      toast({
        title: "No Agent Account",
        description:
          "You don't have an agent account yet. Please create one before depositing.",
        variant: "destructive",
      });
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
        console.log("preparing transaction...");
        const transactionData = await styxSDK.prepareTransaction({
          amount: totalAmount,
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
          dexId: dexId,
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
  const presetLabels: string[] = [
    `0.0001 ${buyWithSbtc ? "sBTC" : "BTC"}`,
    `0.0002 ${buyWithSbtc ? "sBTC" : "BTC"}`,
  ];

  const getButtonText = () => {
    if (BUY_DISABLED) return "Buy Available Soon";
    if (!accessToken) return "Connect Wallet";
    if (!hasAgentAccount) return "No Agent Account";
    if (buyWithSbtc && (stxBalance || 0) < 0.01) return "Need STX for Fees";
    return buyWithSbtc ? "Buy with sBTC" : "Deposit with BTC";
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
                {userAgentAddress && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-muted-foreground">
                      Agent account
                    </span>
                    <div className="font-mono bg-muted/50 p-2 rounded border break-all">
                      {userAgentAddress}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center space-x-2 justify-end">
        <Label htmlFor="sbtc-switch">Buy with sBTC</Label>
        <Switch
          id="sbtc-switch"
          checked={buyWithSbtc}
          onCheckedChange={setBuyWithSbtc}
          disabled={!accessToken}
        />
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
            className="text-right pr-16 pl-12 h-12 text-lg"
            disabled={!accessToken || BUY_DISABLED}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
            {buyWithSbtc ? "sBTC" : "BTC"}
          </span>
        </div>

        {accessToken && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              Available Balance:{" "}
              {buyWithSbtc
                ? isSbtcBalanceLoading
                  ? "Loading..."
                  : sbtcBalance !== null && sbtcBalance !== undefined
                    ? `${sbtcBalance.toFixed(8)} sBTC`
                    : "Unable to load balance"
                : isBalanceLoading
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

        {buyWithSbtc && accessToken && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-muted-foreground">
              STX Balance:{" "}
              {isStxBalanceLoading
                ? "Loading..."
                : stxBalance !== null && stxBalance !== undefined
                  ? `${stxBalance.toFixed(6)} STX`
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
              disabled={!accessToken || BUY_DISABLED}
            >
              {presetLabels[index]}
            </Button>
          ))}
          <Button
            size="sm"
            variant={selectedPreset === "max" ? "default" : "outline"}
            onClick={handleMaxClick}
            disabled={
              !accessToken ||
              BUY_DISABLED ||
              (buyWithSbtc
                ? sbtcBalance === null || sbtcBalance === undefined
                : btcBalance === null || btcBalance === undefined)
            }
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
          Includes {currentSlippage}% slippage protection
        </div>
      </div>

      <Card className="border-border/30">
        <CardContent className="p-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Your Deposit</span>
            <span>
              {amount || "0.00"} {buyWithSbtc ? "sBTC" : "BTC"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1">
            <span className="text-muted-foreground">Service Fee</span>
            <span>
              {calculateFee(amount)} {buyWithSbtc ? "sBTC" : "BTC"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium mt-2 pt-2 border-t border-border/30">
            <span>Total</span>
            <span>
              {(Number(amount || 0) + Number(calculateFee(amount))).toFixed(8)}{" "}
              {buyWithSbtc ? "sBTC" : "BTC"}
            </span>
          </div>
        </CardContent>
      </Card>

      <>
        {!accessToken && (
          <p className="text-center text-sm text-muted-foreground mb-1">
            Connect your wallet to continue
          </p>
        )}
        {accessToken && !hasAgentAccount && (
          <p className="text-center text-sm text-destructive mb-1">
            You don't have an agent account. Please create one before
            depositing.
          </p>
        )}
        {buyWithSbtc && accessToken && (stxBalance || 0) < 0.01 && (
          <p className="text-center text-sm text-destructive mb-1">
            You need at least 0.01 STX for transaction fees.
          </p>
        )}
        {!accessToken ? (
          <div className="flex justify-center">
            <AuthButton />
          </div>
        ) : (
          <Button
            size="lg"
            className="h-12 text-lg bg-primary w-full"
            onClick={handleDepositConfirm}
            disabled={
              !hasAgentAccount ||
              !accessToken ||
              BUY_DISABLED ||
              (buyWithSbtc && (stxBalance || 0) < 0.01)
            }
          >
            {getButtonText()}
          </Button>
        )}
      </>
    </div>
  );
}
