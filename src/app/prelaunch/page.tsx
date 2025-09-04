"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { getStacksAddress } from "@/lib/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/reusables/Loader";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { uintCV, Pc, PostConditionMode } from "@stacks/transactions";
import { request } from "@stacks/connect";

// Hardcoded values for prelaunch
const HARDCODED_VALUES = {
  buyAndDepositContract:
    "ST3YT0XW92E6T2FE59B2G5N2WNNFSBZ6MZKQS5D18.fake17-faktory-buy-and-deposit",
  daoName: "FAKE17",
  seatPriceSats: 20000,
  maxSeatsPerUser: 7,
};

// sBTC contract used by the buy-seats-and-deposit contract
const SBTC_CONTRACT = "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token";

const PrelaunchPage = () => {
  const [amount, setAmount] = useState<string>("0.0001");
  const [buyQuote, setBuyQuote] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Format balance to avoid unnecessary decimal places
  const formatBalance = (balance: number): string => {
    if (balance % 1 === 0) {
      return balance.toString();
    }
    return balance.toFixed(8).replace(/\.?0+$/, "");
  };

  const { toast } = useToast();
  const { accessToken, isLoading } = useAuth();
  const hasAccessToken = !!accessToken && !isLoading;
  const userAddress = getStacksAddress();

  const { transactionStatus, transactionMessage, reset, startMonitoring } =
    useTransactionVerification();

  // Start monitoring when modal opens with transaction ID
  useEffect(() => {
    if (isModalOpen && activeTxId) {
      startMonitoring(activeTxId).catch(console.error);
    }
  }, [isModalOpen, activeTxId, startMonitoring]);

  // Fetch STX balance for transaction fees
  const { data: stxBalance } = useQuery<number | null>({
    queryKey: ["stxBalance", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      // Try testnet API first
      const testnetUrl = `https://api.testnet.hiro.so/extended/v1/address/${userAddress}/balances`;

      const testnetResponse = await fetch(testnetUrl);
      if (testnetResponse.ok) {
        const testnetData = await testnetResponse.json();
        const stxBalanceValue = parseInt(testnetData.stx.balance) / 10 ** 6;
        return stxBalanceValue;
      }

      // Fallback to mainnet API
      const mainnetUrl = `https://api.hiro.so/extended/v1/address/${userAddress}/balances`;
      const mainnetResponse = await fetch(mainnetUrl);
      if (!mainnetResponse.ok) {
        throw new Error("Failed to fetch STX balance from both networks");
      }
      const mainnetData = await mainnetResponse.json();
      const stxBalanceValue = parseInt(mainnetData.stx.balance) / 10 ** 6;
      return stxBalanceValue;
    },
    enabled: hasAccessToken && !!userAddress,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch sBTC balance - dynamically detect tokens ending with "sbtc-token"
  const { data: sbtcBalance, isLoading: isSbtcBalanceLoading } = useQuery<
    number | null
  >({
    queryKey: ["sbtcBalance", userAddress],
    queryFn: async () => {
      if (!userAddress) return null;

      const fetchBalanceFromNetwork = async (apiUrl: string) => {
        const response = await fetch(
          `${apiUrl}/extended/v1/address/${userAddress}/balances`
        );
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.fungible_tokens) return 0;

        // Find any token that ends with "btc-token"
        const btcTokenEntry = Object.entries(data.fungible_tokens).find(
          ([identifier]) => identifier.endsWith("::sbtc-token")
        );

        if (btcTokenEntry) {
          const [, tokenData] = btcTokenEntry as [string, { balance: string }];
          return parseInt(tokenData.balance) / 10 ** 8;
        }

        return 0;
      };

      // Try testnet API first
      const testnetBalance = await fetchBalanceFromNetwork(
        "https://api.testnet.hiro.so"
      );
      if (testnetBalance !== null) return testnetBalance;

      // Fallback to mainnet API
      const mainnetBalance = await fetchBalanceFromNetwork(
        "https://api.hiro.so"
      );
      if (mainnetBalance !== null) return mainnetBalance;

      throw new Error("Failed to fetch BTC token balance from both networks");
    },
    enabled: !!userAddress,
  });

  // Calculate seats based on sBTC amount and seat price
  const calculateSeats = useCallback((sbtcAmount: string): number => {
    const sbtcSats = parseFloat(sbtcAmount) * Math.pow(10, 8);
    return Math.floor(sbtcSats / HARDCODED_VALUES.seatPriceSats);
  }, []);

  // Calculate quote when amount changes
  useEffect(() => {
    if (amount && Number.parseFloat(amount) > 0) {
      setLoadingQuote(true);
      const seatsEstimate = calculateSeats(amount);
      setBuyQuote(seatsEstimate.toString());
      setLoadingQuote(false);
    } else {
      setBuyQuote(null);
    }
  }, [amount, calculateSeats]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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

  const handleMaxClick = (): void => {
    if (sbtcBalance !== null && sbtcBalance !== undefined) {
      setAmount(formatBalance(sbtcBalance));
      setSelectedPreset("max");
    } else {
      toast({
        title: "sBTC Balance not available",
        description:
          "Your sBTC balance is not available. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleBuyPrelaunchSeats = async () => {
    if (!accessToken || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    const sbtcAmountInSats = Math.floor(parseFloat(amount) * Math.pow(10, 8));
    const seatsRequested = calculateSeats(amount);

    // Validate minimum seat purchase (at least 20k sats)
    if (sbtcAmountInSats < HARDCODED_VALUES.seatPriceSats) {
      toast({
        title: "Invalid amount",
        description: `Minimum purchase is ${HARDCODED_VALUES.seatPriceSats / 100000000} sBTC (1 seat = 20k sats)`,
        variant: "destructive",
      });
      return;
    }

    // Validate maximum seats per user
    if (seatsRequested > HARDCODED_VALUES.maxSeatsPerUser) {
      toast({
        title: "Too many seats",
        description: `Maximum ${HARDCODED_VALUES.maxSeatsPerUser} seats per user. You're trying to buy ${seatsRequested} seats.`,
        variant: "destructive",
      });
      return;
    }

    // Validate seats are whole numbers (amount must be multiple of seat price)
    if (sbtcAmountInSats % HARDCODED_VALUES.seatPriceSats !== 0) {
      const exactAmount =
        (seatsRequested * HARDCODED_VALUES.seatPriceSats) / Math.pow(10, 8);
      toast({
        title: "Invalid amount",
        description: `Amount must be exact multiple of seat price. For ${seatsRequested} seat(s), use ${exactAmount.toFixed(8)} sBTC`,
        variant: "destructive",
      });
      return;
    }

    const sbtcBalanceInSats = Math.floor((sbtcBalance ?? 0) * Math.pow(10, 8));

    if (sbtcAmountInSats > sbtcBalanceInSats) {
      toast({
        title: "Insufficient sBTC balance",
        description: `You need more sBTC to complete this purchase. Required: ${(
          sbtcAmountInSats / Math.pow(10, 8)
        ).toFixed(8)} sBTC, Available: ${(
          (sbtcBalanceInSats || 0) / Math.pow(10, 8)
        ).toFixed(8)} sBTC`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const [contractAddress, contractName] =
        HARDCODED_VALUES.buyAndDepositContract.split(".");
      const [sbtcAddress, sbtcName] = SBTC_CONTRACT.split(".");

      // Two post conditions based on the actual asset transfers:
      // 1. User transfers sBTC to adapter contract
      // 2. Adapter contract transfers sBTC to DEX
      const postConditions = [
        // User -> Adapter contract transfer
        Pc.principal(userAddress)
          .willSendEq(sbtcAmountInSats)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
        // Adapter contract -> DEX transfer (same amount)
        Pc.principal(`${contractAddress}.${contractName}`)
          .willSendEq(sbtcAmountInSats)
          .ft(`${sbtcAddress}.${sbtcName}`, "sbtc-token"),
      ];

      const params = {
        contract: `${contractAddress}.${contractName}` as `${string}.${string}`,
        functionName: "buy-seats-and-deposit",
        functionArgs: [uintCV(sbtcAmountInSats)],
        postConditions,
        postConditionMode: "deny" as const,
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
                await txResponse.json();
              }
            } catch {}
          }
        }, 30000);
      } else {
        throw new Error("Transaction failed or was rejected.");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to purchase prelaunch seats.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundSeats = async () => {
    if (!accessToken || !userAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsRefunding(true);

    try {
      const [contractAddress, contractName] =
        HARDCODED_VALUES.buyAndDepositContract.split(".");

      const params = {
        contract: `${contractAddress}.${contractName}` as `${string}.${string}`,
        functionName: "refund-seat-and-deposit",
        functionArgs: [], // No parameters required
        postConditions: [], // No post conditions needed for refund
      };

      const response = await request("stx_callContract", params);

      if (response && response.txid) {
        setActiveTxId(response.txid);
        setIsModalOpen(true);

        toast({
          title: "Refund Initiated",
          description:
            "Your prelaunch seat refund has been initiated. sBTC will be returned to your agent voting account.",
          variant: "default",
        });
      } else {
        throw new Error("Refund transaction failed or was rejected.");
      }
    } catch {
      toast({
        title: "Refund Error",
        description: "Failed to refund prelaunch seats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader />
        <p className="text-sm text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">
            Buy ${HARDCODED_VALUES.daoName} Prelaunch Seats
          </h2>
          <p className="text-muted-foreground">
            Purchase prelaunch seats with sBTC - vesting automatically deposited
            to agent account
          </p>
        </div>

        {/* Amount Input */}
        <div className="border p-5 rounded-md">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Amount (sBTC)
              </label>
              <Input
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0001"
                className="text-2xl"
                disabled={!hasAccessToken}
              />
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={
                    selectedPreset === "0.0002" ? "default" : "secondary"
                  }
                  size="sm"
                  onClick={() => handlePresetClick("0.0002")}
                  disabled={!hasAccessToken}
                >
                  1 Seat
                </Button>
                <Button
                  variant={
                    selectedPreset === "0.0014" ? "default" : "secondary"
                  }
                  size="sm"
                  onClick={() => handlePresetClick("0.0014")}
                  disabled={!hasAccessToken}
                >
                  7 Seats
                </Button>
              </div>
              <Button
                variant={selectedPreset === "max" ? "default" : "secondary"}
                size="sm"
                onClick={handleMaxClick}
                disabled={!hasAccessToken}
              >
                MAX
              </Button>
            </div>

            {/* Available Balance */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Available sBTC Balance
                </span>
                {hasAccessToken ? (
                  <Button
                    onClick={() => {
                      if (sbtcBalance !== null && sbtcBalance !== undefined) {
                        setAmount(formatBalance(sbtcBalance));
                        setSelectedPreset(null);
                      }
                    }}
                    className="font-bold hover:text-primary transition-colors"
                    disabled={
                      isSbtcBalanceLoading ||
                      sbtcBalance === null ||
                      sbtcBalance === undefined
                    }
                  >
                    {isSbtcBalanceLoading
                      ? "Loading..."
                      : sbtcBalance !== null && sbtcBalance !== undefined
                        ? `${formatBalance(sbtcBalance)} sBTC`
                        : "Unable to load balance"}
                  </Button>
                ) : (
                  <span className="font-bold">N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Display */}
        <div className="border rounded-lg p-6 text-center min-h-[84px] flex items-center justify-center">
          {!hasAccessToken ? (
            <div className="text-2xl font-semibold">
              0 {HARDCODED_VALUES.daoName}
            </div>
          ) : loadingQuote ? (
            <div className="flex items-center gap-2">
              <Loader />
              <span className="text-sm">Fetching quote…</span>
            </div>
          ) : (
            <div className="text-2xl font-semibold">
              {buyQuote || "0.00"} Seats
            </div>
          )}
        </div>

        {/* Buy Button */}
        <Button
          onClick={handleBuyPrelaunchSeats}
          disabled={
            !hasAccessToken ||
            parseFloat(amount) <= 0 ||
            isSubmitting ||
            (stxBalance || 0) < 0.01
          }
          className="w-full font-bold py-6 text-lg"
          variant="primary"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <Loader />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">₿</span>
              </div>
              {hasAccessToken ? (
                <span>Buy Prelaunch Seats</span>
              ) : (
                <span>Connect wallet to Buy</span>
              )}
            </div>
          )}
        </Button>

        {/* Refund Button */}
        <Button
          onClick={handleRefundSeats}
          disabled={!hasAccessToken || isRefunding || isSubmitting}
          variant="outline"
          className="w-full font-medium py-4 text-base"
        >
          {isRefunding ? (
            <div className="flex items-center space-x-2">
              <Loader />
              <span>Refunding...</span>
            </div>
          ) : (
            <span>Refund Prelaunch Seats</span>
          )}
        </Button>

        {/* Connection Status */}
        {!hasAccessToken && (
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm">
              Connect your wallet to start buying {HARDCODED_VALUES.daoName}{" "}
              prelaunch seats
            </p>
          </div>
        )}

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
          successTitle="Buy Order Confirmed"
          failureTitle="Buy Order Failed"
          successDescription={`Your prelaunch seat purchase for ${HARDCODED_VALUES.daoName} has been successfully confirmed. Vesting will be automatically deposited to your agent account when released.`}
          failureDescription="The transaction could not be completed. Please check your balance and try again."
          pendingDescription="Your transaction is being processed. This may take a few minutes."
          onRetry={handleBuyPrelaunchSeats}
        />
      </div>
    </div>
  );
};

export default PrelaunchPage;
