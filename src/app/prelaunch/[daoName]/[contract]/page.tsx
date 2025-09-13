"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { getStacksAddress } from "@/lib/address";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { uintCV, Pc, Cl, hexToCV, cvToJSON } from "@stacks/transactions";
import { request } from "@stacks/connect";
import { fetchDAOByName, fetchDAOExtensions } from "@/services/dao.service";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TestnetFaucet } from "@/components/account/TestnetFaucet";

export const runtime = "edge";

// Network configuration
const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
const NETWORK_CONFIG = {
  HIRO_API_URL: isMainnet
    ? "https://api.hiro.so"
    : "https://api.testnet.hiro.so",
  SBTC_CONTRACT: isMainnet
    ? "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token"
    : "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token",
  BRIDGE_CONTRACT:
    "STQM5S86GFM1731EBZE192PNMMP8844R30E8WDPB.btc2aibtc-simulation",
};

// TODO: ON MAINNET HOW DO USER BUY VIA L1 BTC FOR PRELAUNCH
const PrelaunchPage = () => {
  const params = useParams();
  const encodedDaoName = params.daoName as string;
  const contractParam = decodeURIComponent(params.contract as string);

  const [selectedSeats, setSelectedSeats] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"sbtc" | "btc">("sbtc");
  // const [transactionType, setTransactionType] = useState<"buy" | "refund">(
  //   "buy"
  // );

  // Constants for seat pricing
  const SEAT_PRICE_SATS = 20000;
  const MAX_SEATS_PER_USER = 7;
  const TOTAL_SEATS = 20; // Fixed total seats

  // Fetch DAO data
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", encodedDaoName],
    queryFn: () => fetchDAOByName(encodedDaoName),
    staleTime: 600000,
  });

  // Fetch DAO extensions
  const { data: extensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["extensions", dao?.id],
    queryFn: () => fetchDAOExtensions(dao!.id),
    enabled: !!dao?.id,
    staleTime: 600000,
  });

  // Extract contracts from extensions
  const buyAndDepositContract = extensions?.find(
    (ext) => ext.type === "TRADING" && ext.subtype === "FAKTORY_BUY_AND_DEPOSIT"
  )?.contract_principal;

  const dexContract = extensions?.find(
    (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
  )?.contract_principal;

  const prelaunchContract = extensions?.find(
    (ext) => ext.type === "TOKEN" && ext.subtype === "PRELAUNCH"
  )?.contract_principal;

  const poolContract = extensions?.find(
    (ext) => ext.type === "TOKEN" && ext.subtype === "POOL"
  )?.contract_principal;

  // Validate that the contract parameter matches the extension
  const isValidContract = buyAndDepositContract === contractParam;

  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { transactionStatus, transactionMessage, reset, startMonitoring } =
    useTransactionVerification();

  const userAddress = getStacksAddress();

  // Fetch max seats allowed for user from prelaunch contract
  const {
    data: maxSeatsAllowed,
    isLoading: isMaxSeatsLoading,
    error: maxSeatsError,
  } = useQuery<number | null>({
    queryKey: ["maxSeatsAllowed", userAddress, prelaunchContract],
    queryFn: async () => {
      if (!userAddress || !prelaunchContract)
        throw new Error("Missing user address or prelaunch contract");

      const [contractAddress, contractName] = prelaunchContract.split(".");
      const response = await fetch(
        `${NETWORK_CONFIG.HIRO_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/get-max-seats-allowed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: userAddress,
            arguments: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch max seats allowed: ${response.status}`
        );
      }

      const data = await response.json();

      if (data?.okay && data?.result) {
        const clarityValue = hexToCV(data.result);
        console.log("max seats clarity value", clarityValue);
        const jsonValue = cvToJSON(clarityValue);
        console.log("max seats json value", jsonValue);
        const maxSeats = jsonValue.value;
        console.log(
          "Max seats allowed from contract:",
          maxSeats,
          "Raw result:",
          data.result
        );
        return maxSeats;
      }

      throw new Error("Invalid response from contract");
    },
    enabled: !!userAddress && !!prelaunchContract,
    staleTime: 300000, // 5 minutes
    retry: 3,
  });

  // Fetch seats remaining from prelaunch contract
  const { data: seatsRemaining } = useQuery<number | null>({
    queryKey: ["seatsRemaining", prelaunchContract],
    queryFn: async () => {
      if (!prelaunchContract) throw new Error("Missing prelaunch contract");

      const [contractAddress, contractName] = prelaunchContract.split(".");
      const response = await fetch(
        `${NETWORK_CONFIG.HIRO_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/get-remaining-seats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: userAddress || "SP000000000000000000002Q6VF78",
            arguments: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch seats remaining: ${response.status}`);
      }

      const data = await response.json();
      if (data?.okay && data?.result) {
        const clarityValue = hexToCV(data.result);
        console.log("remaining seats clarity value:", clarityValue);
        const jsonValue = cvToJSON(clarityValue);
        console.log("remaining seats jsonValue:", jsonValue);

        // Handle response type wrapping a tuple with "remaining-seats" field
        if (
          jsonValue.value &&
          jsonValue.value.value &&
          jsonValue.value.value["remaining-seats"]
        ) {
          const remainingSeats = parseInt(
            jsonValue.value.value["remaining-seats"].value
          );
          console.log(
            "Remaining seats from contract:",
            remainingSeats,
            "Raw result:",
            data.result,
            "Parsed JSON:",
            jsonValue
          );
          return remainingSeats;
        }

        // Handle direct tuple response with "remaining-seats" field
        if (jsonValue.value && jsonValue.value["remaining-seats"]) {
          const remainingSeats = parseInt(
            jsonValue.value["remaining-seats"].value
          );
          console.log(
            "Remaining seats from contract (direct tuple):",
            remainingSeats,
            "Raw result:",
            data.result,
            "Parsed JSON:",
            jsonValue
          );
          return remainingSeats;
        }

        // Fallback for direct uint response
        if (typeof jsonValue.value === "number") {
          return jsonValue.value;
        }

        // Handle string numbers
        if (
          typeof jsonValue.value === "string" &&
          !isNaN(parseInt(jsonValue.value))
        ) {
          return parseInt(jsonValue.value);
        }
      }
      return null;
    },
    enabled: !!prelaunchContract,
    staleTime: 30000, // Refresh more frequently
  });

  // Fetch sBTC balance
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
    enabled: !!userAddress,
  });

  // Start monitoring when modal opens with transaction ID
  useEffect(() => {
    if (isModalOpen && activeTxId) {
      console.log("Starting transaction monitoring for:", activeTxId);
      startMonitoring(activeTxId).catch(console.error);
    }
  }, [isModalOpen, activeTxId, startMonitoring]);

  // Calculate sBTC amount based on selected seats
  const calculateSbtcAmount = (seats: number): number => {
    return (seats * SEAT_PRICE_SATS) / Math.pow(10, 8);
  };

  const handleSeatChange = (seats: number): void => {
    if (
      seats >= 1 &&
      seats <= MAX_SEATS_PER_USER &&
      seats <= getMaxAffordableSeats()
    ) {
      setSelectedSeats(seats);
    }
  };

  const getMaxAffordableSeats = (): number => {
    if (
      !sbtcBalance ||
      maxSeatsAllowed === null ||
      maxSeatsAllowed === undefined
    )
      return 0;
    const maxSeats = Math.floor(
      (sbtcBalance * Math.pow(10, 8)) / SEAT_PRICE_SATS
    );
    return Math.min(maxSeats, maxSeatsAllowed);
  };

  // Handle sBTC-based buying for testnet (when raw BTC not available)
  const handleBuyWithSbtcOnTestnet = useCallback(async () => {
    if (!accessToken || !userAddress || !buyAndDepositContract || !dao) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure valid contract.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSeats <= 0 || selectedSeats > MAX_SEATS_PER_USER) {
      toast({
        title: "Invalid seat selection",
        description: `Please select between 1 and ${MAX_SEATS_PER_USER} seats`,
        variant: "destructive",
      });
      return;
    }

    const sbtcAmountInSats = selectedSeats * SEAT_PRICE_SATS;
    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));

    if (sbtcAmountInSats > sbtcBalanceInSats) {
      const requiredSbtc = calculateSbtcAmount(selectedSeats);
      const availableSbtc = (sbtcBalanceInSats || 0) / Math.pow(10, 8);
      toast({
        title: "Insufficient sBTC balance",
        description: `You need more sBTC. Required: ${requiredSbtc.toFixed(8)} sBTC, Available: ${availableSbtc.toFixed(8)} sBTC`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract contract addresses for post conditions
      const [sbtcAddress, sbtcName] = NETWORK_CONFIG.SBTC_CONTRACT.split(".");
      const [bridgeAddress, bridgeName] =
        NETWORK_CONFIG.BRIDGE_CONTRACT.split(".");

      // Get token contract from DAO extensions for prelaunch
      const tokenExtension = extensions?.find(
        (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
      );

      if (!tokenExtension) {
        throw new Error("Token contract not found for this DAO");
      }

      if (!dexContract) {
        throw new Error("DEX contract not found for this DAO");
      }

      if (!prelaunchContract) {
        throw new Error("Prelaunch contract not found for this DAO");
      }

      if (!poolContract) {
        throw new Error("Pool contract not found for this DAO");
      }

      const [tokenAddress, tokenName] =
        tokenExtension.contract_principal.split(".");
      const [dexAddress, dexName] = dexContract.split(".");
      const [prelaunchAddress, prelaunchName] = prelaunchContract.split(".");
      const [poolAddress, poolName] = poolContract.split(".");

      // Calculate minimum tokens out (with 5% slippage tolerance)
      const slippageFactor = 0.95;
      const estimatedTokensOut = sbtcAmountInSats * 1000; // Rough estimate, adjust based on your tokenomics
      const minTokensOut = Math.floor(estimatedTokensOut * slippageFactor);

      // Arguments for swap-btc-to-aibtc function
      const args = [
        Cl.uint(sbtcAmountInSats), // sBTC amount
        Cl.uint(minTokensOut), // minimum tokens out
        Cl.uint(1), // swap type (1 for prelaunch)
        Cl.contractPrincipal(tokenAddress, tokenName), // token contract
        Cl.contractPrincipal(dexAddress, dexName), // DEX contract
        Cl.contractPrincipal(prelaunchAddress, prelaunchName), // prelaunch contract
        Cl.contractPrincipal(poolAddress, poolName), // pool contract
        Cl.contractPrincipal(sbtcAddress, sbtcName), // sBTC contract
      ];

      // Post conditions for prelaunch:
      // 1. User sends sBTC to bridge contract
      // 2. Bridge contract sends sBTC to prelaunch contract
      // 3. Prelaunch contract sends tokens to user (if last buy, sends all remaining)
      const postConditions = [
        // User -> Bridge contract transfer
        Pc.principal(userAddress)
          .willSendEq(sbtcAmountInSats)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
        // Bridge contract -> Prelaunch contract transfer
        Pc.principal(`${bridgeAddress}.${bridgeName}`)
          .willSendLte(sbtcAmountInSats)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      ];

      const params = {
        contract: NETWORK_CONFIG.BRIDGE_CONTRACT as `${string}.${string}`,
        functionName: "swap-btc-to-aibtc",
        functionArgs: args,
        postConditions,
        postConditionMode: "deny" as const,
      };

      console.log("Prelaunch sBTC swap params:", params);

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        setActiveTxId(response.txid);
        setIsModalOpen(true);
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (error) {
      console.error("Error during sBTC swap transaction:", error);
      toast({
        title: "Error",
        description: "Failed to buy seats with sBTC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    userAddress,
    selectedSeats,
    sbtcBalance,
    buyAndDepositContract,
    dao,
    extensions,
    dexContract,
    prelaunchContract,
    poolContract,
    toast,
  ]);

  // Handle adapter contract interaction using buy-seats-and-deposit
  const handleBuySeats = useCallback(async () => {
    console.log("=== HANDLE BUY SEATS DEBUG ===");
    console.log("selectedSeats:", selectedSeats);
    console.log("MAX_SEATS_PER_USER:", MAX_SEATS_PER_USER);
    console.log("sbtcBalance:", sbtcBalance);
    console.log("TOTAL_SEATS:", TOTAL_SEATS);
    console.log("seatsRemaining:", seatsRemaining);

    if (!accessToken || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy seats.",
        variant: "destructive",
      });
      return;
    }

    if (!buyAndDepositContract) {
      toast({
        title: "Error",
        description: "Buy and deposit contract not found for this DAO.",
        variant: "destructive",
      });
      return;
    }

    if (!prelaunchContract) {
      toast({
        title: "Error",
        description: "Prelaunch contract not found for this DAO.",
        variant: "destructive",
      });
      return;
    }

    if (selectedSeats <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please select at least 1 seat",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ Validation passed - proceeding with transaction");

    // Calculate total BTC amount needed in satoshis
    const totalBtcAmount = selectedSeats * SEAT_PRICE_SATS;
    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));

    // Check if user has enough balance
    if (totalBtcAmount > sbtcBalanceInSats) {
      toast({
        title: "Insufficient sBTC balance",
        description: `Deposit more sBTC to buy ${selectedSeats} seat${
          selectedSeats > 1 ? "s" : ""
        }`,
        variant: "destructive",
      });
      return;
    }

    const [adapterAddress, adapterName] = buyAndDepositContract.split(".");
    const [preContractAddress, preContractName] = prelaunchContract.split(".");
    const [sbtcAddress, sbtcName] = NETWORK_CONFIG.SBTC_CONTRACT.split(".");

    const args = [
      uintCV(totalBtcAmount), // sBTC amount to transfer
    ];

    // Post conditions for adapter flow:
    // 1. User sends sBTC to adapter contract
    // 2. Adapter acts like a user and sends sBTC to prelaunch contract
    const postConditions = [
      // User -> Adapter contract transfer
      Pc.principal(userAddress)
        .willSendEq(totalBtcAmount)
        .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      // Adapter -> Prelaunch contract transfer (adapter acts like a user)
      Pc.principal(`${adapterAddress}.${adapterName}`)
        .willSendLte(totalBtcAmount)
        .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
    ];

    // Check if this purchase will complete the pre-launch
    const willCompleteLaunch =
      seatsRemaining !== null &&
      seatsRemaining !== undefined &&
      seatsRemaining === selectedSeats;

    if (willCompleteLaunch) {
      // Calculate total accumulated sBTC (total seats * price per seat)
      const totalAccumulatedBtc = TOTAL_SEATS * SEAT_PRICE_SATS;

      postConditions.push(
        Pc.principal(`${preContractAddress}.${preContractName}`)
          .willSendGte(totalAccumulatedBtc)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token")
      );
    }

    setIsSubmitting(true);

    try {
      const params = {
        contract: `${adapterAddress}.${adapterName}` as `${string}.${string}`,
        functionName: "buy-seats-and-deposit",
        functionArgs: args,
        postConditions,
        postConditionMode: "deny" as const,
      };

      console.log("Buy-seats-and-deposit transaction params:", params);

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        setActiveTxId(response.txid);
        setIsModalOpen(true);

        // Handle completion logic
        if (willCompleteLaunch) {
          console.log("Prelaunch completed! Last seat(s) purchased.");
          // You can add any completion callback here if needed
          // setTimeout(() => {
          //   onCompleteLaunch?.();
          // }, 1500);
        }
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch (error) {
      console.error("Error during contract call:", error);
      toast({
        title: "Error",
        description: "Failed to buy seats.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    accessToken,
    userAddress,
    selectedSeats,
    sbtcBalance,
    buyAndDepositContract,
    prelaunchContract,
    seatsRemaining,
    toast,
  ]);

  // Determine which buy function to use based on network and user preference
  const handleBuyAction = useCallback(() => {
    if (!isMainnet && paymentMethod === "btc") {
      // On testnet, if user wants to use raw BTC, use the sBTC swap method
      return handleBuyWithSbtcOnTestnet();
    } else {
      // Use direct prelaunch contract method
      return handleBuySeats();
    }
  }, [paymentMethod, handleBuyWithSbtcOnTestnet, handleBuySeats]);

  // Loading states
  if (isLoadingDAO || isLoadingExtensions) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Loading Prelaunch...
            </h1>
            <p className="max-w-md text-muted-foreground">
              Please wait while we fetch the DAO details.
            </p>
          </div>
          <Loader />
        </div>
      </main>
    );
  }

  // Error states
  if (!dao) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              DAO Not Found
            </h1>
            <p className="max-w-md text-muted-foreground">
              The DAO you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!buyAndDepositContract) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Prelaunch Not Available
            </h1>
            <p className="max-w-md text-muted-foreground">
              This DAO doesn't have a prelaunch contract configured.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isValidContract) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Invalid Contract
            </h1>
            <p className="max-w-md text-muted-foreground">
              The contract parameter doesn't match the DAO's prelaunch contract.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Check if prelaunch is complete
  const isPrelaunchComplete = seatsRemaining === 0;

  return (
    <div className="flex flex-col h-screen w-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-6 lg:px-8 py-4 max-w-screen-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              ${dao.name} Prelaunch
            </h1>
            {isPrelaunchComplete ? (
              <div className="space-y-2">
                <p className="text-green-400 font-semibold text-lg">
                  🎉 Prelaunch Complete!
                </p>
                <p className="text-zinc-400">
                  All seats have been sold. The {dao.name} prelaunch is now
                  complete.
                </p>
              </div>
            ) : (
              <p className="text-zinc-400">
                Buy seats for early access to {dao.name} tokens
              </p>
            )}
            {seatsRemaining !== null && seatsRemaining !== undefined && (
              <p className="text-sm text-zinc-500 mt-1">
                {TOTAL_SEATS - seatsRemaining}/{TOTAL_SEATS} seats taken •{" "}
                {seatsRemaining} remaining
              </p>
            )}
          </div>

          <div className="max-w-md mx-auto space-y-6">
            {isPrelaunchComplete ? (
              /* Prelaunch Complete State */
              <div className="space-y-6">
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
                    Prelaunch Complete!
                  </h2>
                  <p className="text-zinc-300 mb-4">
                    All {TOTAL_SEATS} seats have been successfully sold.
                  </p>
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-200">
                      The {dao.name} token launch will begin shortly. Stay tuned
                      for updates on token distribution and trading
                      availability.
                    </p>
                  </div>
                  <div className="text-sm text-zinc-400">
                    Thank you to all participants who made this prelaunch a
                    success!
                  </div>
                </div>
              </div>
            ) : (
              /* Active Prelaunch State */
              <>
                {/* Seat Selection - Main Input */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSeatChange(selectedSeats - 1)}
                          disabled={selectedSeats <= 1 || !accessToken}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
                        >
                          -
                        </Button>
                        <div className="text-4xl font-light text-white text-center min-w-[80px]">
                          {selectedSeats}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSeatChange(selectedSeats + 1)}
                          disabled={
                            !maxSeatsAllowed ||
                            selectedSeats >= maxSeatsAllowed ||
                            selectedSeats >= getMaxAffordableSeats() ||
                            !accessToken ||
                            isMaxSeatsLoading ||
                            (seatsRemaining !== null &&
                              seatsRemaining !== undefined &&
                              selectedSeats >= seatsRemaining)
                          }
                          className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-sm text-zinc-400">
                        {calculateSbtcAmount(selectedSeats).toFixed(8)} sBTC
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <Select
                      value={paymentMethod}
                      onValueChange={(value: "sbtc" | "btc") =>
                        setPaymentMethod(value)
                      }
                      disabled={!accessToken}
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
                        <SelectItem value="sbtc">sBTC</SelectItem>
                        {!isMainnet && (
                          <SelectItem value="btc">BTC (via Bridge)</SelectItem>
                        )}
                        {isMainnet && (
                          <SelectItem value="btc">BTC (L1)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preset seat buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={selectedSeats === 1 ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedSeats(1)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
                      disabled={!accessToken || 1 > getMaxAffordableSeats()}
                    >
                      1 Seat
                    </Button>
                    <Button
                      variant={selectedSeats === 2 ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedSeats(2)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
                      disabled={!accessToken || 2 > getMaxAffordableSeats()}
                    >
                      2 Seats
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        selectedSeats === getMaxAffordableSeats()
                          ? "default"
                          : "secondary"
                      }
                      size="sm"
                      onClick={() => setSelectedSeats(getMaxAffordableSeats())}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600"
                      disabled={!accessToken || getMaxAffordableSeats() === 0}
                      tabIndex={0}
                      aria-label="Set seats to maximum affordable amount"
                    >
                      MAX
                    </Button>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">
                      Available Balance
                    </span>
                    {accessToken ? (
                      <button
                        onClick={() => {
                          const maxSeats = getMaxAffordableSeats();
                          if (maxSeats > 0) {
                            setSelectedSeats(maxSeats);
                          }
                        }}
                        className="text-white font-bold hover:text-primary transition-colors"
                        disabled={
                          isSbtcBalanceLoading ||
                          sbtcBalance === null ||
                          sbtcBalance === undefined
                        }
                      >
                        {isSbtcBalanceLoading
                          ? "Loading..."
                          : sbtcBalance !== null && sbtcBalance !== undefined
                            ? `${sbtcBalance.toFixed(8)} sBTC`
                            : "Unable to load balance"}
                      </button>
                    ) : (
                      <span className="text-zinc-500 font-bold">N/A</span>
                    )}
                  </div>
                  {accessToken && sbtcBalance !== null && (
                    <div className="text-xs text-zinc-400 mt-1">
                      Max affordable seats: {getMaxAffordableSeats()}
                    </div>
                  )}
                </div>

                {/* Contract Seat Limits */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">
                      Contract Seat Limit
                    </span>
                    {accessToken ? (
                      <span className="text-white font-bold">
                        {isMaxSeatsLoading
                          ? "Loading..."
                          : maxSeatsError
                            ? "Error loading"
                            : maxSeatsAllowed !== null &&
                                maxSeatsAllowed !== undefined
                              ? `${maxSeatsAllowed} seats max`
                              : "Unable to load"}
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-bold">N/A</span>
                    )}
                  </div>
                  {accessToken && maxSeatsError && (
                    <div className="text-xs text-red-400 mt-1">
                      Failed to fetch from contract. Please refresh.
                    </div>
                  )}
                </div>

                {/* Seat info display */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 text-center min-h-[84px] flex items-center justify-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-semibold text-white">
                      {selectedSeats} {selectedSeats === 1 ? "Seat" : "Seats"}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {calculateSbtcAmount(1).toFixed(8)} sBTC per seat
                    </div>
                  </div>
                </div>

                {/* Payment Method Description */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                  <div className="text-xs text-zinc-400">
                    {paymentMethod === "btc"
                      ? !isMainnet
                        ? "Uses bridge contract to swap BTC to tokens via prelaunch DEX"
                        : "Direct L1 Bitcoin transaction"
                      : "Direct sBTC transfer to prelaunch contract"}
                  </div>
                </div>

                {/* Buy Seats Button */}
                <Button
                  onClick={handleBuyAction}
                  disabled={
                    selectedSeats <= 0 ||
                    !maxSeatsAllowed ||
                    selectedSeats > maxSeatsAllowed ||
                    isSubmitting ||
                    !accessToken ||
                    isSbtcBalanceLoading ||
                    isMaxSeatsLoading ||
                    selectedSeats > getMaxAffordableSeats() ||
                    (seatsRemaining !== null &&
                      seatsRemaining !== undefined &&
                      selectedSeats > seatsRemaining)
                  }
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <Loader />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">
                          ₿
                        </span>
                      </div>
                      <span>
                        Buy {selectedSeats}{" "}
                        {selectedSeats === 1 ? "Seat" : "Seats"}
                        {paymentMethod === "btc" && " (via Bridge)"}
                      </span>
                    </div>
                  )}
                </Button>

                {/* Validation Messages */}
                {accessToken &&
                  maxSeatsAllowed === null &&
                  !isMaxSeatsLoading && (
                    <div className="text-center p-4 bg-red-900/40 border border-red-800 rounded-lg">
                      <p className="text-red-200 text-sm">
                        Unable to load seat limits from contract. Please refresh
                        the page.
                      </p>
                    </div>
                  )}

                {seatsRemaining !== null &&
                  seatsRemaining !== undefined &&
                  selectedSeats > seatsRemaining && (
                    <div className="text-center p-4 bg-red-900/40 border border-red-800 rounded-lg">
                      <p className="text-red-200 text-sm">
                        Only {seatsRemaining} seat
                        {seatsRemaining !== 1 ? "s" : ""} remaining. Please
                        select {seatsRemaining} or fewer seats.
                      </p>
                    </div>
                  )}

                {accessToken &&
                  maxSeatsAllowed !== null &&
                  selectedSeats > getMaxAffordableSeats() &&
                  getMaxAffordableSeats() > 0 && (
                    <div className="text-center p-4 bg-yellow-900/40 border border-yellow-800 rounded-lg">
                      <p className="text-yellow-200 text-sm">
                        You can only afford {getMaxAffordableSeats()}{" "}
                        {getMaxAffordableSeats() === 1 ? "seat" : "seats"} with
                        your current sBTC balance.
                      </p>
                    </div>
                  )}

                {/* Show testnet faucet always in testnet environment */}
                {!isMainnet && accessToken && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <TestnetFaucet />
                  </div>
                )}

                {accessToken &&
                  maxSeatsAllowed !== null &&
                  getMaxAffordableSeats() === 0 && (
                    <div className="text-center p-4 bg-red-900/40 border border-red-800 rounded-lg">
                      <p className="text-red-200 text-sm">
                        Insufficient sBTC balance. You need at least{" "}
                        {calculateSbtcAmount(1).toFixed(8)} sBTC to buy 1 seat.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Transaction Status Modal */}
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
        title="sBTC Transaction"
        successTitle="Seat Purchase Confirmed"
        failureTitle="Seat Purchase Failed"
        successDescription={`Your transaction to buy ${selectedSeats} ${selectedSeats === 1 ? "seat" : "seats"} for ${dao.name} has been successfully confirmed.`}
        failureDescription="The seat purchase could not be completed. Please check your balance and try again."
        pendingDescription="Your seat purchase is being processed. This may take a few minutes."
        onRetry={handleBuyAction}
      />
    </div>
  );
};

export default PrelaunchPage;
