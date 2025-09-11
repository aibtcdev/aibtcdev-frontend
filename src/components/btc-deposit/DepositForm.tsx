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
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import {
  cvToHex,
  uintCV,
  hexToCV,
  cvToJSON,
  Pc,
  contractPrincipalCV,
  Cl,
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
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import {
  connectWallet,
  requestSignature,
} from "@/components/auth/StacksProvider";
import { supabase } from "@/utils/supabase/client";
import { createDaoAgent } from "@/services/dao-agent.service";
import { TermsOfService } from "@/components/terms-and-condition/TermsOfService";
import { DialogFooter } from "@/components/ui/dialog";

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
  targetStx?: number;
  tokenContract: string;
  currentSlippage?: number;
  swapType: "aibtc" | "sbtc";
  poolId: string;
  aiAccountReceiver: string;
  isMarketOpen?: boolean | null;
  prelaunchContract?: string;
  poolContract?: string;
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

interface AddressEntry {
  symbol?: string;
  address: string;
  publicKey: string;
}

interface UserData {
  addresses: AddressEntry[];
}

// Network configuration
const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";

// Network-specific configuration
const NETWORK_CONFIG = {
  HIRO_API_URL: isMainnet
    ? "https://api.hiro.so"
    : "https://api.testnet.hiro.so",
  SBTC_CONTRACT: isMainnet
    ? "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"
    : "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token",
};

// Helper function to get token asset name
const getTokenAssetName = (symbol: string): string => {
  return symbol.toLowerCase();
};

export default function DepositForm({
  btcUsdPrice,
  poolStatus,
  setConfirmationData,
  setShowConfirmation,
  activeWalletProvider,
  dexContract,
  daoName,
  userAddress,
  dexId,
  targetStx = 0,
  tokenContract,
  currentSlippage = 4,
  swapType,
  poolId,
  aiAccountReceiver,
  isMarketOpen,
  prelaunchContract,
  poolContract,
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
  const [buyWithSbtc, setBuyWithSbtc] = useState<boolean>(!isMainnet); // Default to sBTC on testnet, BTC on mainnet
  const [minTokenOut, setMinTokenOut] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [pendingOrderAfterConnection, setPendingOrderAfterConnection] =
    useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const { transactionStatus, transactionMessage, reset, startMonitoring } =
    useTransactionVerification();

  // Start monitoring when modal opens with transaction ID
  useEffect(() => {
    if (isModalOpen && activeTxId) {
      console.log("Starting transaction monitoring for:", activeTxId);
      startMonitoring(activeTxId).catch(console.error);
    }
  }, [isModalOpen, activeTxId, startMonitoring]);

  // Add fee rate fetching function
  const fetchMempoolFeeEstimates = async () => {
    try {
      const response = await fetch(
        `https://mempool.space/api/v1/fees/recommended`
      );
      const data = await response.json();

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
      return {
        low: 1,
        medium: 3,
        high: 5,
      };
    }
  };

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();
  const hasAccessToken = !!accessToken && !isLoading;

  // Get addresses from the lib - only if we have a session
  const { userAgentAddress } = useAgentAccount();
  const hasAgentAccount = Boolean(userAgentAddress);
  const connectedUserAddress = getStacksAddress();

  // Use prop userAddress if provided, otherwise use connected address
  const effectiveUserAddress = userAddress || connectedUserAddress;

  const btcAddress = effectiveUserAddress ? getBitcoinAddress() : null;

  useEffect(() => {
    if (btcAddress) {
      console.log(`Querying BTC balance for address: ${btcAddress}`);
    }
  }, [btcAddress]);

  // Fetch STX balance for transaction fees
  const { data: stxBalance } = useQuery<number | null>({
    queryKey: ["stxBalance", effectiveUserAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const response = await fetch(
        `${NETWORK_CONFIG.HIRO_API_URL}/extended/v1/address/${userAddress}/balances`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch STX balance");
      }
      const data = await response.json();
      return parseInt(data.stx.balance) / 10 ** 6;
    },
    enabled: hasAccessToken && !!userAddress && buyWithSbtc,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: sbtcBalance, isLoading: isSbtcBalanceLoading } = useQuery<
    number | null
  >({
    queryKey: ["sbtcBalance", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const response = await fetch(
        `${NETWORK_CONFIG.HIRO_API_URL}/extended/v1/address/${userAddress}/balances`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sBTC balance");
      }
      const data = await response.json();
      const sbtcAssetIdentifier = `${NETWORK_CONFIG.SBTC_CONTRACT}::sbtc-token`;
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
      if (!dexContract) return null;
      // Use a default address for quote calculation when not authenticated
      const senderAddress =
        userAddress || "SP2Z94F6QX847PMXTPJJ2ZCCN79JZDW3PJ4E6ZABY";
      const [contractAddress, contractName] = dexContract.split(".");
      try {
        const btcAmount = parseFloat(amount) * Math.pow(10, 8);
        const url = `${NETWORK_CONFIG.HIRO_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/get-in?tip=latest`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: senderAddress,
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
    }, 500);

    return () => clearTimeout(debounce);
  }, [amount, getBuyQuote, currentSlippage]);

  //TODO: DISPLAY SEATS INSTEAD OF AMOUNT WHEN PRELAUNCH

  // Fetch BTC balance using React Query with 40-minute cache
  const { data: btcBalance, isLoading: isBalanceLoading } = useQuery<
    number | null
  >({
    queryKey: ["btcBalance", btcAddress],
    queryFn: async () => {
      if (!btcAddress) return null;

      // Use testnet API for testnet, mainnet API for mainnet
      const blockstreamUrl = isMainnet
        ? `https://blockstream.info/api/address/${btcAddress}/utxo`
        : `https://blockstream.info/testnet/api/address/${btcAddress}/utxo`;

      // console.log("blockstreamUrl", blockstreamUrl);

      const response = await fetch(blockstreamUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const utxos = await response.json();
      const totalSats = utxos.reduce(
        (sum: number, utxo: UTXO) => sum + utxo.value,
        0
      );
      return totalSats / 100000000;
    },
    enabled: hasAccessToken && !!btcAddress && !buyWithSbtc,
    staleTime: 40 * 60 * 1000,
    retry: 2,
    refetchOnMount: true,
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

  // Memoize calculateFee to ensure stable reference
  const calculateFee = useCallback(
    (btcAmount: string): string => {
      if (buyWithSbtc) return "0.00000000";
      if (!btcAmount || Number.parseFloat(btcAmount) <= 0) return "0.00000000";
      const numAmount = Number.parseFloat(btcAmount);
      if (isNaN(numAmount)) return "0.00003000";

      return numAmount <= 0.002 ? "0.00003000" : "0.00006000";
    },
    [buyWithSbtc]
  );

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

  const handleWalletAuth = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      toast({
        title: "Connecting wallet...",
        description: "Please connect your wallet to continue.",
      });

      const data = await connectWallet({
        onCancel: () => {
          toast({
            title: "Connection cancelled",
            description: "Wallet connection was cancelled.",
            variant: "destructive",
          });
          setPendingOrderAfterConnection(false);
          setIsAuthenticating(false);
        },
      });

      setUserData(data);
      setShowTerms(true);
      setIsAuthenticating(false);
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
      setPendingOrderAfterConnection(false);
      setIsAuthenticating(false);
    }
  }, [toast]);

  const handleAcceptTerms = async () => {
    if (!userData || !hasScrolledToBottom) return;

    setIsAuthenticating(true);
    setShowTerms(false);

    try {
      const stxAddress = getStacksAddress();
      if (!stxAddress) {
        throw new Error("No STX address found in wallet data");
      }

      toast({
        title: "Please sign the message to authenticate...",
      });

      const signature = await requestSignature();

      toast({
        title: "Signature received. Authenticating...",
      });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${stxAddress}@stacks.id`,
        password: signature,
      });

      if (signInError && signInError.status === 400) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: `${stxAddress}@stacks.id`,
          password: signature,
        });

        if (signUpError) throw signUpError;

        try {
          await createDaoAgent();
          toast({
            title: "DAO Agent Initialized",
            description: "Your DAO agent has been set up successfully.",
          });
        } catch (error) {
          console.error("Error initializing DAO agent:", error);
        }

        toast({
          title: "Account created",
          description: "Successfully signed up and connected wallet.",
        });
      } else if (signInError) {
        throw signInError;
      } else {
        toast({
          title: "Connected",
          description: "Wallet connected successfully.",
        });
      }

      setIsAuthenticating(false);
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: "Authentication failed. Please try again.",
        variant: "destructive",
      });
      setPendingOrderAfterConnection(false);
      setIsAuthenticating(false);
    }
  };

  const handleScrollComplete = (isComplete: boolean) => {
    setHasScrolledToBottom(isComplete);
  };

  const handleBuyWithSbtc = useCallback(async () => {
    // If wallet not connected, trigger auth and set pending order flag
    if (!accessToken || !userAddress) {
      setPendingOrderAfterConnection(true);
      await handleWalletAuth();
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

    setIsSubmitting(true);

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
      const [sbtcAddress, sbtcName] = NETWORK_CONFIG.SBTC_CONTRACT.split(".");

      const args = [contractPrincipalCV(tokenAddress, tokenName), uintCV(ustx)];
      const assetName = getTokenAssetName(daoName);

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
        setActiveTxId(response.txid);
        setIsModalOpen(true);

        // Add fallback check after 30 seconds
        setTimeout(async () => {
          if (transactionStatus === "pending") {
            try {
              const isMainnet =
                process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
              const apiUrl = isMainnet
                ? "https://api.mainnet.hiro.so"
                : "https://api.testnet.hiro.so";

              const txResponse = await fetch(
                `${apiUrl}/extended/v1/tx/${response.txid}`
              );
              if (txResponse.ok) {
                const txData = await txResponse.json();
                console.log("Fallback transaction check:", txData);

                // Force status update if API shows different status
                if (txData.tx_status === "success") {
                  // Transaction is actually confirmed but WebSocket missed it
                  console.log("Transaction confirmed via fallback check");
                } else if (
                  ["abort_by_response", "abort_by_post_condition"].includes(
                    txData.tx_status
                  )
                ) {
                  console.log("Transaction failed via fallback check");
                }
              }
            } catch (error) {
              console.error("Fallback transaction check failed:", error);
            }
          }
        }, 30000);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    userAddress,
    amount,
    rawBuyQuote,
    sbtcBalance,
    targetStx,
    currentSlippage,
    dexContract,
    tokenContract,
    daoName,
    transactionStatus,
    toast,
    handleWalletAuth,
  ]);

  // TODO
  const handleBuyWithBtcOnTestnet = useCallback(async () => {
    console.log("CALLING BUY WITH BITCOIN ON TESTNET...");
    // If wallet not connected, trigger auth and set pending order flag
    if (!accessToken || !userAddress) {
      setPendingOrderAfterConnection(true);
      await handleWalletAuth();
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

    const ustx = parseFloat(amount) * Math.pow(10, 8);
    console.log("USTX: ", ustx);

    if (!rawBuyQuote?.result) {
      toast({
        title: "Error",
        description: "Failed to get quote for buy order.",
        variant: "destructive",
      });
      return;
    }

    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));
    console.log("SBTC BALANCE", sbtcBalanceInSats);

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

    setIsSubmitting(true);

    try {
      const clarityValue = hexToCV(rawBuyQuote.result);
      const jsonValue = cvToJSON(clarityValue);

      const quoteAmount = jsonValue.value.value["tokens-out"].value;
      // const quoteAmount = 0;
      const newStx = Number(jsonValue.value.value["new-stx"].value);
      // const newStx = Number(0);
      const tokenBalance = jsonValue.value.value["ft-balance"]?.value;
      // const tokenBalance = 0;
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

      // const [dexAddress, dexName] = dexContract.split(".");
      // const [tokenAddress, tokenName] = tokenContract.split(".");
      // const [sbtcAddress, sbtcName] = SBTC_CONTRACT.split(".");

      // const tokenAddressTestnet: string =
      //   "ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.visvasa1-faktory";
      // const dexAddressTestnet: string =
      //   "ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.visvasa1-faktory-dex";
      // const sbtcTokenAddress: string =
      //   "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";
      // const preLaunch: string =
      //   "ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.visvasa1-pre-faktory";
      // const pool: string =
      //   "ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.xyk-pool-sbtc-visvasa1-v-1-1";

      // Use dynamic contract addresses from props
      const [tokenAddress, tokenName] = tokenContract.split(".");
      const [dexAddress, dexName] = dexContract.split(".");
      const [prelaunchAddress, prelaunchName] = (
        prelaunchContract || dexContract
      ).split(".");
      const [poolAddress, poolName] = (poolContract || dexContract).split(".");

      // Network-aware sBTC contract
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
      const sbtcContract = isMainnet
        ? "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"
        : "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";
      const [sbtcAddress, sbtcName] = sbtcContract.split(".");

      const args = [
        Cl.uint(ustx),
        Cl.uint(minTokensOut),
        Cl.uint(1),
        Cl.contractPrincipal(tokenAddress, tokenName), // token contract
        Cl.contractPrincipal(dexAddress, dexName), // dex contract
        Cl.contractPrincipal(prelaunchAddress, prelaunchName), // prelaunch contract
        Cl.contractPrincipal(poolAddress, poolName), // pool contract
        Cl.contractPrincipal(sbtcAddress, sbtcName), // sbtc contract
      ];
      console.log("ARGUMENTS FOR BUYWITH BTC ON TESTNET", args);
      // const assetName = getTokenAssetName(daoName);

      // HELPER FUNCTION TO DETERMINE IF THE TOKEN IS BONDED OR IN DEX
      // IF BONDED USE POSTCONDITION FOR POOL IF IN DEX POST CONDITION FOR DEX OR ELSE USE THE POSTCONDITION FOR PRELAUNCH
      // POST CONDITION FOR POOL
      // 1. user sends sbtc, 2. A bridge contract sends sbtc, 3. bitflow contract send ft-amount, 4. bridge contract send ft-amount.

      // POST CONDITION FOR DEX
      // const TARGET_STX = targetStx * Math.pow(10, 8);
      // const isLastBuy = targetStx > 0 && currentStxBalance + ustx >= TARGET_STX;

      // const postConditions = isLastBuy
      //   ? [
      //       Pc.principal(userAddress)
      //         .willSendLte(ustx)
      //         .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      //       Pc.principal(`${dexAddress}.${dexName}`)
      //         .willSendGte(tokenBalance)
      //         .ft(`${tokenAddress}.${tokenName}`, assetName),
      //       Pc.principal(`${dexAddress}.${dexName}`)
      //         .willSendGte(TARGET_STX)
      //         .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      //     ]
      //   : [
      //       Pc.principal(userAddress)
      //         .willSendLte(ustx)
      //         .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      //       Pc.principal(`${dexAddress}.${dexName}`)
      //         .willSendGte(minTokensOut)
      //         .ft(`${tokenAddress}.${tokenName}`, assetName),
      //     ];

      // POST CONDITION FOR PRELAUNCH
      // 1. user sends sbtc and bridge-contract is also sending amount, if last buy prelaunch contract is sending the total ft-amount

      const assetName = getTokenAssetName(daoName);

      // Post conditions for testnet BTC swap
      const postConditions = [
        // User sends sBTC to the bridge contract
        Pc.principal(userAddress)
          .willSendLte(ustx)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
        // Bridge contract will send tokens to user
        Pc.principal(
          `ST29D6YMDNAKN1P045T6Z817RTE1AC0JAAAG2EQZZ.btc2aibtc-simulation`
        )
          .willSendGte(minTokensOut)
          .ft(`${tokenAddress}.${tokenName}`, assetName),
      ];

      const params = {
        contract:
          `ST29D6YMDNAKN1P045T6Z817RTE1AC0JAAAG2EQZZ.btc2aibtc-simulation` as `${string}.${string}`,
        functionName: "swap-btc-to-aibtc",
        functionArgs: args,
        postConditions,
      };

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        setActiveTxId(response.txid);
        setIsModalOpen(true);

        // Add fallback check after 30 seconds
        setTimeout(async () => {
          if (transactionStatus === "pending") {
            try {
              const isMainnet =
                process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
              const apiUrl = isMainnet
                ? "https://api.mainnet.hiro.so"
                : "https://api.testnet.hiro.so";

              const txResponse = await fetch(
                `${apiUrl}/extended/v1/tx/${response.txid}`
              );
              if (txResponse.ok) {
                const txData = await txResponse.json();
                console.log("Fallback transaction check:", txData);

                // Force status update if API shows different status
                if (txData.tx_status === "success") {
                  // Transaction is actually confirmed but WebSocket missed it
                  console.log("Transaction confirmed via fallback check");
                } else if (
                  ["abort_by_response", "abort_by_post_condition"].includes(
                    txData.tx_status
                  )
                ) {
                  console.log("Transaction failed via fallback check");
                }
              }
            } catch (error) {
              console.error("Fallback transaction check failed:", error);
            }
          }
        }, 30000);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    userAddress,
    amount,
    rawBuyQuote,
    sbtcBalance,
    targetStx,
    currentSlippage,
    daoName,
    dexContract,
    tokenContract,
    prelaunchContract,
    poolContract,
    transactionStatus,
    toast,
    handleWalletAuth,
  ]);
  // Memoized error handlers
  const isAddressTypeError = useCallback((error: Error): boolean => {
    return (
      error.message.includes("inputType: sh without redeemScript") ||
      error.message.includes("P2SH") ||
      error.message.includes("redeem script")
    );
  }, []);

  const handleAddressTypeError = useCallback(
    (error: Error, walletProvider: "leather" | "xverse" | null): void => {
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
    },
    [toast]
  );

  const isInscriptionError = useCallback((error: Error): boolean => {
    return error.message.includes("with inscriptions");
  }, []);

  const handleInscriptionError = useCallback(
    (error: Error): void => {
      toast({
        title: "Inscriptions Detected",
        description: error.message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const isUtxoCountError = useCallback((error: Error): boolean => {
    return error.message.includes("small UTXOs");
  }, []);

  const handleUtxoCountError = useCallback(
    (error: Error): void => {
      toast({
        title: "Too Many UTXOs",
        description: error.message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const handleDepositConfirm = useCallback(async (): Promise<void> => {
    // If wallet not connected, trigger auth and set pending order flag
    if (!accessToken || !userAddress) {
      setPendingOrderAfterConnection(true);
      await handleWalletAuth();
      return;
    }

    if (buyWithSbtc) {
      await handleBuyWithSbtc();
      return;
    }

    // Network-specific BTC handling
    if (!isMainnet) {
      // Testnet: BTC selection uses handleBuyWithBtcOnTestnet
      // This handles different contract states (bonded, prelaunch, etc.)
      await handleBuyWithBtcOnTestnet();
      return;
    }

    // Mainnet: Regular L1 BTC handling continues below

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

    const networkFeeInBTC = 0.000006;
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
  }, [
    accessToken,
    userAddress,
    buyWithSbtc,
    amount,
    btcAddress,
    btcBalance,
    toast,
    handleBuyWithSbtc,
    handleBuyWithBtcOnTestnet,
    handleWalletAuth,
    activeWalletProvider,
    minTokenOut,
    swapType,
    poolId,
    dexId,
    aiAccountReceiver,
    setConfirmationData,
    setShowConfirmation,
    calculateFee,
    isInscriptionError,
    handleInscriptionError,
    isUtxoCountError,
    handleUtxoCountError,
    isAddressTypeError,
    handleAddressTypeError,
  ]);

  // Auto-place order after wallet connection - wait for all data to load
  useEffect(() => {
    if (
      pendingOrderAfterConnection &&
      hasAccessToken &&
      userAddress &&
      !loadingQuote &&
      !isBalanceLoading &&
      buyQuote !== null
    ) {
      if (hasAgentAccount) {
        // Agent account is ready, proceed with order
        setPendingOrderAfterConnection(false);
        setIsAuthenticating(false);
        setTimeout(() => {
          handleDepositConfirm();
        }, 1000);
      } else {
        // Agent account not ready, show message and reset after timeout
        setTimeout(() => {
          if (!hasAgentAccount) {
            setPendingOrderAfterConnection(false);
            setIsAuthenticating(false);
            toast({
              title: "Agent Account Required",
              description:
                "Your agent account is still being deployed. Please try again in a few minutes.",
              variant: "destructive",
            });
          }
        }, 30000); // 30 second timeout
      }
    }
  }, [
    pendingOrderAfterConnection,
    hasAccessToken,
    userAddress,
    loadingQuote,
    isBalanceLoading,
    buyQuote,
    hasAgentAccount,
    handleDepositConfirm,
    toast,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 md:space-y-6 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-semibold text-white">Buy ${daoName}</h2>
          <Info
            className="h-5 w-5 text-muted-foreground cursor-pointer"
            onClick={() => setIsAgentDetailsOpen(true)}
          />
        </div>
      </div>

      {/* Show dialog when authenticated and has addresses */}
      {hasAccessToken && (userAddress || btcAddress) && (
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
      <div className=" border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0006"
              className="text-4xl font-light bg-transparent border-0 p-0 h-auto text-white placeholder:text-zinc-500 focus-visible:ring-0"
              disabled={!hasAccessToken || BUY_DISABLED}
            />
            <div className="text-sm text-zinc-400 mt-1">
              {formatUsdValue(calculateUsdValue(amount))} ~
            </div>
          </div>

          {/* Currency selector - Network aware */}
          <Select
            value={buyWithSbtc ? "sbtc" : "btc"}
            onValueChange={(value) => setBuyWithSbtc(value === "sbtc")}
            disabled={!hasAccessToken}
          >
            <SelectTrigger className="w-auto bg-primary hover:bg-primary/90 border-0 text-primary-foreground font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">
                    ₿
                  </span>
                </div>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* Testnet: Show BTC (testnet) and sBTC options */}
              {!isMainnet && (
                <>
                  <SelectItem value="btc">BTC (Testnet)</SelectItem>
                  <SelectItem value="sbtc">sBTC</SelectItem>
                </>
              )}
              {/* Mainnet: Show L1 BTC and sBTC options */}
              {isMainnet && (
                <>
                  <SelectItem value="btc">BTC (L1)</SelectItem>
                  <SelectItem value="sbtc">sBTC</SelectItem>
                </>
              )}
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
            0.0001 {buyWithSbtc ? "sBTC" : isMainnet ? "BTC" : "BTC (Testnet)"}
          </Button>
          <Button
            variant={selectedPreset === "0.0002" ? "default" : "secondary"}
            size="sm"
            onClick={() => handlePresetClick("0.0002")}
            className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
            disabled={!accessToken || BUY_DISABLED}
          >
            0.0002 {buyWithSbtc ? "sBTC" : isMainnet ? "BTC" : "BTC (Testnet)"}
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
            tabIndex={0}
            aria-label="Set amount to maximum available balance"
          >
            MAX
          </Button>
        </div>
      </div>

      {/* Available Balance - Show disabled version when not authenticated */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">
            Available Balance
          </span>
          {hasAccessToken ? (
            <button
              onClick={() => {
                const balance = buyWithSbtc ? sbtcBalance : btcBalance;
                if (balance !== null && balance !== undefined) {
                  setAmount(balance.toFixed(8));
                  setSelectedPreset(null);
                }
              }}
              className="text-white font-bold hover:text-primary transition-colors"
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
          ) : (
            <span className="text-zinc-500 font-bold">N/A</span>
          )}
        </div>
      </div>

      {/* Quote display */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center min-h-[84px] flex items-center justify-center">
        {loadingQuote ? (
          <div className="flex items-center gap-2">
            <Loader />
            <span className="text-sm text-zinc-400">Fetching quote…</span>
          </div>
        ) : (
          <div className="text-2xl font-semibold text-white">
            {buyQuote || "0.00"} ${daoName}
          </div>
        )}
      </div>

      {/* Place Order Button */}
      <Button
        onClick={handleDepositConfirm}
        disabled={
          parseFloat(amount) <= 0 ||
          isSubmitting ||
          pendingOrderAfterConnection ||
          isAuthenticating ||
          BUY_DISABLED ||
          (hasAccessToken && buyWithSbtc && (stxBalance || 0) < 0.01) ||
          (hasAccessToken && !hasAgentAccount) ||
          isMarketOpen === false
        }
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <Loader />
            <span>Processing...</span>
          </div>
        ) : pendingOrderAfterConnection || isAuthenticating ? (
          <div className="flex items-center space-x-2">
            <Loader />
            <span>Connecting & Loading...</span>
          </div>
        ) : isMarketOpen === false ? (
          <span>Market Closed</span>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                ₿
              </span>
            </div>
            <span>Place Order</span>
          </div>
        )}
      </Button>

      {hasAccessToken && !hasAgentAccount && (
        <div className="text-center p-4 bg-yellow-900/40 border border-yellow-800 rounded-lg">
          <p className="text-yellow-200 text-sm">
            Your agent account is being deployed. Please check back in a few
            minutes.
          </p>
        </div>
      )}

      {(buyWithSbtc || (!isMainnet && !buyWithSbtc)) && (
        <TransactionStatusModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setActiveTxId(null);
          }}
          txId={activeTxId ?? undefined}
          transactionStatus={transactionStatus}
          transactionMessage={transactionMessage}
          title={buyWithSbtc ? "sBTC Transaction" : "BTC Transaction"}
          successTitle="Buy Order Confirmed"
          failureTitle="Buy Order Failed"
          successDescription={`Your transaction to buy ${daoName} tokens has been successfully confirmed.`}
          failureDescription="The transaction could not be completed. Please check your balance and try again."
          pendingDescription="Your transaction is being processed. This may take a few minutes."
          onRetry={buyWithSbtc ? handleBuyWithSbtc : handleBuyWithBtcOnTestnet}
        />
      )}

      {/* Terms & Conditions Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[900px] h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Terms & Conditions
            </DialogTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Please read the complete terms and scroll to the bottom to
              continue.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <TermsOfService onScrollComplete={handleScrollComplete} />
          </div>

          <DialogFooter className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={() => {
                  setShowTerms(false);
                  setPendingOrderAfterConnection(false);
                  setIsAuthenticating(false);
                }}
                variant="outline"
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptTerms}
                disabled={isAuthenticating || !hasScrolledToBottom}
                className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
                  hasScrolledToBottom
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
                title={
                  !hasScrolledToBottom
                    ? "Please scroll to the bottom to read all terms"
                    : ""
                }
              >
                {isAuthenticating ? (
                  <>
                    <Loader />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  <>
                    {hasScrolledToBottom
                      ? "Accept & Continue"
                      : "Please scroll to continue"}
                  </>
                )}
              </Button>
            </div>
            {!hasScrolledToBottom && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                You must read all terms before accepting
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
