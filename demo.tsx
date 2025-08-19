import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Button,
  FormControl,
  InputGroup,
  NumberInput,
  NumberInputField,
  InputRightElement,
  VStack,
  HStack,
  useToast,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Progress,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Tbody,
  Td,
  Tr,
  useDisclosure,
  Link,
  SimpleGrid,
  Card,
} from "@chakra-ui/react";
import { Settings } from "lucide-react";
import { useConnect } from "@stacks/connect-react";
import { useUserSession } from "../../context/UserSessionContext";
import {
  contractPrincipalCV,
  FungibleConditionCode,
  Pc, // New post condition builder
  PostConditionMode,
  uintCV,
  hexToCV,
  cvToJSON,
  bufferCV,
  someCV,
  cvToHex,
} from "@stacks/transactions";
import Token from "../entities/Token";
import TokenSvg from "../../utils/TokenSvg";
import CoinSvg from "../utils/CoinSvg";
import { useQuery } from "@tanstack/react-query";
import SlippageModal from "./SlippageModal";
import ConfirmationModal from "./ConfirmationModal";
import {
  stacksApiClient,
  ReadOnlyFunctionSuccessResponse,
} from "../services/stacks-api-client";
// import { usePriceSTX } from "../hooks/usePriceSTX";
// import { usePriceBTC } from "../hooks/usePriceBTC";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { keyframes } from "@emotion/react";
import { StyxSDK } from "@faktoryfun/styx-sdk";

import { Deposit, TransactionPriority } from "@faktoryfun/styx-sdk";
import { MIN_DEPOSIT_SATS, MAX_DEPOSIT_SATS } from "@faktoryfun/styx-sdk";
import * as btc from "@scure/btc-signer";
import { hex } from "@scure/base";
import { request as xverseRequest } from "sats-connect";
import { getTokenAssetName } from "../utils/TokenContracts";
import { request } from "@stacks/connect";
import useSdkPoolStatus from "../../hooks/useSdkPoolStatus";
import { getCurrentNetworkConfig, NETWORK } from "../../stxConnect/network";

const pulseAnimation = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
`;

interface XverseSignPsbtResponse {
  status: "success" | "error";
  result?: {
    psbt: string;
    txid: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

interface SimplifiedTradStyxProps {
  token: Token;
}

const createStyxSDK = () => {
  const sdkNetwork = NETWORK; // "mainnet" | "testnet" | "regtest"

  return new StyxSDK(
    undefined, // Let SDK choose the API URL based on network
    undefined, // Use SDK's default API key
    sdkNetwork // SDK will use this to pick the right apiUrl from NETWORK_CONFIGS
  );
};

const BYPASS_VERIFICATION_TOKENS = ["BEAST2", "beast2"];

const SimplifiedTradStyx: React.FC<SimplifiedTradStyxProps> = ({
  token,
}: {
  token: any;
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const {
    userAddress,
    isSignedIn,
    userSession,
    btcAddress,
    btcBalance,
    sbtcBalance,
    stxBalance,
    activeWalletProvider,
  } = useUserSession();
  const toast = useToast();
  const [stxAmount, setStxAmount] = useState<string>(
    token.denomination === "btc" ? "0.0001" : "20"
  );
  const [tokenAmount, setTokenAmount] = useState<string>("0");
  const [userStxBalance, setUserStxBalance] = useState(0);
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);
  const [currentSlippage, setCurrentSlippage] = useState(6);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isCalculatingMax, setIsCalculatingMax] = useState(false);
  const [buyQuote, setBuyQuote] =
    useState<ReadOnlyFunctionSuccessResponse | null>(null);
  const [sellQuote, setSellQuote] =
    useState<ReadOnlyFunctionSuccessResponse | null>(null);
  const [stxToGrad, setStxToGrad] =
    useState<ReadOnlyFunctionSuccessResponse | null>(null);
  const [confirmedTransaction, setConfirmedTransaction] = useState<{
    transactionType: "Buy" | "Sell";
    amount: string;
    tokenSymbol: string;
    txId: string;
  } | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const [contractAddress, contractName] = token.dexContract.split(".");

  const { data: balances, refetch: refetchBalances } = useQuery({
    queryKey: ["balances", userAddress],
    queryFn: () => stacksApiClient.getAddressBalance(userAddress!),
    enabled: !!userAddress,
  });
  // const { price: stxUsdPrice } = usePriceSTX();
  // const { price: btcUsdPrice } = usePriceBTC();
  const stxUsdPrice = 0.8;
  const btcUsdPrice = 110000;

  const currentPrice = token.denomination === "btc" ? btcUsdPrice : stxUsdPrice;
  const SBTC_CONTRACT = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
  // Add these state variables inside SimplifiedTradStyx
  const [btcTxStatus, setBtcTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  const [feeEstimates, setFeeEstimates] = useState({
    low: { rate: 1, fee: 0, time: "30 min" },
    medium: { rate: 3, fee: 0, time: "~20 min" },
    high: { rate: 5, fee: 0, time: "~10 min" },
  });
  const [feePriority, setFeePriority] = useState<TransactionPriority>(
    TransactionPriority.Medium
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    depositAmount: string;
    depositAddress: string;
    stxAddress: string;
    opReturnHex: string;
    minTokenOut?: number;
    swapType?: string;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmProgress, setConfirmProgress] = useState(0);
  const [btcTxId, setBtcTxId] = useState<string>("");
  const [currentDepositId, setCurrentDepositId] = useState<string | null>(null);
  const [buyWithSbtc, setBuyWithSbtc] = useState<boolean>(false);
  const styxSDK = createStyxSDK();

  const { data: poolStatus, isLoading: isPoolStatusLoading } =
    useSdkPoolStatus("aibtc");

  useEffect(() => {
    if (parseFloat(stxAmount) > 0) {
      setIsLoadingQuote(true);
      getBuyQuote(stxAmount)
        .then((response) => {
          console.log("getBuyQuote response:", response);
          setBuyQuote(response);
          setIsLoadingQuote(false);
        })
        .catch((error) => {
          console.log("No buy quote available, fetching fresh quote...");
          console.log("[DEBUG] effect - getBuyQuote error:", error);
          setIsLoadingQuote(false);
        });
    } else {
      setBuyQuote(null);
      setIsLoadingQuote(false);
    }
  }, [stxAmount, userAddress]);

  useEffect(() => {
    if (balances) {
      // Add null checking for STX balance
      if (balances.stx && balances.stx.balance) {
        setUserStxBalance(parseInt(balances.stx.balance));
      } else {
        console.warn("STX balance not found in response:", balances);
        setUserStxBalance(0);
      }

      // Set token balance with null checking
      const assetName = getTokenAssetName(token.symbol);
      const tokenKey = `${token.tokenContract}::${assetName}`;

      if (balances.fungible_tokens && balances.fungible_tokens[tokenKey]) {
        const tokenBalance = balances.fungible_tokens[tokenKey].balance || "0";
        setUserTokenBalance(parseInt(tokenBalance));
      } else {
        console.warn("Token balance not found for key:", tokenKey);
        setUserTokenBalance(0);
      }
    }
  }, [balances, token.tokenContract, token.symbol, token.denomination]);

  // Add this function to fetch fee estimates
  const fetchMempoolFeeEstimates = async () => {
    try {
      const config = getCurrentNetworkConfig();
      const response = await fetch(`${config.mempoolUrl}/v1/fees/recommended`);
      const data = await response.json();

      // Map to the correct fee estimate fields
      const lowRate = data.hourFee || 1;
      const mediumRate = data.halfHourFee || 3;
      const highRate = data.fastestFee || 5;

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
      console.error("Error fetching fee estimates:", error);
      // Fallback to default values
      return {
        low: { rate: 1, fee: 148, time: "30 min" },
        medium: { rate: 3, fee: 444, time: "~20 min" },
        high: { rate: 5, fee: 740, time: "~10 min" },
      };
    }
  };
  // Add this useEffect after other useEffects
  useEffect(() => {
    // Fetch fee estimates when component mounts
    const loadFeeEstimates = async () => {
      const estimates = await fetchMempoolFeeEstimates();
      setFeeEstimates(estimates);
    };

    loadFeeEstimates();

    // Optionally refresh every 5 minutes
    const intervalId = setInterval(loadFeeEstimates, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Add this utility function
  const calculateFee = (btcAmount: string): string => {
    if (!btcAmount || parseFloat(btcAmount) <= 0) return "0.00000000";
    const numAmount = parseFloat(btcAmount);
    if (isNaN(numAmount)) return "0.00000600";

    return numAmount <= 0.002 ? "0.00003000" : "0.00006000";
  };

  const getBuyQuote = async (amount: string) => {
    try {
      const btcAmount = Math.floor(parseFloat(amount) * Math.pow(10, 8));
      console.log("Calling getBuyQuote with btcAmount:", btcAmount);

      // Direct Hiro API call with proper Clarity encoding
      const url = `https://api.hiro.so/v2/contracts/call-read/${contractAddress}/${contractName}/get-in?tip=latest`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: userAddress || "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
          arguments: [cvToHex(uintCV(btcAmount))], // ← Proper Clarity uint encoding
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("getBuyQuote Hiro response:", data);
      return data;
    } catch (error: any) {
      console.error("[DEBUG] Error in getBuyQuote:", error);
      return null;
    }
  };
  const getSellQuote = async (amount: string) => {
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return null;
      }

      const quoteAmount = Math.floor(
        parsedAmount * Math.pow(10, token.decimals)
      );
      if (quoteAmount <= 0) {
        return null;
      }

      const response = await fetch("/api/stacks/call-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress,
          contractName,
          functionName: "get-out",
          sender: userAddress || "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
          arguments: [quoteAmount],
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error getting sell quote:", error);
      return null;
    }
  };

  const getStxToGrad = async () => {
    try {
      const response = await fetch("/api/stacks/call-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress,
          contractName,
          functionName: "get-in",
          sender: userAddress || "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS",
          arguments: [1_000_000],
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error getting stx to grad:", error);
      return null;
    }
  };

  useEffect(() => {
    if (parseFloat(tokenAmount) > 0) {
      setIsLoadingQuote(true);
      getSellQuote(tokenAmount)
        .then((response) => {
          setSellQuote(response);
          setIsLoadingQuote(false);
        })
        .catch(() => {
          setIsLoadingQuote(false);
        });
    } else {
      setSellQuote(null);
      setIsLoadingQuote(false);
    }
  }, [tokenAmount, userAddress]);

  useEffect(() => {
    if (userAddress) {
      getStxToGrad().then((response) => {
        setStxToGrad(response);
      });
    }
  }, [userAddress]);

  const { data: slippage = 10 } = useQuery({
    queryKey: ["slippage"],
    queryFn: () => parseFloat(localStorage.getItem("slippage") || "15"),
  });

  const sharedButtonProps = {
    height: "45px",
    fontSize: "xl",
    fontWeight: "bold",
    width: "100%",
  };

  const sharedStyles = {
    buttonProps: {
      size: "xs" as const,
      variant: "solid" as const,
      color: "gray.400",
      bg: "gray.800",
      borderColor: "gray.500",
      _hover: { bg: "gray.700" },
    },
    textStyle: {
      color: "gray.400",
    },
  };

  const handleSlippageChange = (value: number) => {
    setCurrentSlippage(value);
  };

  const verificationCheck = () => {
    if (
      token.status !== "completed" &&
      !BYPASS_VERIFICATION_TOKENS.includes(token.symbol)
    ) {
      console.log("token status", token.status, token.symbol);
      toast({
        title: "Token not completed",
        description:
          "This token and its DEX contract are still pending verification. Please wait until verification is complete.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const formatUsdValue = (amount: number): string => {
    if (!amount || amount <= 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isSegWitAddress = (address: string): boolean => {
    // SegWit addresses start with bc1 on mainnet and tb1 on testnet
    return address.startsWith("bc1") || address.startsWith("tb1");
  };

  const isP2SHAddress = (address: string): boolean => {
    // P2SH addresses start with 3 on mainnet
    return address.startsWith("3");
  };

  const handleBuy = async (): Promise<void> => {
    if (buyWithSbtc) {
      await handleBuySbtc();
    } else {
      await handleBuyWithBtc();
    }
  };

  const handleBuySbtc = async () => {
    if (!isSignedIn || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if ((stxBalance || 0) < 0.01) {
      toast({
        title: "STX Required for Transaction Fees",
        description: "You need at least 0.01 STX to pay for transaction fees.",
        status: "warning",
        duration: 8000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(stxAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!verificationCheck()) return;

    const ustx = parseFloat(stxAmount) * Math.pow(10, 8); // 8 decimals for BTC

    if (!buyQuote?.result) {
      toast({
        title: "Error",
        description: "Failed to get quote for buy order.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));

    // if (ustx > sbtcBalanceInSats) {
    //   toast({
    //     title: "Insufficient sBTC balance",
    //     description: `You need more sBTC to complete this purchase.`,
    //     status: "error",
    //     duration: 5000,
    //   });
    //   return;
    // }

    // Parse buyQuote result using SimplifiedTradingTabs logic
    const clarityValue = hexToCV(buyQuote.result);
    const jsonValue = cvToJSON(clarityValue);
    const quoteAmount = jsonValue.value.value["tokens-out"].value;
    const newStx = Number(jsonValue.value.value["new-stx"].value);
    const tokenBalance = jsonValue.value.value["ft-balance"]?.value;

    if (!quoteAmount || !newStx || !tokenBalance) {
      toast({
        title: "Error",
        description: "Invalid quote response",
        status: "error",
        duration: 5000,
      });
      return;
    }

    // Check target limit logic
    const TARGET_STX = token.targetStx * Math.pow(10, 8); // 8 decimals for BTC
    const currentStxBalance = Number(
      jsonValue.value.value["total-stx"]?.value || 0
    );
    const remainingToTarget = Math.max(0, TARGET_STX - currentStxBalance);
    const bufferAmount = remainingToTarget * 1.15; // 15% buffer

    if (ustx > bufferAmount) {
      const formattedUstx = (ustx / Math.pow(10, 8)).toFixed(8);
      const formattedMax = (bufferAmount / Math.pow(10, 8)).toFixed(8);

      toast({
        title: "Amount exceeds target limit",
        description: `Maximum purchase amount is ${formattedMax} BTC. You entered ${formattedUstx}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const slippageFactor = 1 - currentSlippage / 100;
    const minTokensOut = Math.floor(Number(quoteAmount) * slippageFactor);

    const [dexAddress, dexName] = token.dexContract.split(".");
    const [tokenAddress, tokenName] = token.tokenContract.split(".");
    const [sbtcAddress, sbtcName] = SBTC_CONTRACT.split(".");

    const args = [contractPrincipalCV(tokenAddress, tokenName), uintCV(ustx)];
    const assetName = getTokenAssetName(token.symbol);

    const isLastBuy = currentStxBalance + ustx >= TARGET_STX;

    // BTC post conditions using SimplifiedTradingTabs logic
    const postConditions = isLastBuy
      ? [
          // 1. User's BTC out
          Pc.principal(userAddress)
            .willSendLte(ustx)
            .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
          // 2. Contract's all tokens out
          Pc.principal(`${dexAddress}.${dexName}`)
            .willSendGte(tokenBalance)
            .ft(`${tokenAddress}.${tokenName}`, assetName),
          // 3. Contract's total BTC out
          Pc.principal(`${dexAddress}.${dexName}`)
            .willSendGte(TARGET_STX)
            .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
        ]
      : [
          // Normal buy - just user's BTC and buyer's tokens
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
        functionName: "buy", // Use 'buy' function
        functionArgs: args,
        postConditions,
      };

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        setConfirmedTransaction({
          transactionType: "Buy",
          amount: minTokensOut.toString(),
          tokenSymbol: token.symbol,
          txId: response.txid,
        });
        setShowConfirmationModal(true);
        refetchBalances();
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (error) {
      console.error("Error during contract call:", error);
      toast({
        title: "Error",
        description: "Failed to submit buy order.",
        status: "error",
        duration: 5000,
      });
    }
  };

  const handleBuyWithBtc = async (): Promise<void> => {
    // First, perform all validations without showing loading state
    if (!isSignedIn || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!stxAmount || parseFloat(stxAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid BTC amount greater than 0",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!verificationCheck()) {
      return;
    }

    if (!btcAddress) {
      toast({
        title: "No Bitcoin address",
        description: "No Bitcoin address found in your wallet",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Convert to satoshis for validation
    const amountInSats = Math.round(parseFloat(stxAmount) * 100000000);

    // Check if amount is below the minimum
    if (amountInSats < MIN_DEPOSIT_SATS) {
      toast({
        title: "Minimum deposit required",
        description: `Please deposit at least ${
          MIN_DEPOSIT_SATS / 100000000
        } BTC`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Check if amount is above the maximum
    if (amountInSats > MAX_DEPOSIT_SATS) {
      toast({
        title: "Beta limitation",
        description: `During beta, the maximum deposit amount is ${
          MAX_DEPOSIT_SATS / 100000000
        } BTC. Thank you for your understanding.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Calculate the total amount including service fee
    const userInputAmount = parseFloat(stxAmount);
    const serviceFee = parseFloat(calculateFee(stxAmount));
    const totalAmount = (userInputAmount + serviceFee).toFixed(8);

    // Check if user has sufficient balance
    const networkFeeInBTC = 0.000006; // 600 sats as network fee
    const totalRequiredBTC = parseFloat(totalAmount) + networkFeeInBTC;

    // if ((btcBalance || 0) < totalRequiredBTC) {
    //   const shortfallBTC = totalRequiredBTC - (btcBalance || 0);
    //   toast({
    //     title: "Insufficient funds",
    //     description: `You need ${shortfallBTC.toFixed(
    //       8
    //     )} BTC more to complete this transaction.`,
    //     status: "error",
    //     duration: 5000,
    //     isClosable: true,
    //   });
    //   return;
    // }

    // Only now that all validations have passed, start loading state and progress animation
    setIsConfirmLoading(true);
    setConfirmProgress(0);

    // We'll use a faster interval since this is a shorter operation
    const progressInterval = setInterval(() => {
      setConfirmProgress((prev) => {
        // Make the progress more aggressive since we expect this to be quick
        // But still cap at 90% until transaction is actually ready
        return prev < 90 ? prev + 15 : prev;
      });
    }, 50);

    try {
      // Always fetch fee estimates directly from mempool.space
      let currentFeeRates;
      try {
        console.log(
          "Fetching fresh fee estimates before transaction preparation"
        );
        const estimatesResult = await fetchMempoolFeeEstimates();
        currentFeeRates = {
          low: estimatesResult.low.rate,
          medium: estimatesResult.medium.rate,
          high: estimatesResult.high.rate,
        };

        // Update the UI fee display
        setFeeEstimates(estimatesResult);
        console.log("Using fee rates:", currentFeeRates);
      } catch (error) {
        console.warn("Error fetching fee estimates, using defaults:", error);
        currentFeeRates = { low: 1, medium: 3, high: 5 };
      }

      // Use the SDK to prepare the transaction
      try {
        console.log("Preparing transaction with SDK...");

        let minTokenOut = 0;
        let swapType = "sbtc"; // aibtc
        console.log("=== BUY QUOTE DEBUG ===");
        console.log("buyQuote exists:", !!buyQuote);
        console.log("buyQuote.result:", buyQuote?.result);

        if (buyQuote?.result) {
          try {
            const clarityValue = hexToCV(buyQuote.result);
            const jsonValue = cvToJSON(clarityValue);
            console.log("Parsed jsonValue:", jsonValue);
            console.log("jsonValue.success:", jsonValue.success);
            console.log("jsonValue.value:", jsonValue.value);

            if (jsonValue.value?.value) {
              console.log(
                "Available keys:",
                Object.keys(jsonValue.value.value)
              );
              console.log(
                "tokens-out value:",
                jsonValue.value.value["tokens-out"]
              );

              // ADD THIS PART - the actual logic to set minTokenOut:
              if (jsonValue.success && jsonValue.value?.value?.["tokens-out"]) {
                const rawAmount = jsonValue.value.value["tokens-out"].value;
                console.log("Raw amount from quote:", rawAmount);
                console.log("Raw amount type:", typeof rawAmount);

                // Apply slippage protection
                const slippageFactor = 1 - currentSlippage / 100;
                console.log("Slippage factor:", slippageFactor);
                minTokenOut = Math.floor(Number(rawAmount) * slippageFactor);
                console.log("Min token out calculated:", minTokenOut);
              }
            }
          } catch (error) {
            console.error("Error parsing buy quote:", error);
          }
        }

        const transactionData = await styxSDK.prepareTransaction({
          amount: totalAmount,
          userAddress,
          btcAddress,
          feePriority,
          walletProvider:
            (activeWalletProvider as "leather" | "xverse") || "leather",
          feeRates: currentFeeRates,
          minTokenOut: minTokenOut,
          swapType: swapType as "aibtc" | "sbtc",
          poolId: "aibtc",
          dexId: 1,
          aiAccountReceiver:
            "SP16PP6EYRCB7NCTGWAC73DH5X0KXWAPEQ8RKWAKS.no-ai-account-2",
        });
        console.log("Transaction prepared:", transactionData);

        const updatedFeeEstimates = await fetchMempoolFeeEstimates();
        setFeeEstimates(updatedFeeEstimates);

        console.log("=== DEBUG: Setting confirmation data ===", {
          minTokenOut,
          userAddress,
          dexContract: token.dexContract,
          tokenSymbol: token.symbol,
          depositAmount: totalAmount,
          hasOpReturnData: !!transactionData.opReturnData,
        });

        // Set confirmation data
        setConfirmationData({
          depositAmount: totalAmount, // Now includes service fee
          depositAddress: transactionData.depositAddress,
          stxAddress: userAddress,
          opReturnHex: transactionData.opReturnData,
          minTokenOut: minTokenOut,
          swapType: "aibtc", // aibtc
        });

        // Fill progress bar to 100% when done
        setConfirmProgress(100);

        // Immediately clear interval and show confirmation dialog
        clearInterval(progressInterval);
        setIsConfirmLoading(false);
        setShowConfirmation(true);
      } catch (err) {
        clearInterval(progressInterval);
        setIsConfirmLoading(false);
        const error = err as Error;
        console.error("Error preparing transaction:", error);

        if (isInscriptionError(error)) {
          handleInscriptionError(error, toast);
        } else if (isUtxoCountError(error)) {
          handleUtxoCountError(error, toast);
        } else if (isAddressTypeError(error)) {
          handleAddressTypeError(error, activeWalletProvider, toast);
        } else {
          toast({
            title: "Error",
            description:
              error.message ||
              "Failed to prepare transaction. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (err) {
      clearInterval(progressInterval);
      setIsConfirmLoading(false);
      const error = err as Error;
      console.error("Error preparing Bitcoin transaction:", error);

      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to prepare Bitcoin transaction. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add this function to execute the Bitcoin transaction
  const executeBitcoinTransaction = async (): Promise<void> => {
    console.log(
      "Starting transaction with activeWalletProvider:",
      activeWalletProvider
    );

    // Set the status to pending immediately to show the progress indicator
    setBtcTxStatus("pending");

    // We'll get the fee rates first
    try {
      const selectedFeeRate = feeEstimates[feePriority].rate;
      console.log(
        `Using ${feePriority} priority fee rate: ${selectedFeeRate} sat/vB`
      );

      if (!confirmationData) {
        setBtcTxStatus("error");
        toast({
          title: "Error",
          description: "Missing transaction data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Create a deposit first - this will automatically reduce estimated available balance
      try {
        // Create deposit record
        console.log("Creating deposit with data:", {
          btcAmount: parseFloat(confirmationData.depositAmount),
          stxReceiver: userAddress || "",
          btcSender: btcAddress || "",
        });

        // Create deposit record which will update pool status (reduce estimated available)
        const depositId = await styxSDK.createDeposit({
          btcAmount: parseFloat(confirmationData.depositAmount),
          stxReceiver: userAddress || "", // User's address (for filtering)
          btcSender: btcAddress || "",
          isBlaze: false,
          swapType: "aibtc", // aibtc
          minTokenOut: confirmationData.minTokenOut,
          poolId: "aibtc",
          dexId: 1,
          aiAccountReceiver:
            "SP16PP6EYRCB7NCTGWAC73DH5X0KXWAPEQ8RKWAKS.no-ai-account-2",
        });
        console.log("Create deposit depositId:", depositId);

        // Store deposit ID for later use (e.g., to update with txId or cancel)
        setCurrentDepositId(depositId);

        try {
          if (!window.LeatherProvider && !window.XverseProviders) {
            throw new Error("No wallet provider detected");
          }

          if (
            window.LeatherProvider &&
            (typeof window === "undefined" || !window.LeatherProvider)
          ) {
            throw new Error(
              "Leather wallet is not installed or not accessible"
            );
          }

          console.log(
            "Window object has LeatherProvider:",
            !!window.LeatherProvider
          );
          console.log("Full window object keys:", Object.keys(window));

          if (!userAddress) {
            throw new Error("STX address is missing or invalid");
          }

          console.log("About to use LeatherProvider:", window.LeatherProvider);

          // Use the BTC address from context
          if (!btcAddress) {
            throw new Error("Could not find a valid BTC address in wallet");
          }

          const senderBtcAddress = btcAddress;
          console.log("Using BTC address from context:", senderBtcAddress);

          // Step: Use SDK to get a transaction prepared for signing
          console.log("Getting prepared transaction from SDK...");
          // We need to re-prepare the transaction with the user's chosen fee priority
          const preparedTransaction = await styxSDK.prepareTransaction({
            amount: confirmationData.depositAmount,
            userAddress,
            btcAddress,
            feePriority,
            walletProvider:
              (activeWalletProvider as "leather" | "xverse") || "leather",
            minTokenOut: confirmationData.minTokenOut || 0,
            swapType: (confirmationData.swapType as "sbtc" | "aibtc") || "sbtc",
            poolId: "aibtc",
            dexId: 1,
            aiAccountReceiver:
              "SP16PP6EYRCB7NCTGWAC73DH5X0KXWAPEQ8RKWAKS.no-ai-account-2",
          });

          // Execute transaction with SDK
          console.log("Creating transaction with SDK...");
          const transactionData = await styxSDK.executeTransaction({
            depositId,
            preparedData: {
              utxos: preparedTransaction.utxos,
              opReturnData: preparedTransaction.opReturnData,
              depositAddress: preparedTransaction.depositAddress,
              fee: preparedTransaction.fee,
              changeAmount: preparedTransaction.changeAmount,
              amountInSatoshis: preparedTransaction.amountInSatoshis,
              feeRate: preparedTransaction.feeRate,
              inputCount: preparedTransaction.inputCount,
              outputCount: preparedTransaction.outputCount,
              inscriptionCount: preparedTransaction.inscriptionCount,
            },
            walletProvider:
              (activeWalletProvider as "leather" | "xverse") || "leather",
            btcAddress: senderBtcAddress,
          });

          console.log("Transaction execution prepared:", transactionData);

          // Create a transaction object from the PSBT
          let tx = new btc.Transaction({
            allowUnknownOutputs: true,
            allowUnknownInputs: true,
            disableScriptCheck: false,
          });

          // Load the base transaction from PSBT
          tx = btc.Transaction.fromPSBT(hex.decode(transactionData.txPsbtHex));

          // Handle P2SH for Xverse which requires frontend handling
          const isP2sh = isP2SHAddress(senderBtcAddress);
          if (
            isP2sh &&
            window.XverseProviders &&
            transactionData.needsFrontendInputHandling
          ) {
            console.log("Adding P2SH inputs specifically for Xverse");

            // Only for P2SH + Xverse, do we need to add inputs - in all other cases the backend handled it
            for (const utxo of preparedTransaction.utxos) {
              try {
                // First, try to get the account (which might fail if we don't have permission)
                console.log("Trying to get wallet account...");
                let walletAccount = await (xverseRequest as any)(
                  "wallet_getAccount",
                  null
                );

                // If we get an access denied error, we need to request permissions
                if (
                  walletAccount.status === "error" &&
                  walletAccount.error.code === -32002
                ) {
                  console.log("Access denied. Requesting permissions...");

                  // Request permissions using wallet_requestPermissions as shown in the docs
                  const permissionResponse = await (xverseRequest as any)(
                    "wallet_requestPermissions",
                    null
                  );
                  console.log("Permission response:", permissionResponse);

                  // If the user granted permission, try again to get the account
                  if (permissionResponse.status === "success") {
                    console.log(
                      "Permission granted. Trying to get wallet account again..."
                    );
                    walletAccount = await (xverseRequest as any)(
                      "wallet_getAccount",
                      null
                    );
                  } else {
                    throw new Error("User declined to grant permissions");
                  }
                }

                console.log("Wallet account response:", walletAccount);

                if (
                  walletAccount.status === "success" &&
                  walletAccount.result.addresses
                ) {
                  // Find the payment address that matches our sender address
                  const paymentAddress = (
                    walletAccount.result as any
                  ).addresses.find(
                    (addr: any) =>
                      addr.address === senderBtcAddress &&
                      addr.purpose === "payment"
                  );

                  if (paymentAddress && paymentAddress.publicKey) {
                    console.log(
                      "Found matching public key for P2SH address:",
                      paymentAddress.publicKey
                    );

                    // Create P2SH-P2WPKH from public key as shown in documentation
                    const publicKeyBytes = hex.decode(paymentAddress.publicKey);
                    const p2wpkh = btc.p2wpkh(publicKeyBytes, btc.NETWORK);
                    const p2sh = btc.p2sh(p2wpkh, btc.NETWORK);

                    // Add input with redeemScript
                    tx.addInput({
                      txid: utxo.txid,
                      index: utxo.vout,
                      witnessUtxo: {
                        script: p2sh.script,
                        amount: BigInt(utxo.value),
                      },
                      redeemScript: p2sh.redeemScript,
                    });
                  } else {
                    throw new Error(
                      "Could not find payment address with public key"
                    );
                  }
                } else {
                  throw new Error("Failed to get wallet account info");
                }
              } catch (err) {
                console.error("Error getting wallet account info:", err);
                throw new Error(
                  "P2SH address requires access to the public key. Please use a SegWit address (starting with 'bc1') or grant necessary permissions."
                );
              }
            }
          }

          // Extract transaction details from response
          const { transactionDetails } = transactionData;
          console.log("Transaction summary:", transactionDetails);

          // Generate PSBT and request signing
          const txPsbt = tx.toPSBT();
          const finalTxPsbtHex = hex.encode(txPsbt);
          const finalTxPsbtBase64 = Buffer.from(finalTxPsbtHex, "hex").toString(
            "base64"
          );

          let txid;

          // Universal wallet detection - check what's actually available
          if (window.LeatherProvider) {
            console.log("Using Leather wallet flow");

            const config = getCurrentNetworkConfig();

            // Leather wallet flow
            const requestParams = {
              hex: finalTxPsbtHex,
              network: config.stacksNetwork,
              broadcast: false,
              allowedSighash: [btc.SigHash.ALL],
              allowUnknownOutputs: true,
            };

            if (!window.LeatherProvider) {
              throw new Error(
                "Leather wallet provider not found on window object"
              );
            }

            // Send the signing request to Leather
            const signResponse = await window.LeatherProvider.request(
              "signPsbt",
              requestParams
            );

            if (
              !signResponse ||
              !signResponse.result ||
              !signResponse.result.hex
            ) {
              throw new Error(
                "Leather wallet did not return a valid signed PSBT"
              );
            }

            // We get the hex of the signed PSBT back, finalize it
            const signedPsbtHex = signResponse.result.hex;
            const signedTx = btc.Transaction.fromPSBT(
              hex.decode(signedPsbtHex)
            );
            signedTx.finalize();
            const finalTxHex = hex.encode(signedTx.extract());

            // Manually broadcast the transaction
            const broadcastResponse = await fetch(`${config.mempoolUrl}/tx`, {
              method: "POST",
              headers: {
                "Content-Type": "text/plain",
              },
              body: finalTxHex,
            });

            if (!broadcastResponse.ok) {
              const errorText = await broadcastResponse.text();
              throw new Error(`Failed to broadcast transaction: ${errorText}`);
            }

            txid = await broadcastResponse.text();
          } else if (window.XverseProviders) {
            console.log("Using Xverse wallet flow");
            // Xverse wallet flow
            try {
              console.log("Starting Xverse PSBT signing flow...");

              // Add all input addresses from our transaction
              const inputAddresses: Record<string, number[]> = {};
              inputAddresses[senderBtcAddress] = Array.from(
                { length: preparedTransaction.utxos.length },
                (_, i) => i
              );

              console.log("Input addresses for Xverse:", inputAddresses);
              console.log(
                "PSBT Base64 (first 100 chars):",
                finalTxPsbtBase64.substring(0, 100) + "..."
              );

              // Prepare request params
              const xverseParams = {
                psbt: finalTxPsbtBase64,
                signInputs: inputAddresses,
                broadcast: true, // Let Xverse handle broadcasting
                allowedSighash: [
                  btc.SigHash.ALL,
                  btc.SigHash.NONE,
                  btc.SigHash.SINGLE,
                  btc.SigHash.DEFAULT_ANYONECANPAY,
                ], // More complete set of sighash options
                options: {
                  allowUnknownInputs: true,
                  allowUnknownOutputs: true,
                },
              };

              console.log(
                "Calling Xverse request with params:",
                JSON.stringify(xverseParams, null, 2)
              );

              const response = (await xverseRequest(
                "signPsbt",
                xverseParams
              )) as XverseSignPsbtResponse;

              console.log(
                "Full Xverse response:",
                JSON.stringify(response, null, 2)
              );

              if (response.status !== "success") {
                console.error(
                  "Xverse signing failed with status:",
                  response.status
                );
                console.error("Xverse error details:", response.error);
                throw new Error(
                  `Xverse signing failed: ${
                    response.error?.message || "Unknown error"
                  }`
                );
              }

              // Fix the txid property access
              if (!response.result?.txid) {
                console.error(
                  "No txid in successful Xverse response:",
                  response
                );
                throw new Error("No transaction ID returned from Xverse");
              }

              txid = response.result.txid;
              console.log("Successfully got txid from Xverse:", txid);
            } catch (err) {
              console.error("Detailed error with Xverse signing:", err);
              console.error("Error type:", typeof err);
              if (err instanceof Error) {
                console.error("Error name:", err.name);
                console.error("Error message:", err.message);
                console.error("Error stack:", err.stack);
              }
              throw err;
            }
          } else {
            console.log("=== WALLET DETECTION DEBUG ===");
            console.log("activeWalletProvider:", activeWalletProvider);
            console.log(
              "window.LeatherProvider exists:",
              !!window.LeatherProvider
            );
            console.log(
              "window.XverseProviders exists:",
              !!window.XverseProviders
            );
            console.log("typeof window:", typeof window);
            throw new Error("No compatible wallet provider detected");
          }

          console.log("Transaction successfully broadcast with txid:", txid);

          // Update the deposit record with the transaction ID
          console.log(
            "Attempting to update deposit with ID:",
            depositId,
            "Type:",
            typeof depositId
          );

          try {
            console.log(
              "About to update deposit with ID:",
              depositId,
              "and txid:",
              txid
            );
            console.log("Update data:", {
              id: depositId,
              data: { btcTxId: txid, status: "broadcast" },
            });

            const updateResult = await styxSDK.updateDepositStatus({
              id: depositId,
              data: {
                btcTxId: txid,
                status: "broadcast",
              },
            });

            console.log(
              "Successfully updated deposit:",
              JSON.stringify(updateResult, null, 2)
            );
          } catch (error) {
            console.error("Error updating deposit with ID:", depositId);
            console.error("Update error details:", error);
          }

          // Update state with success
          setBtcTxStatus("success");
          setBtcTxId(txid);

          // Show success message
          toast({
            title: "Deposit Initiated",
            description: `Your Bitcoin transaction has been sent successfully with txid ${txid.substring(
              0,
              10
            )}...`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });

          // Close confirmation dialog
          setShowConfirmation(false);

          // Trigger data refetch
          refetchBalances();
        } catch (err) {
          const error = err as Error;
          console.error("Error in Bitcoin transaction process:", error);
          setBtcTxStatus("error");

          // Update deposit as canceled if wallet interaction failed
          await styxSDK.updateDepositStatus({
            id: depositId,
            data: {
              status: "canceled",
            },
          });
          setShowConfirmation(false);
          toast({
            title: "Error",
            description:
              error.message ||
              "Failed to process Bitcoin transaction. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (err) {
        const error = err as Error;
        console.error("Error creating deposit record:", error);
        setBtcTxStatus("error");
        setShowConfirmation(false);
        toast({
          title: "Error",
          description: "Failed to initiate deposit. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error getting fee estimates:", error);
      setBtcTxStatus("error");
      toast({
        title: "Error",
        description: "Failed to get fee estimates. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add these helpers outside the component at the end of the file
  function isAddressTypeError(error: Error): boolean {
    return (
      error.message.includes("inputType: sh without redeemScript") ||
      error.message.includes("P2SH") ||
      error.message.includes("redeem script")
    );
  }

  function handleAddressTypeError(
    error: Error,
    walletProvider: string | null,
    toast: any
  ): void {
    if (walletProvider === "leather") {
      toast({
        title: "Unsupported Address Type",
        description:
          "Leather wallet does not support P2SH addresses (starting with '3'). Please use a SegWit address (starting with 'bc1') instead.",
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } else if (walletProvider === "xverse") {
      toast({
        title: "P2SH Address Error",
        description:
          "There was an issue with the P2SH address. This might be due to wallet limitations. Try using a SegWit address (starting with 'bc1') instead.",
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } else {
      toast({
        title: "P2SH Address Not Supported",
        description:
          "Your wallet doesn't provide the necessary information for your P2SH address. Please try using a SegWit address (starting with bc1) instead.",
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    }
  }

  function isInscriptionError(error: Error): boolean {
    return error.message.includes("with inscriptions");
  }

  function handleInscriptionError(error: Error, toast: any): void {
    toast({
      title: "Inscriptions Detected",
      description: error.message,
      status: "warning",
      duration: 8000,
      isClosable: true,
    });
  }

  function isUtxoCountError(error: Error): boolean {
    return error.message.includes("small UTXOs");
  }

  function handleUtxoCountError(error: Error, toast: any): void {
    toast({
      title: "Too Many UTXOs",
      description: error.message,
      status: "warning",
      duration: 8000,
      isClosable: true,
    });
  }

  const handleSell = async () => {
    if (!isSignedIn || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to sell.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if ((stxBalance || 0) < 0.01) {
      toast({
        title: "STX Required for Transaction Fees",
        description: "You need at least 0.01 STX to pay for transaction fees.",
        status: "warning",
        duration: 8000,
        isClosable: true,
      });
      return;
    }

    if (parseFloat(tokenAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount greater than 0",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!verificationCheck()) {
      console.log("[HANDLE SELL] Verification check failed");
      return;
    }

    const exactAmount = userTokenBalance / Math.pow(10, token.decimals);
    const parsedAmount = parseFloat(tokenAmount);
    const flooredExactAmount = Math.floor(exactAmount * 100) / 100;
    const is100Percent =
      Math.abs(parsedAmount - exactAmount) < 0.000001 ||
      Math.abs(parsedAmount - flooredExactAmount) < 0.000001;

    console.log("[HANDLE SELL] 100% detection:", {
      parsedAmount,
      exactAmount,
      flooredExactAmount,
      is100Percent,
    });

    const tokenAmountMicrounits = is100Percent
      ? userTokenBalance
      : Math.floor(parseFloat(tokenAmount) * Math.pow(10, token.decimals));

    if (tokenAmountMicrounits > userTokenBalance) {
      const needed = parseFloat(tokenAmount);
      const has = userTokenBalance / Math.pow(10, token.decimals);
      const missing = (needed - has).toFixed(2);
      toast({
        title: "Insufficient balance",
        description: `You need ${missing} more ${token.symbol} to complete this sale`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!sellQuote?.result) {
      toast({
        title: "Error",
        description: "Failed to get quote for sell order.",
        status: "error",
        duration: 5000,
      });
      return;
    }

    try {
      const clarityValue = hexToCV(sellQuote.result);
      const jsonValue = cvToJSON(clarityValue);
      const quoteAmount = jsonValue.value.value["stx-out"].value;
      const slippageFactor = 1 - currentSlippage / 100;

      const minStxOut = Math.floor(Number(quoteAmount) * slippageFactor);
      const [dexAddress, dexName] = token.dexContract.split(".");
      const [tokenAddress, tokenName] = token.tokenContract.split(".");

      const args = [
        contractPrincipalCV(tokenAddress, tokenName),
        uintCV(Math.floor(tokenAmountMicrounits)),
      ];
      const assetName = getTokenAssetName(token.symbol);

      // BTC post conditions (always BTC since token.denomination is always "btc")
      const [sbtcAddress, sbtcName] = SBTC_CONTRACT.split(".");
      const postConditions = [
        Pc.principal(userAddress)
          .willSendLte(tokenAmountMicrounits)
          .ft(`${tokenAddress}.${tokenName}`, assetName),
        Pc.principal(`${dexAddress}.${dexName}`)
          .willSendGte(minStxOut)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      ];

      try {
        const params = {
          contract: `${dexAddress}.${dexName}` as `${string}.${string}`,
          functionName: "sell",
          functionArgs: args,
          postConditions,
        };

        const response = await request("stx_callContract", params);

        if (response && response.txid) {
          setConfirmedTransaction({
            transactionType: "Sell",
            amount: tokenAmountMicrounits.toString(),
            tokenSymbol: token.symbol,
            txId: response.txid,
          });
          setShowConfirmationModal(true);
          refetchBalances();
        } else {
          throw new Error("Transaction failed or was rejected.");
        }
      } catch (error) {
        console.error("[HANDLE SELL] Error during contract call:", error);
        toast({
          title: "Error",
          description: "Failed to submit sell order.",
          status: "error",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("[HANDLE SELL] Error parsing quote result:", error);
      toast({
        title: "Error",
        description: "Failed to process sell order quote.",
        status: "error",
        duration: 5000,
      });
    }
  };

  const calculateTokenAmount = (stxAmount: string) => {
    const amount = parseFloat(stxAmount) || 0;
    const tokens = Math.floor(amount / token.price);
    return `${tokens.toLocaleString()} ${token.symbol}`;
  };

  const calculateStxAmount = (tokenAmount: string) => {
    const amount = parseFloat(tokenAmount) || 0;
    return `${(amount * token.price).toFixed(2)} STX`;
  };

  const calculateOutputAmount = (tokenAmount: string) => {
    const amount = parseFloat(tokenAmount) || 0;
    if (token.denomination === "btc") {
      return `${(amount * token.price).toFixed(8)} BTC`;
    } else {
      return calculateStxAmount(tokenAmount);
    }
  };

  const handleMaxClick = async () => {
    setIsCalculatingMax(true);
    try {
      if (token.denomination === "btc") {
        // With this (sbtcBalance is already in BTC):
        if (buyWithSbtc) {
          // sbtcBalance is already in BTC units from context
          const maxFromBalance = (sbtcBalance ?? 0) * 0.99; // Leave some for fees
          setStxAmount(maxFromBalance.toFixed(8));
        } else {
          // For BTC transactions, calculate max while accounting for network fee
          try {
            // Get current fee rates
            const selectedRate = feeEstimates[feePriority].rate;
            console.log(
              `Using ${feePriority} priority fee rate: ${selectedRate} sat/vB`
            );

            // Estimate a small transaction (1 input, 2 outputs)
            const estimatedSize = 1 * 70 + 2 * 33 + 12; // ~148 vbytes
            const networkFeeSats = estimatedSize * selectedRate;
            const networkFee = networkFeeSats / 100000000; // Convert to BTC

            // Use btcBalance from context instead of userBtcBalance from Stacks
            const maxAmount = Math.max(0, (btcBalance || 0) - networkFee);

            // Format to 8 decimal places
            const formattedMaxAmount = maxAmount.toFixed(8);

            setStxAmount(formattedMaxAmount);
          } catch (error) {
            console.error("Error calculating max amount:", error);
            // Fallback to fixed fee if error occurs
            const networkFee = 0.000006;
            const maxAmount = Math.max(0, (btcBalance || 0) - networkFee);
            setStxAmount(maxAmount.toFixed(8));
          }
        }
      } else {
        // For STX, use original logic
        const maxFromBalance = (userStxBalance * 1) / Math.pow(10, 6);

        let maxFromGrad = Infinity;
        if (stxToGrad?.result) {
          const clarityValue = hexToCV(stxToGrad.result);
          const jsonValue = cvToJSON(clarityValue);
          maxFromGrad =
            jsonValue.type === "uint"
              ? Number(jsonValue.value) / Math.pow(10, 6)
              : Infinity;
        }

        const maxSTX = Math.min(maxFromBalance, maxFromGrad);
        setStxAmount(maxSTX.toFixed(2));
      }
    } catch (error) {
      console.error("Error calculating max:", error);
      if (token.denomination === "btc") {
        // Use btcBalance from context in the fallback calculation too
        const maxFromBalance = (btcBalance || 0) * 0.99;
        setStxAmount(maxFromBalance.toFixed(8));
      } else {
        const maxFromBalance = (userStxBalance * 0.99) / Math.pow(10, 6);
        setStxAmount(maxFromBalance.toFixed(2));
      }
    } finally {
      setIsCalculatingMax(false);
    }
  };

  const renderBuyQuote = () => {
    if (!parseFloat(stxAmount)) return "";
    if (!buyQuote?.result) return calculateTokenAmount(stxAmount);

    try {
      const clarityValue = hexToCV(buyQuote.result);
      const jsonValue = cvToJSON(clarityValue);

      // Same parsing for both BTC and sBTC cases - use SimplifiedTradingTabs logic
      if (jsonValue.success && jsonValue.value?.value?.["tokens-out"]) {
        const rawAmount = jsonValue.value.value["tokens-out"].value;
        const slippageFactor = 1 - currentSlippage / 100;
        const slippageAmount = Math.floor(Number(rawAmount) * slippageFactor);
        const displayAmount =
          Number(slippageAmount) / Math.pow(10, token.decimals);
        return `${displayAmount.toLocaleString()} ${token.symbol}`;
      }

      return calculateTokenAmount(stxAmount);
    } catch (error) {
      console.error("Error parsing quote result:", error);
      return "Error calculating";
    }
  };

  const renderSellQuote = () => {
    if (!parseFloat(tokenAmount)) return "";
    if (!sellQuote?.result) return calculateOutputAmount(tokenAmount);

    try {
      const clarityValue = hexToCV(sellQuote.result);
      const jsonValue = cvToJSON(clarityValue);

      // Same parsing for both BTC and sBTC cases - always look for stx-out
      if (jsonValue.success && jsonValue.value?.value) {
        const rawAmount = jsonValue.value.value["stx-out"]?.value;

        if (rawAmount) {
          const slippageFactor = 1 - currentSlippage / 100;
          const slippageAmount = Math.floor(Number(rawAmount) * slippageFactor);
          // Convert from sats to BTC (8 decimals)
          const displayAmount = Number(slippageAmount) / Math.pow(10, 8);
          return `${displayAmount.toFixed(8)} BTC`;
        }
      }

      return calculateOutputAmount(tokenAmount);
    } catch (error) {
      console.error("Error parsing sell quote:", error);
      return calculateOutputAmount(tokenAmount);
    }
  };

  const renderTradeButton = () => {
    if (activeTab === 0) {
      // Buy tab - green button
      return (
        <Button
          height="45px"
          fontSize="md"
          bg="green.300"
          color="black"
          _hover={{ bg: "green.200" }}
          _disabled={{
            opacity: 1,
            cursor: "not-allowed",
            _hover: { bg: "green.200" },
          }}
          onClick={handleBuy}
          isDisabled={isConfirmLoading || isLoadingQuote}
        >
          {isConfirmLoading
            ? "Preparing..."
            : isLoadingQuote
              ? "Loading quote..."
              : // : token.status !== "completed"
                // ? "verification pending"
                "place order"}
        </Button>
      );
    } else {
      // Sell tab - red button but text should be "place order"
      return (
        <Button
          height="45px"
          fontSize="md"
          bg="green.300"
          color="black"
          _hover={{ bg: "green.200" }}
          _disabled={{
            opacity: 1,
            cursor: "not-allowed",
            _hover: { bg: "green.200" },
          }}
          onClick={handleSell}
          isDisabled={isLoadingQuote}
        >
          {isLoadingQuote
            ? "Loading quote..."
            : token.status !== "completed"
              ? "verification pending"
              : "place order"}
        </Button>
      );
    }
  };

  const calculateUsdValue = (amount: string) => {
    const inputAmount = parseFloat(amount) || 0;
    return `$${(inputAmount * (currentPrice || 1)).toFixed(2)}`;
  };

  return (
    <>
      <Tabs
        variant="unstyled"
        height="100%"
        display="flex"
        flexDirection="column"
        bg="gray.700"
        borderRadius="lg"
        onChange={(index) => setActiveTab(index)}
      >
        <TabList
          px={4}
          pt={4}
          pb={1}
          display="flex"
          justifyContent="space-between"
        >
          <Tab
            fontSize="md"
            py={2}
            borderRadius="md"
            color={activeTab === 0 ? "black" : "gray.300"}
            bg={activeTab === 0 ? "green.300" : "gray.700"}
            fontWeight="bold"
            _hover={{
              bg: activeTab === 0 ? "green.400" : "gray.800",
            }}
            width="48%"
          >
            Buy
          </Tab>
          <Tab
            fontSize="md"
            py={2}
            borderRadius="md"
            color={activeTab === 1 ? "white" : "gray.400"}
            bg={activeTab === 1 ? "red.400" : "gray.700"}
            fontWeight="bold"
            _hover={{
              bg: activeTab === 1 ? "red.400" : "gray.800",
            }}
            width="48%"
          >
            Sell
          </Tab>
        </TabList>

        <TabPanels flex={1} overflowY="auto">
          <TabPanel p={0} height="100%">
            <Box p={4}>
              <VStack spacing={2} align="stretch">
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontSize="xs" color="gray.400">
                    Balance:{" "}
                    {token.denomination === "btc"
                      ? buyWithSbtc
                        ? sbtcBalance === null
                          ? "Loading..."
                          : `${(sbtcBalance ?? 0).toLocaleString(undefined, {
                              minimumFractionDigits: 8,
                              maximumFractionDigits: 8,
                            })} sBTC`
                        : `${(btcBalance || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 8,
                            maximumFractionDigits: 8,
                          })} BTC`
                      : `${(userStxBalance / Math.pow(10, 6)).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )} STX`}
                  </Text>

                  <Button
                    rightIcon={<Settings size={16} />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setIsSlippageModalOpen(true)}
                  >
                    Slippage
                  </Button>
                </Flex>

                <FormControl>
                  <Box position="relative">
                    <InputGroup size="lg">
                      <Input
                        value={stxAmount} // Use regular Input instead of NumberInput
                        onChange={(e) => {
                          // Validate that input is a number
                          const value = e.target.value;
                          if (/^[0-9.]*$/.test(value)) {
                            setStxAmount(value);
                          }
                        }}
                        textAlign="right"
                        pr="5.5rem"
                        height="40px"
                        bg="gray.800"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: "white",
                          boxShadow: "0 0 0 1px white",
                        }}
                      />

                      {/* USD Value as a prefix inside the input */}
                      <Box
                        position="absolute"
                        left="4"
                        top="50%"
                        transform="translateY(-50%)"
                        pointerEvents="none"
                        zIndex="1"
                      >
                        <Text fontSize="md" color="gray.400">
                          $
                          {(
                            parseFloat(stxAmount) * (currentPrice || 1)
                          ).toFixed(2)}{" "}
                          ~
                        </Text>
                      </Box>

                      <InputRightElement width="4.5rem" h="40px" mr={2}>
                        <Text fontSize="sm" color="gray.100" mr={1} ml={1}>
                          {token.denomination === "btc"
                            ? buyWithSbtc
                              ? "sBTC"
                              : "BTC"
                            : "STX"}
                        </Text>
                        <TokenSvg
                          token={
                            token.denomination === "btc"
                              ? buyWithSbtc
                                ? "sBTC"
                                : "BTC"
                              : "STX"
                          }
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Box>
                </FormControl>

                <HStack spacing={2}>
                  {token.denomination === "btc" ? (
                    <>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("0.0002")}
                      >
                        20K
                      </Button>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("0.001")}
                      >
                        100K
                      </Button>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("0.002")}
                      >
                        200K sats
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("20")}
                      >
                        20 STX
                      </Button>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("100")}
                      >
                        100 STX
                      </Button>
                      <Button
                        {...sharedStyles.buttonProps}
                        onClick={() => setStxAmount("200")}
                      >
                        200 STX
                      </Button>
                    </>
                  )}
                  <Button
                    {...sharedStyles.buttonProps}
                    onClick={handleMaxClick}
                    isLoading={isCalculatingMax}
                  >
                    MAX
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    borderColor="gray.500"
                    color={buyWithSbtc ? "orange.300" : "yellow.300"}
                    bg="transparent"
                    _hover={{ bg: "gray.800" }}
                    onClick={() => setBuyWithSbtc(!buyWithSbtc)}
                    rightIcon={
                      <Box as="span" fontSize="xs">
                        ↓
                      </Box>
                    }
                  >
                    {buyWithSbtc ? "sBTC" : "BTC"}
                  </Button>
                </HStack>

                <Box p={2} marginTop={0} borderRadius="md">
                  <Flex justify="flex-end">
                    <Text fontSize="sm" color="gray.400">
                      {renderBuyQuote()}
                    </Text>
                  </Flex>
                </Box>
                {/* Progress bar above button when loading - add just before renderTradeButton() */}
                {isConfirmLoading && (
                  <Box
                    mb={2}
                    bg="#242731"
                    p={3}
                    borderRadius="xl"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    animation={`${pulseAnimation} 1.5s infinite`}
                  >
                    <Text
                      fontSize="sm"
                      color="gray.300"
                      mb={2}
                      textAlign="center"
                    >
                      Preparing transaction...
                    </Text>
                    <Progress
                      value={confirmProgress}
                      size="sm"
                      colorScheme="teal"
                      hasStripe
                      isAnimated
                      borderRadius="md"
                    />
                  </Box>
                )}

                {renderTradeButton()}
                {/* Add this below renderTradeButton() */}
                {activeTab === 0 && !buyWithSbtc && (
                  <Accordion allowToggle mt={3}>
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton
                          py={1}
                          px={0}
                          _hover={{ bg: "transparent" }}
                        >
                          <Box flex="1" textAlign="left">
                            <Text fontSize="xs" color="gray.400">
                              Swap Details
                            </Text>
                          </Box>
                          <AccordionIcon color="gray.400" />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={2} px={0}>
                        <Box bg="#242731" p={3} borderRadius="md" mb={2}>
                          <Flex justify="space-between" align="center">
                            <Text color="gray.400" fontSize="xs">
                              Estimated time
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              1 Block ~ 10 min
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center" mt={2}>
                            <Text color="gray.400" fontSize="xs">
                              Service fee
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              {stxAmount &&
                              parseFloat(stxAmount) > 0 &&
                              btcUsdPrice
                                ? formatUsdValue(
                                    parseFloat(calculateFee(stxAmount)) *
                                      btcUsdPrice
                                  )
                                : "$0.00"}{" "}
                              ~ {calculateFee(stxAmount)} BTC
                            </Text>
                          </Flex>
                          {poolStatus && (
                            <Flex justify="space-between" align="center" mt={2}>
                              <Text color="gray.400" fontSize="xs">
                                Pool liquidity
                              </Text>
                              <Text color="gray.400" fontSize="xs">
                                {formatUsdValue(
                                  (poolStatus.estimatedAvailable / 100000000) *
                                    (btcUsdPrice || 0)
                                )}{" "}
                                ~{" "}
                                {(
                                  poolStatus.estimatedAvailable / 100000000
                                ).toFixed(8)}{" "}
                                BTC
                              </Text>
                            </Flex>
                          )}
                        </Box>

                        <Box bg="#242731" p={3} borderRadius="md">
                          <Text
                            color="gray.400"
                            fontSize="xs"
                            lineHeight="1.4"
                            maxWidth="100%"
                            whiteSpace="normal"
                          >
                            Your BTC deposit unlocks sBTC via Clarity's direct
                            Bitcoin state reading. sBTC is swapped into a PEPE
                            pool exclusive to raw Bitcoin orders. No
                            intermediaries or multi-signature scheme needed.
                            Trustless. Fast. Secure.
                          </Text>
                          <Flex justifyContent="flex-end" mt={2}>
                            <Link
                              href="https://x.com/btc2sbtc"
                              isExternal
                              display="flex"
                              alignItems="center"
                              borderRadius="md"
                              bg="rgba(0, 0, 0, 0.3)"
                              px={2}
                              py={1}
                              fontSize="xs"
                              color="gray.300"
                              _hover={{
                                color: "orange.300",
                                textDecoration: "none",
                              }}
                            >
                              powered by
                              <Text ml={1} fontWeight="bold" color="orange.300">
                                @btc2sbtc
                              </Text>
                              <ExternalLinkIcon ml={1} boxSize={3} />
                            </Link>
                          </Flex>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}
              </VStack>
            </Box>
          </TabPanel>

          <TabPanel p={0} height="100%">
            <Box p={4}>
              <VStack spacing={2} align="stretch">
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontSize="xs" color="gray.400">
                    Balance:{" "}
                    {(
                      userTokenBalance / Math.pow(10, token.decimals)
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {token.symbol}
                  </Text>
                  <Button
                    rightIcon={<Settings size={16} />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setIsSlippageModalOpen(true)}
                  >
                    Slippage
                  </Button>
                </Flex>

                <FormControl>
                  <Box position="relative">
                    <InputGroup size="lg">
                      <Input
                        value={tokenAmount}
                        onChange={(e) => {
                          // Validate that input is a number
                          const value = e.target.value;
                          if (/^[0-9.]*$/.test(value)) {
                            setTokenAmount(value);
                          }
                        }}
                        textAlign="right"
                        pr="8rem"
                        height="40px"
                        bg="gray.800"
                        borderColor="gray.300"
                        _focus={{
                          borderColor: "white",
                          boxShadow: "0 0 0 1px white",
                        }}
                      />

                      <InputRightElement
                        width="auto"
                        minW="4.5rem"
                        h="40px"
                        mr={2}
                      >
                        <Text fontSize="sm" color="gray.100" mr={1} ml={1}>
                          {token.symbol}
                        </Text>
                        <CoinSvg
                          logoUrl={token.logoUrl}
                          symbol={token.symbol}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Box>
                </FormControl>

                <HStack spacing={2}>
                  <Button
                    {...sharedStyles.buttonProps}
                    onClick={() => setTokenAmount("0")}
                  >
                    Reset
                  </Button>
                  <Button
                    {...sharedStyles.buttonProps}
                    onClick={() => {
                      const amount =
                        (userTokenBalance * 0.25) /
                        Math.pow(10, token.decimals);
                      setTokenAmount(amount.toFixed(2));
                    }}
                  >
                    25%
                  </Button>
                  <Button
                    {...sharedStyles.buttonProps}
                    onClick={() => {
                      const amount =
                        (userTokenBalance * 0.5) / Math.pow(10, token.decimals);
                      setTokenAmount(amount.toFixed(2));
                    }}
                  >
                    50%
                  </Button>
                  <Button
                    {...sharedStyles.buttonProps}
                    onClick={() => {
                      // Get the exact amount
                      const exactAmount =
                        userTokenBalance / Math.pow(10, token.decimals);

                      // Round to 2 decimal places (cents) for display purposes
                      const roundedAmount = Math.floor(exactAmount * 100) / 100;

                      // Use the rounded amount for display but we'll detect it's a 100% sell in handleSell
                      console.log(
                        "[100% BUTTON] Using rounded display amount:",
                        {
                          exactAmount,
                          roundedAmount,
                        }
                      );

                      setTokenAmount(roundedAmount.toString());
                    }}
                  >
                    100%
                  </Button>
                </HStack>

                <Box p={2} marginTop={0} borderRadius="md">
                  <Flex justify="space-between" alignItems="center">
                    {/* Add USD value here */}
                    <Text fontSize="md" color="gray.400">
                      $
                      {(() => {
                        // If we're displaying a quote from the contract
                        if (sellQuote?.result) {
                          const clarityValue = hexToCV(sellQuote.result);
                          const jsonValue = cvToJSON(clarityValue);
                          if (jsonValue.success && jsonValue.value?.value) {
                            const dy = jsonValue.value.value["dy"].value;
                            const slippageFactor = 1 - currentSlippage / 100;
                            const slippageAmount = Math.floor(
                              Number(dy) * slippageFactor
                            );

                            if (token.denomination === "btc") {
                              // For BTC, convert from sats to BTC and multiply by BTC price
                              const btcAmount =
                                Number(slippageAmount) / Math.pow(10, 8);
                              return (btcAmount * (btcUsdPrice || 1)).toFixed(
                                2
                              );
                            } else {
                              // For STX denomination
                              const stxAmount =
                                Number(slippageAmount) / Math.pow(10, 6);
                              return (stxAmount * (stxUsdPrice || 1)).toFixed(
                                2
                              );
                            }
                          }
                        }

                        // Fallback calculation if we don't have a quote
                        const tokenValue = parseFloat(tokenAmount) || 0;
                        const baseCurrencyValue = tokenValue * token.price;
                        return (
                          baseCurrencyValue * (currentPrice || 1)
                        ).toFixed(2);
                      })()}{" "}
                      ~
                    </Text>
                    <Text fontSize="md" color="gray.400">
                      {renderSellQuote()}
                    </Text>
                  </Flex>
                </Box>
                {/* Progress bar above button when loading - add just before renderTradeButton() */}
                {isConfirmLoading && (
                  <Box
                    mb={2}
                    bg="#242731"
                    p={3}
                    borderRadius="xl"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    animation={`${pulseAnimation} 1.5s infinite`}
                  >
                    <Text
                      fontSize="sm"
                      color="gray.300"
                      mb={2}
                      textAlign="center"
                    >
                      Preparing transaction...
                    </Text>
                    <Progress
                      value={confirmProgress}
                      size="sm"
                      colorScheme="teal"
                      hasStripe
                      isAnimated
                      borderRadius="md"
                    />
                  </Box>
                )}
                {renderTradeButton()}
                {/* Add this below renderTradeButton() */}
                {activeTab === 0 && (
                  <Accordion allowToggle mt={3}>
                    <AccordionItem border="none">
                      <h2>
                        <AccordionButton
                          py={1}
                          px={0}
                          _hover={{ bg: "transparent" }}
                        >
                          <Box flex="1" textAlign="left">
                            <Text fontSize="xs" color="gray.400">
                              Swap Details
                            </Text>
                          </Box>
                          <AccordionIcon color="gray.400" />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={2} px={0}>
                        <Box bg="#242731" p={3} borderRadius="md" mb={2}>
                          <Flex justify="space-between" align="center">
                            <Text color="gray.400" fontSize="xs">
                              Estimated time
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              1 Block ~ 10 min
                            </Text>
                          </Flex>
                          <Flex justify="space-between" align="center" mt={2}>
                            <Text color="gray.400" fontSize="xs">
                              Service fee
                            </Text>
                            <Text color="gray.400" fontSize="xs">
                              {stxAmount &&
                              parseFloat(stxAmount) > 0 &&
                              btcUsdPrice
                                ? formatUsdValue(
                                    parseFloat(calculateFee(stxAmount)) *
                                      btcUsdPrice
                                  )
                                : "$0.00"}{" "}
                              ~ {calculateFee(stxAmount)} BTC
                            </Text>
                          </Flex>
                          {poolStatus && (
                            <Flex justify="space-between" align="center" mt={2}>
                              <Text color="gray.400" fontSize="xs">
                                Pool liquidity
                              </Text>
                              <Text color="gray.400" fontSize="xs">
                                {formatUsdValue(
                                  (poolStatus.estimatedAvailable / 100000000) *
                                    (btcUsdPrice || 0)
                                )}{" "}
                                ~{" "}
                                {(
                                  poolStatus.estimatedAvailable / 100000000
                                ).toFixed(8)}{" "}
                                BTC
                              </Text>
                            </Flex>
                          )}
                        </Box>

                        <Box bg="#242731" p={3} borderRadius="md">
                          <Text
                            color="gray.400"
                            fontSize="xs"
                            lineHeight="1.4"
                            maxWidth="100%"
                            whiteSpace="normal"
                          >
                            Your BTC deposit unlocks sBTC via Clarity's direct
                            Bitcoin state reading. No intermediaries or
                            multi-signature scheme needed. Trustless. Fast.
                            Secure.
                          </Text>
                          <Flex justifyContent="flex-end" mt={2}>
                            <Link
                              href="https://x.com/btc2sbtc"
                              isExternal
                              display="flex"
                              alignItems="center"
                              borderRadius="md"
                              bg="rgba(0, 0, 0, 0.3)"
                              px={2}
                              py={1}
                              fontSize="xs"
                              color="gray.300"
                              _hover={{
                                color: "orange.300",
                                textDecoration: "none",
                              }}
                            >
                              powered by
                              <Text ml={1} fontWeight="bold" color="orange.300">
                                @btc2sbtc
                              </Text>
                              <ExternalLinkIcon ml={1} boxSize={3} />
                            </Link>
                          </Flex>
                        </Box>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <SlippageModal
        isOpen={isSlippageModalOpen}
        onClose={() => setIsSlippageModalOpen(false)}
        currentSlippage={currentSlippage}
        onSlippageChange={handleSlippageChange}
      />

      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        transactionType={confirmedTransaction?.transactionType || "Buy"}
        amount={confirmedTransaction?.amount || ""}
        token={{
          symbol: token.symbol,
          logoUrl: token.logoUrl || "",
          name: token.name,
          decimals: token.decimals,
        }}
        txId={confirmedTransaction?.txId || ""}
      />

      {/* Add confirmation modal at the end of the return statement */}
      {showConfirmation && confirmationData && (
        <Modal
          isOpen={showConfirmation}
          onClose={() =>
            btcTxStatus === "pending" ? null : setShowConfirmation(false)
          }
          isCentered
          size="md"
          closeOnOverlayClick={btcTxStatus !== "pending"}
        >
          <ModalOverlay />
          <ModalContent bg="blue.700" color="white">
            <ModalHeader>Confirm Transaction Data</ModalHeader>
            {btcTxStatus !== "pending" && <ModalCloseButton />}
            <ModalBody pb={0}>
              <Box bg="blue.800" p={4} borderRadius="md" mb={4}>
                <Table variant="unstyled" size="sm">
                  <Tbody>
                    <Tr>
                      <Td width="40%" fontSize="xs" fontWeight="medium" pr={0}>
                        Amount:
                      </Td>
                      <Td>
                        <Text fontFamily="mono" fontSize="xs">
                          {confirmationData.depositAmount} BTC
                        </Text>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td width="40%" fontSize="xs" fontWeight="medium" pr={0}>
                        STX Address:
                      </Td>
                      <Td>
                        <Text
                          fontFamily="mono"
                          fontSize="2xs"
                          wordBreak="break-all"
                        >
                          {confirmationData.stxAddress}
                        </Text>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td width="40%" fontSize="xs" fontWeight="medium" pr={0}>
                        DEX Contract:
                      </Td>
                      <Td>
                        <Text
                          fontFamily="mono"
                          fontSize="2xs"
                          wordBreak="break-all"
                        >
                          {token.dexContract}
                        </Text>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td width="40%" fontSize="xs" fontWeight="medium" pr={0}>
                        You receive min.:
                      </Td>
                      <Td>
                        <Text fontFamily="mono" fontSize="xs">
                          {confirmationData.minTokenOut
                            ? `${(
                                confirmationData.minTokenOut /
                                Math.pow(10, token.decimals)
                              ).toLocaleString()} ${token.symbol}`
                            : "Not specified"}
                        </Text>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td
                        width="40%"
                        fontSize="xs"
                        fontWeight="medium"
                        pr={0}
                        verticalAlign="top"
                      >
                        OP_RETURN:
                      </Td>
                      <Td>
                        <Box position="relative">
                          <Box
                            bg="gray.700"
                            p={2}
                            borderRadius="md"
                            maxWidth="100%"
                            maxHeight="60px"
                            overflowY="auto"
                            overflowX="hidden"
                            sx={{
                              "::-webkit-scrollbar": {
                                width: "4px",
                                height: "4px",
                              },
                              "::-webkit-scrollbar-thumb": {
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                borderRadius: "4px",
                              },
                            }}
                          >
                            <Text
                              fontFamily="mono"
                              fontSize="xs"
                              wordBreak="break-all"
                              whiteSpace="normal"
                              lineHeight="1.2"
                            >
                              {confirmationData.opReturnHex}
                            </Text>
                          </Box>
                          <Button
                            position="absolute"
                            top="2px"
                            right="2px"
                            size="xs"
                            bg="gray.600"
                            _hover={{ bg: "gray.500" }}
                            color="white"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                confirmationData.opReturnHex
                              );
                              toast({
                                title: "Copied",
                                description:
                                  "OP_RETURN data copied to clipboard",
                                status: "success",
                                duration: 2000,
                                isClosable: true,
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </Box>
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>

              <Box bg="blue.800" p={4} borderRadius="md" mb={4}>
                <Text fontSize="sm" mb={3} fontWeight="medium">
                  Select priority
                </Text>

                <SimpleGrid columns={3} spacing={3}>
                  <Card
                    bg={feePriority === "low" ? "#665500" : "#1A1A2F"}
                    borderRadius="lg"
                    overflow="hidden"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _hover={{ borderColor: "yellow.300", cursor: "pointer" }}
                    onClick={() => setFeePriority(TransactionPriority.Low)}
                    opacity={btcTxStatus === "pending" ? 0.6 : 1}
                    pointerEvents={btcTxStatus === "pending" ? "none" : "auto"}
                  >
                    <Box p={3} textAlign="center">
                      <Text
                        color="white"
                        fontSize="sm"
                        fontWeight="medium"
                        mb={1}
                      >
                        Low
                      </Text>
                      <Text color="gray.300" fontSize="xs">
                        {feeEstimates.low.fee} sats
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        ({feeEstimates.low.rate} sat/vB)
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        30 min
                      </Text>
                    </Box>
                  </Card>

                  <Card
                    bg={feePriority === "medium" ? "#665500" : "#1A1A2F"}
                    borderRadius="lg"
                    overflow="hidden"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _hover={{ borderColor: "yellow.300", cursor: "pointer" }}
                    onClick={() => setFeePriority(TransactionPriority.Medium)}
                    opacity={btcTxStatus === "pending" ? 0.6 : 1}
                    pointerEvents={btcTxStatus === "pending" ? "none" : "auto"}
                  >
                    <Box p={3} textAlign="center">
                      <Text
                        color="white"
                        fontSize="sm"
                        fontWeight="medium"
                        mb={1}
                      >
                        Medium
                      </Text>
                      <Text color="gray.300" fontSize="xs">
                        {feeEstimates.medium.fee} sats
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        ({feeEstimates.medium.rate} sat/vB)
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        ~20 min
                      </Text>
                    </Box>
                  </Card>

                  <Card
                    bg={feePriority === "high" ? "#665500" : "#1A1A2F"}
                    borderRadius="lg"
                    overflow="hidden"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    _hover={{ borderColor: "yellow.300", cursor: "pointer" }}
                    onClick={() => setFeePriority(TransactionPriority.High)}
                    opacity={btcTxStatus === "pending" ? 0.6 : 1}
                    pointerEvents={btcTxStatus === "pending" ? "none" : "auto"}
                  >
                    <Box p={3} textAlign="center">
                      <Text
                        color="white"
                        fontSize="sm"
                        fontWeight="medium"
                        mb={1}
                      >
                        High
                      </Text>
                      <Text color="gray.300" fontSize="xs">
                        {feeEstimates.high.fee} sats
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        ({feeEstimates.high.rate} sat/vB)
                      </Text>
                      <Text color="gray.400" fontSize="xs">
                        ~10 min
                      </Text>
                    </Box>
                  </Card>
                </SimpleGrid>

                <Text fontSize="xs" color="gray.300" mt={4} textAlign="left">
                  Fees are estimated based on current network conditions.
                </Text>
              </Box>

              {/* Wallet processing progress indicator */}
              {btcTxStatus === "pending" && (
                <Box
                  mb={4}
                  p={4}
                  bg="blue.800"
                  borderRadius="md"
                  animation={`${pulseAnimation} 1.5s infinite`}
                >
                  <Text
                    fontSize="sm"
                    color="white"
                    fontWeight="medium"
                    mb={2}
                    textAlign="center"
                  >
                    Processing with{" "}
                    {activeWalletProvider === "leather" ? "Leather" : "Xverse"}{" "}
                    wallet...
                  </Text>
                  <Progress
                    size="sm"
                    isIndeterminate
                    colorScheme="yellow"
                    borderRadius="md"
                    mb={2}
                  />
                  <Text fontSize="xs" color="gray.300" textAlign="center">
                    Please confirm the transaction in your wallet
                  </Text>
                </Box>
              )}
            </ModalBody>

            <ModalFooter>
              <Button
                variant="outline"
                mr={3}
                onClick={() => setShowConfirmation(false)}
                isDisabled={btcTxStatus === "pending"}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={executeBitcoinTransaction}
                isLoading={btcTxStatus === "pending"}
                loadingText="Processing"
                isDisabled={btcTxStatus === "pending"}
              >
                Proceed to Wallet
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default SimplifiedTradStyx;
