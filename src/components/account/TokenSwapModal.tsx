"use client";

import { useState, useEffect, useCallback } from "react";
import { request } from "@stacks/connect";
import { fetchCallReadOnlyFunction, cvToJSON, Cl } from "@stacks/transactions";
import { STACKS_TESTNET, STACKS_MAINNET } from "@stacks/network";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowDownUp, Info, AlertCircle } from "lucide-react";

interface TokenData {
  tokenId: string;
  tokenSymbol: string;
  daoName: string;
  contractPrincipal: string;
  balance: string;
  decimals: number;
}

interface PoolData {
  poolId: string;
  poolName: string;
  poolContract: string;
  xToken: string;
  yToken: string;
  xBalance: string;
  yBalance: string;
  protocolFee: number;
  providerFee: number;
  poolStatus: boolean;
  feeAddress: string;
}

interface TokenSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentAddress: string;
  tokenData: TokenData | null;
  // Target token to swap TO (e.g., sBTC)
  targetToken?: {
    symbol: string;
    name: string;
    contractPrincipal: string;
    decimals: number;
  };
  poolContract?: string;
}

// Network configuration
const network =
  process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
    ? STACKS_MAINNET
    : STACKS_TESTNET;

// On-chain calculation function
async function calculateEstimatedDxOnChain(
  poolContract: string,
  xTokenContract: string,
  yTokenContract: string,
  yAmount: string, // human amount input by user
  yDecimals: number,
  xDecimals: number,
  sender: string
): Promise<{ dx: string; minDx: string }> {
  if (!yAmount || parseFloat(yAmount) <= 0) {
    return { dx: "0", minDx: "0" };
  }

  const yAmountMicro = BigInt(
    Math.floor(parseFloat(yAmount) * 10 ** yDecimals)
  );

  // Split principals
  const [poolAddr, poolName] = poolContract.split(".");
  const [xAddr, xName] = xTokenContract.split(".");
  const [yAddr, yName] = yTokenContract.split(".");

  const res = await fetchCallReadOnlyFunction({
    contractAddress: "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A", // core
    contractName: "xyk-core-v-1-2",
    functionName: "get-dx",
    functionArgs: [
      Cl.contractPrincipal(poolAddr, poolName),
      Cl.contractPrincipal(xAddr, xName),
      Cl.contractPrincipal(yAddr, yName),
      Cl.uint(yAmountMicro),
    ],
    senderAddress: sender,
    network,
  });

  // Parse the Clarity response properly
  console.log("Raw get-dx response:", res);

  // Convert the ClarityValue to JSON
  const json = cvToJSON(res);
  console.log("Parsed CV to JSON:", json);

  let dxMicro: bigint;

  // Handle different response structures
  if (json.success === true && json.value) {
    // Response(ok) type with success property
    if (json.value.type === "uint") {
      dxMicro = BigInt(json.value.value);
    } else {
      throw new Error(`Unexpected inner value type: ${json.value.type}`);
    }
  } else if (json.type === "ok" && json.value) {
    // Response(ok) type without success property
    if (json.value.type === "uint") {
      dxMicro = BigInt(json.value.value);
    } else {
      throw new Error(`Unexpected inner value type: ${json.value.type}`);
    }
  } else if (json.type === "uint") {
    // Direct uint type
    dxMicro = BigInt(json.value);
  } else if (json.type === "err" || json.success === false) {
    // Error response
    const errorValue = json.value || json;
    throw new Error(`get-dx returned error: ${JSON.stringify(errorValue)}`);
  } else {
    throw new Error(
      `Unexpected get-dx response structure: ${JSON.stringify(json)}`
    );
  }

  // Format to human-readable decimals
  const dx = (Number(dxMicro) / 10 ** xDecimals).toFixed(xDecimals);

  // Auto slippage 5% (500bps)
  const SLIPPAGE_BPS = BigInt(500);
  const BPS_BIGINT = BigInt(10000);
  const minDxMicro = dxMicro - (dxMicro * SLIPPAGE_BPS) / BPS_BIGINT;
  const minDx = (Number(minDxMicro) / 10 ** xDecimals).toFixed(xDecimals);

  return { dx, minDx };
}

// Helper function to format balance with custom decimals
function formatBalance(value: string | number, decimals: number = 8): string {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  num = num / Math.pow(10, decimals);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

export function TokenSwapModal({
  isOpen,
  onClose,
  agentAddress,
  tokenData,
  targetToken = {
    symbol: "sBTC",
    name: "Synthetic Bitcoin",
    contractPrincipal: "STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token",
    decimals: 8,
  },
  poolContract = "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.xyk-pool-sbtc-faces2-v-1-1",
}: TokenSwapModalProps) {
  const [yAmount, setYAmount] = useState("");
  const [minDx, setMinDx] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [estimatedDx, setEstimatedDx] = useState<string>("0");

  const { balances, fetchContractBalance } = useWalletStore();
  const {
    transactionMessage,
    transactionStatus,
    startMonitoring,
    stopMonitoring,
    reset: resetVerification,
  } = useTransactionVerification();

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  // Fetch agent contract balance when component mounts or agent address changes
  useEffect(() => {
    if (agentAddress) {
      fetchContractBalance(agentAddress).catch((err) => {
        console.error("Failed to fetch agent contract balance:", err);
      });
    }
  }, [agentAddress, fetchContractBalance]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setYAmount("");
      setMinDx("");
      setCurrentTxId(null);
      setShowStatusModal(false);
      setPoolError(null);
      setEstimatedDx("0");
      stopMonitoring();
      resetVerification();
    } else if (tokenData) {
      // In allow mode, just set basic pool data immediately
      setPoolData({
        poolId: `${tokenData.tokenSymbol.toLowerCase()}-sbtc-pool`,
        poolName: `${tokenData.tokenSymbol}/sBTC Pool`,
        poolContract: poolContract,
        xToken: targetToken.contractPrincipal,
        yToken: tokenData.contractPrincipal,
        xBalance: "1000000000000", // Mock liquidity
        yBalance: "5000000000000", // Mock liquidity
        protocolFee: 30, // 0.3%
        providerFee: 20, // 0.2%
        poolStatus: true,
        feeAddress: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS.fee-collector",
      });
    }
  }, [
    isOpen,
    tokenData,
    stopMonitoring,
    resetVerification,
    poolContract,
    targetToken.contractPrincipal,
  ]);

  const calculateEstimatedDx = useCallback(async () => {
    if (!poolData || !yAmount || !tokenData || !stacksAddress) return;

    try {
      const { dx, minDx } = await calculateEstimatedDxOnChain(
        poolData.poolContract,
        targetToken.contractPrincipal,
        tokenData.contractPrincipal,
        yAmount,
        tokenData.decimals,
        targetToken.decimals,
        stacksAddress
      );

      setEstimatedDx(dx);
      setMinDx(minDx);
    } catch (err) {
      console.error("Error fetching dx from chain:", err);
      setEstimatedDx("0");
      setMinDx("0");
    }
  }, [
    poolData,
    yAmount,
    tokenData,
    stacksAddress,
    targetToken.contractPrincipal,
    targetToken.decimals,
  ]);

  // Calculate estimated dx when yAmount changes
  useEffect(() => {
    if (yAmount && poolData && parseFloat(yAmount) > 0 && stacksAddress) {
      calculateEstimatedDx();
    } else {
      setEstimatedDx("0");
      setMinDx("");
    }
  }, [yAmount, poolData, stacksAddress, calculateEstimatedDx]);

  const handleSwap = async () => {
    if (
      !poolData ||
      !yAmount ||
      !minDx ||
      !stacksAddress ||
      !agentAddress ||
      !tokenData
    )
      return;

    setIsSwapping(true);

    try {
      const yAmountMicroTokens = Math.floor(
        parseFloat(yAmount) * Math.pow(10, tokenData.decimals)
      );
      const minDxMicroTokens = Math.floor(
        parseFloat(minDx) * Math.pow(10, targetToken.decimals)
      );

      // Skip post conditions for now - just validate basic requirements
      const agentBalance = balances[agentAddress];
      if (!agentBalance?.fungible_tokens) {
        throw new Error("Agent account balance not available");
      }

      // Find the Y token in agent's balance
      const tokenKey = Object.keys(agentBalance.fungible_tokens).find((key) =>
        key.startsWith(tokenData.contractPrincipal)
      );

      if (!tokenKey) {
        throw new Error(`${tokenData.tokenSymbol} not found in agent account`);
      }

      // Split contract principals
      const [poolAddress, poolName] = poolContract.split(".");
      const [xTokenAddress, xTokenName] =
        targetToken.contractPrincipal.split(".");
      const [yTokenAddress, yTokenContractName] =
        tokenData.contractPrincipal.split(".");

      const txResponse = await request("stx_callContract", {
        contract:
          "STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-core-v-1-2" as `${string}.${string}`,
        functionName: "swap-y-for-x",
        functionArgs: [
          // pool-trait
          Cl.contractPrincipal(poolAddress, poolName),
          // x-token-trait (what we receive)
          Cl.contractPrincipal(xTokenAddress, xTokenName),
          // y-token-trait (what we sell)
          Cl.contractPrincipal(yTokenAddress, yTokenContractName),
          // y-amount
          Cl.uint(yAmountMicroTokens),
          // min-dx
          Cl.uint(minDxMicroTokens),
        ],
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
          | "mainnet"
          | "testnet",
        postConditionMode: "allow",
      });

      console.log("Swap transaction initiated successfully", txResponse);

      const txId = txResponse.txid || null;
      setCurrentTxId(txId);
      setShowStatusModal(true);

      if (txId) {
        await startMonitoring(txId);
      }
    } catch (error) {
      console.error("Error initiating swap:", error);
      setIsSwapping(false);
    }
  };

  const handleMaxAmount = () => {
    if (!agentAddress || !balances[agentAddress]?.fungible_tokens || !tokenData)
      return;

    const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
      (key) => key.startsWith(tokenData.contractPrincipal)
    );

    if (tokenKey) {
      const tokenBalance =
        balances[agentAddress].fungible_tokens[tokenKey].balance;
      const maxAmount =
        parseFloat(tokenBalance) / Math.pow(10, tokenData.decimals);
      setYAmount(maxAmount.toString());
    }
  };

  const isValidSwap = () => {
    if (
      !yAmount ||
      !minDx ||
      !poolData ||
      !agentAddress ||
      !balances[agentAddress]?.fungible_tokens ||
      !tokenData
    ) {
      return false;
    }

    const yAmountNum = parseFloat(yAmount);
    const minDxNum = parseFloat(minDx);

    if (yAmountNum <= 0 || minDxNum <= 0) return false;

    // Check if agent has sufficient Y token balance
    const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
      (key) => key.startsWith(tokenData.contractPrincipal)
    );

    if (!tokenKey) return false;

    const tokenBalance =
      balances[agentAddress].fungible_tokens[tokenKey].balance;
    const maxAmount =
      parseFloat(tokenBalance) / Math.pow(10, tokenData.decimals);

    return yAmountNum <= maxAmount;
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    if (transactionStatus === "success") {
      onClose();
    }
  };

  const handleRetry = () => {
    setShowStatusModal(false);
    resetVerification();
    setCurrentTxId(null);
  };

  const getAgentTokenBalance = () => {
    if (!agentAddress || !balances[agentAddress]?.fungible_tokens || !tokenData)
      return "0";

    const tokenKey = Object.keys(balances[agentAddress].fungible_tokens).find(
      (key) => key.startsWith(tokenData.contractPrincipal)
    );

    if (!tokenKey) return "0";

    const tokenBalance =
      balances[agentAddress].fungible_tokens[tokenKey].balance;
    return formatBalance(tokenBalance, tokenData.decimals);
  };

  if (!tokenData) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ArrowDownUp className="w-5 h-5" />
              <span>
                Swap {tokenData.tokenSymbol} for {targetToken.symbol}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Pool Status */}
            {poolError ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{poolError}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : poolData ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Pool Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pool:</span>
                    <Badge variant="outline">{poolData.poolName}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{targetToken.symbol} Liquidity:</span>
                    <span>
                      {formatBalance(poolData.xBalance, targetToken.decimals)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{tokenData.tokenSymbol} Liquidity:</span>
                    <span>
                      {formatBalance(poolData.yBalance, tokenData.decimals)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Fees:</span>
                    <span>
                      {(
                        (poolData.protocolFee + poolData.providerFee) /
                        100
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Swap Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>You Sell ({tokenData.tokenSymbol})</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={yAmount}
                      onChange={(e) => setYAmount(e.target.value)}
                      step="any"
                      min="0"
                      disabled={isSwapping || !poolData}
                    />
                    <Button
                      variant="outline"
                      onClick={handleMaxAmount}
                      size="sm"
                      disabled={isSwapping || !poolData}
                    >
                      MAX
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available in Agent: {getAgentTokenBalance()}{" "}
                    {tokenData.tokenSymbol}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowDownUp className="w-6 h-6 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>You Receive ({targetToken.symbol})</Label>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-lg font-medium">
                    {estimatedDx} {targetToken.symbol}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated amount (before slippage)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Minimum Received ({targetToken.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={minDx}
                  onChange={(e) => setMinDx(e.target.value)}
                  step="any"
                  min="0"
                  disabled={isSwapping || !poolData}
                />
                <div className="text-sm text-muted-foreground">
                  Transaction will revert if you receive less than this amount
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {yAmount && poolData && parseFloat(yAmount) > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>Swap Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Protocol Fee:</span>
                    <span>{(poolData.protocolFee / 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Fee:</span>
                    <span>{(poolData.providerFee / 100).toFixed(2)}%</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Estimated Output:</span>
                    <span>
                      {estimatedDx} {targetToken.symbol}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={!isValidSwap() || isSwapping || !poolData}
              className="w-full"
              size="lg"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Swapping...
                </>
              ) : !poolData ? (
                "Loading Pool..."
              ) : (
                `Swap ${yAmount || "0"} ${tokenData.tokenSymbol} for ${targetToken.symbol}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={showStatusModal}
        onClose={handleStatusModalClose}
        txId={currentTxId || undefined}
        transactionStatus={transactionStatus}
        transactionMessage={transactionMessage}
        title="Token Swap Status"
        successTitle="Swap Completed"
        failureTitle="Swap Failed"
        successDescription={`Your swap of ${yAmount} ${tokenData?.tokenSymbol} for ${targetToken.symbol} has been completed successfully.`}
        failureDescription="The token swap could not be completed. Please try again."
        pendingDescription="Your token swap is being processed on the blockchain. This may take a few minutes."
        onRetry={handleRetry}
        showRetryButton={true}
      />
    </>
  );
}
