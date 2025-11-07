"use client";

import { useState, useEffect, useCallback } from "react";
import { hex } from "@scure/base";
import * as btc from "@scure/btc-signer";
import { styxSDK, TransactionPriority } from "@faktoryfun/styx-sdk";
import {
  type AddressPurpose,
  type AddressType,
  request as xverseRequest,
} from "sats-connect";
import { useToast } from "@/hooks/useToast";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { useAuth } from "@/hooks/useAuth";
import { useClipboard } from "@/hooks/useClipboard";
import type {
  QueryObserverResult,
  RefetchOptions,
} from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import type { ConfirmationData } from "./DepositForm";
import type {
  DepositStatus,
  DepositHistoryResponse,
  Deposit,
} from "@faktoryfun/styx-sdk";
import { cvToHex, uintCV, hexToCV, cvToJSON } from "@stacks/transactions";

interface HiroGetInResponse {
  result?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface LeatherSignPsbtRequestParams {
  hex: string;
  network: string;
  broadcast: boolean;
  allowedSighash?: number[];
  allowUnknownOutputs?: boolean;
}

export interface LeatherSignPsbtResponse {
  result?: {
    hex: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface LeatherProvider {
  request(
    method: "signPsbt",
    params: LeatherSignPsbtRequestParams
  ): Promise<LeatherSignPsbtResponse>;
}

// Add this to fix the window.LeatherProvider type error
declare global {
  interface Window {
    LeatherProvider?: LeatherProvider;
  }
}

interface TransactionConfirmationProps {
  confirmationData: ConfirmationData;
  open: boolean;
  onClose: () => void;
  feePriority: TransactionPriority;
  setFeePriority: (priority: TransactionPriority) => void;
  userAddress: string;
  btcAddress: string;
  activeWalletProvider: "leather" | "xverse" | null;
  refetchDepositHistory: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<Deposit[], Error>>;
  refetchAllDeposits: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<DepositHistoryResponse, Error>>;
  minTokenOut?: number;
  poolId?: string;
  swapType?: "sbtc" | "usda" | "pepe" | "aibtc";
  dexId?: number;
  dexContract: string;
  aiAccountReceiver?: string;
}

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

export default function TransactionConfirmation({
  confirmationData,
  open,
  onClose,
  feePriority,
  setFeePriority,
  userAddress,
  btcAddress,
  activeWalletProvider,
  refetchDepositHistory,
  refetchAllDeposits,
  minTokenOut,
  poolId,
  swapType,
  dexId,
  dexContract,
  aiAccountReceiver,
}: TransactionConfirmationProps) {
  const { toast } = useToast();
  const [btcTxStatus, setBtcTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const { copiedText, copyToClipboard } = useClipboard();
  const [successTxId, setSuccessTxId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get session state from Zustand store
  const { accessToken, isLoading } = useAuth();

  const [feeEstimates, setFeeEstimates] = useState<{
    low: { rate: number; fee: number; time: string };
    medium: { rate: number; fee: number; time: string };
    high: { rate: number; fee: number; time: string };
  }>({
    low: { rate: 1, fee: 0, time: "30 min" },
    medium: { rate: 3, fee: 0, time: "~20 min" },
    high: { rate: 5, fee: 0, time: "~10 min" },
  });

  const [loadingFees, setLoadingFees] = useState(true);
  const [buyQuote, setBuyQuote] = useState<HiroGetInResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);

  const [computedMinTokenOut, setComputedMinTokenOut] = useState<
    number | undefined
  >(minTokenOut);

  const isP2SHAddress = (address: string): boolean => {
    return address.startsWith("3");
  };

  const getBuyQuote = useCallback(
    async (amount: string): Promise<HiroGetInResponse | null> => {
      try {
        const btcAmount = Math.floor(parseFloat(amount) * Math.pow(10, 8));
        console.log(
          `Calling getBuyQuote for ${swapType} with ${amount} BTC (${btcAmount} sats)`
        );

        if (!dexContract) {
          console.warn("No dexContract provided for quote");
          return null;
        }

        const [contractAddress, contractName] = dexContract.split(".");

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
        console.log(`getBuyQuote Hiro response for ${swapType}:`, data);
        return data;
      } catch (error) {
        console.error(`[DEBUG] Error in getBuyQuote for ${swapType}:`, error);
        return null;
      }
    },
    [userAddress, swapType, dexContract]
  );

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

  // Fetch fee rates as soon as the modal opens
  useEffect(() => {
    const fetchFeeEstimates = async () => {
      if (open) {
        setLoadingFees(true);
        try {
          // Get fee rate estimates from SDK or API
          const feeRates = await fetchMempoolFeeEstimates();

          setFeeEstimates(feeRates);
        } catch (error) {
          console.error("Error fetching fee estimates:", error);
          // Fallback to default estimates with proper separation
          setFeeEstimates({
            low: { rate: 1, fee: 148, time: "30 min" },
            medium: { rate: 2, fee: 296, time: "~20 min" },
            high: { rate: 5, fee: 740, time: "~10 min" },
          });
        } finally {
          setLoadingFees(false);
        }
      }
    };

    fetchFeeEstimates();
  }, [open]);

  useEffect(() => {
    const fetchBuyQuoteOnOpen = async () => {
      if (open && confirmationData.userInputAmount) {
        setLoadingQuote(true);
        const data = await getBuyQuote(confirmationData.userInputAmount);
        setBuyQuote(data);
        // Parse and apply slippage protection on tokens-out from buy quote result
        if (data?.result) {
          try {
            const clarityValue = hexToCV(data.result);
            const jsonValue = cvToJSON(clarityValue);
            console.log("Parsed jsonValue for aibtc:", jsonValue);

            if (jsonValue.value?.value) {
              console.log(
                "Available keys:",
                Object.keys(jsonValue.value.value)
              );
              console.log(
                "tokens-out value:",
                jsonValue.value.value["tokens-out"]
              );

              if (jsonValue.success && jsonValue.value.value["tokens-out"]) {
                const rawAmount = jsonValue.value.value["tokens-out"].value;
                console.log(`Raw amount from ${swapType} quote:`, rawAmount);

                // Apply slippage protection (4% slippage)
                const slippageFactor = 1 - 4 / 100;
                console.log("Slippage factor:", slippageFactor);
                const minOut = Math.floor(Number(rawAmount) * slippageFactor);
                console.log(
                  `Min token out calculated for ${swapType}:`,
                  minOut
                );
                setComputedMinTokenOut(minOut);
              }
            }
          } catch (error) {
            console.error(`Error parsing ${swapType} buy quote result:`, error);
          }
        }
        setLoadingQuote(false);
      }
    };
    fetchBuyQuoteOnOpen();
  }, [
    open,
    confirmationData.depositAmount,
    getBuyQuote,
    confirmationData.userInputAmount,
    swapType,
  ]);

  useEffect(() => {
    if (buyQuote) console.log(`buyQuote updated for ${swapType}:`, buyQuote);
  }, [buyQuote, swapType]);

  const executeBitcoinTransaction = async (): Promise<void> => {
    console.log(
      `Starting ${swapType} transaction with activeWalletProvider:`,
      activeWalletProvider
    );

    // Check if user is authenticated
    if (!accessToken) {
      toast({
        title: "Authentication required",
        description: "Please sign in before proceeding with the transaction",
        variant: "destructive",
      });
      return;
    }

    // Check if wallet is connected
    if (!activeWalletProvider) {
      toast({
        title: "No wallet connected",
        description: "Please connect a wallet before proceeding",
        variant: "destructive",
      });
      return;
    }

    if (!confirmationData) {
      toast({
        title: "Error",
        description: "Missing transaction data",
        variant: "destructive",
      });
      return;
    }

    // Begin Bitcoin transaction process
    setBtcTxStatus("pending");

    try {
      // Always fetch fee estimates directly from mempool.space before transaction
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

      // Create deposit record with new structure
      console.log(`Creating ${swapType} deposit with data:`, {
        btcAmount: parseFloat(confirmationData.depositAmount),
        stxReceiver: userAddress || "",
        btcSender: btcAddress || "",
        isBlaze: false,
        swapType: swapType,
        minTokenOut: computedMinTokenOut,
        poolId: poolId,
        dexId: dexId,
        aiAccountReceiver: aiAccountReceiver,
      });

      const depositId = await styxSDK.createDeposit({
        btcAmount: parseFloat(confirmationData.depositAmount),
        stxReceiver: userAddress || "", // User's STX address (for filtering)
        btcSender: btcAddress || "",
        isBlaze: false,
        swapType: swapType,
        minTokenOut: confirmationData.minTokenOut,
        poolId: poolId,
        dexId: dexId,
        aiAccountReceiver: aiAccountReceiver,
      });

      console.log(`Create ${swapType} deposit depositId:`, depositId);

      try {
        if (
          activeWalletProvider === "leather" &&
          (typeof window === "undefined" || !window.LeatherProvider)
        ) {
          throw new Error("Leather wallet is not installed or not accessible");
        }

        console.log(
          "Window object has LeatherProvider:",
          !!window.LeatherProvider
        );

        if (!userAddress) {
          throw new Error("STX address is missing or invalid");
        }

        if (activeWalletProvider === "leather") {
          console.log("About to use LeatherProvider:", window.LeatherProvider);
        }

        // Use the BTC address from context
        if (!btcAddress) {
          throw new Error("Could not find a valid BTC address in wallet");
        }

        const senderBtcAddress = btcAddress;
        console.log("Using BTC address from context:", senderBtcAddress);

        // First prepare the transaction with current fee rates and user parameters
        const preparedTransaction = await styxSDK.prepareTransaction({
          amount: confirmationData.depositAmount,
          userAddress,
          btcAddress,
          feePriority,
          walletProvider: activeWalletProvider,
          feeRates: currentFeeRates,
          minTokenOut: computedMinTokenOut || confirmationData.minTokenOut,
          swapType: swapType,
          poolId: poolId,
          dexId: dexId,
          aiAccountReceiver: aiAccountReceiver,
        });

        // Now execute transaction with the properly prepared data
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
          walletProvider: activeWalletProvider,
          btcAddress: senderBtcAddress,
        });

        console.log(
          `${swapType?.toUpperCase()} transaction execution prepared:`,
          transactionData
        );

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
          activeWalletProvider === "xverse" &&
          transactionData.needsFrontendInputHandling
        ) {
          console.log("Adding P2SH inputs specifically for Xverse");

          // Only for P2SH + Xverse, do we need to add inputs - in all other cases the backend handled it
          for (const utxo of preparedTransaction.utxos) {
            try {
              // First, try to get the account (which might fail if we don't have permission)
              console.log("Trying to get wallet account...");
              let walletAccount = await xverseRequest(
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
                const permissionResponse = await xverseRequest(
                  "wallet_requestPermissions",
                  null
                );
                console.log("Permission response:", permissionResponse);

                // If the user granted permission, try again to get the account
                if (permissionResponse.status === "success") {
                  console.log(
                    "Permission granted. Trying to get wallet account again..."
                  );
                  walletAccount = await xverseRequest(
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
                const paymentAddress = walletAccount.result.addresses.find(
                  (addr: {
                    address: string;
                    walletType: "software" | "ledger" | "keystone";
                    publicKey: string;
                    purpose: AddressPurpose;
                    addressType: AddressType;
                  }) =>
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

        console.log("Wallet-specific flow for:", activeWalletProvider);

        if (activeWalletProvider === "leather" && window.LeatherProvider) {
          // Leather wallet flow
          const requestParams = {
            hex: finalTxPsbtHex,
            network: "mainnet",
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
          const signedTx = btc.Transaction.fromPSBT(hex.decode(signedPsbtHex));
          signedTx.finalize();
          const finalTxHex = hex.encode(signedTx.extract());

          // Manually broadcast the transaction
          const broadcastResponse = await fetch(
            "https://mempool.space/api/tx",
            {
              method: "POST",
              headers: {
                "Content-Type": "text/plain",
              },
              body: finalTxHex,
            }
          );

          if (!broadcastResponse.ok) {
            const errorText = await broadcastResponse.text();
            throw new Error(`Failed to broadcast transaction: ${errorText}`);
          }

          txid = await broadcastResponse.text();
        } else if (window.XverseProviders) {
          console.log("Executing Xverse transaction flow");
          console.log("xverseRequest function type:", typeof xverseRequest);
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

            // Prepare request params matching demo.tsx exactly
            const xverseParams = {
              psbt: finalTxPsbtBase64,
              signInputs: inputAddresses,
              broadcast: true, // Let Xverse handle broadcasting
              options: {
                allowUnknownInputs: true,
                allowUnknownOutputs: true,
              },
            };

            // For P2SH addresses with Xverse, we need to add a special note in the logs
            if (isP2SHAddress(senderBtcAddress)) {
              console.log("Using P2SH-specific params for Xverse");
              console.log(
                "P2SH address detected, relying on Xverse's internal handling"
              );
            }

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
              console.error("No txid in successful Xverse response:", response);
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
              status: "broadcast" as DepositStatus,
            },
          });

          console.log(
            `Successfully updated ${swapType} deposit:`,
            JSON.stringify(updateResult, null, 2)
          );
        } catch (error) {
          console.error(
            `Error updating ${swapType} deposit with ID:`,
            depositId
          );
          console.error("Update error details:", error);
          if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
        }

        // Update state with success - Debug log the values
        console.log("Setting success state with txid:", txid);
        setBtcTxStatus("success");
        setSuccessTxId(txid);
        setShowSuccessModal(true);
        console.log("Success modal state should now be true");

        // Trigger data refetch
        Promise.all([refetchDepositHistory(), refetchAllDeposits()]).finally(
          () => {
            // Optionally show a toast to confirm refresh
            toast({
              title: "Data Refreshed",
              description: "Your transaction history has been updated",
            });
          }
        );
      } catch (err: unknown) {
        console.error("Error in Bitcoin transaction process:", err);
        setBtcTxStatus("error");

        // Update deposit as canceled if wallet interaction failed
        await styxSDK.updateDepositStatus({
          id: depositId,
          data: {
            status: "canceled" as DepositStatus,
          },
        });

        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to process Bitcoin transaction. Please try again.";

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      console.error(`Error creating ${swapType} deposit record:`, err);
      setBtcTxStatus("error");

      toast({
        title: "Error",
        description: `Failed to initiate ${swapType} deposit. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Render loading state while initializing session
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader />
            <p className="mt-4 text-s">Loading your session...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="mr-2 h-8 w-8 text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle>Confirm Transaction Data</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Authentication status */}
            {!accessToken && (
              <Alert variant="destructive" className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Authentication required. Please sign in before proceeding with
                  the transaction.
                </AlertDescription>
              </Alert>
            )}

            {/* Wallet connection status */}
            {!activeWalletProvider && (
              <Alert variant="destructive" className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No wallet connected. Please connect a wallet before proceeding
                  with the transaction.
                </AlertDescription>
              </Alert>
            )}

            {/* Transaction details */}
            <div className="bg-zinc-900 p-4 rounded-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-3">
                <div className="text-xs font-medium text-zinc-300">Amount:</div>
                <div className="col-span-2 relative">
                  <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                    {confirmationData.depositAmount} BTC
                  </div>
                </div>

                <div className="text-xs font-medium text-zinc-300">
                  STX Address:
                </div>
                <div className="col-span-2 relative">
                  <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                    {confirmationData.stxAddress}
                  </div>
                </div>

                {aiAccountReceiver && (
                  <>
                    <div className="text-xs font-medium text-zinc-300">
                      AI Account:
                    </div>
                    <div className="col-span-2 relative">
                      <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                        {aiAccountReceiver}
                      </div>
                    </div>
                  </>
                )}

                {poolId && (
                  <>
                    <div className="text-xs font-medium text-zinc-300">
                      Pool ID:
                    </div>
                    <div className="col-span-2 relative">
                      <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                        {poolId}
                      </div>
                    </div>
                  </>
                )}

                {dexId !== undefined && (
                  <>
                    <div className="text-xs font-medium text-zinc-300">
                      DEX ID:
                    </div>
                    <div className="col-span-2 relative">
                      <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                        {dexId}
                      </div>
                    </div>
                  </>
                )}

                <div className="text-xs font-medium text-zinc-300 self-start">
                  OP_RETURN:
                </div>
                <div className="col-span-2 relative">
                  <div className="bg-zinc-800 p-2 rounded-sm max-h-[60px] overflow-y-auto overflow-x-hidden font-mono text-xs break-all whitespace-normal leading-tight">
                    {confirmationData.opReturnHex}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 bg-primary"
                    onClick={() =>
                      copyToClipboard(confirmationData.opReturnHex)
                    }
                  >
                    {copiedText === confirmationData.opReturnHex ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Buy Quote */}
                <div className="text-xs font-medium text-zinc-300">
                  Buy Quote:
                </div>
                <div className="col-span-2 relative">
                  <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                    {loadingQuote ? (
                      <Loader />
                    ) : computedMinTokenOut !== undefined ? (
                      // FORMAT TO 8 DECIMALS
                      `${computedMinTokenOut / 1_000_000_00} ${swapType?.toUpperCase() || "tokens"}`
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>

                <div className="text-xs font-medium text-zinc-300">
                  Swap Type:
                </div>
                <div className="col-span-2 relative">
                  <div className="bg-zinc-800 p-2 rounded-sm font-mono text-xs break-all whitespace-normal leading-tight">
                    {swapType?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet provider info */}
            <div className="bg-zinc-900 p-4 rounded-sm">
              <p className="text-sm mb-2 font-medium">Wallet Provider</p>
              <div className="flex items-center">
                <div className="px-3 py-1 bg-zinc-800 rounded-sm text-sm">
                  {activeWalletProvider
                    ? activeWalletProvider.charAt(0).toUpperCase() +
                      activeWalletProvider.slice(1)
                    : "Not Connected"}
                </div>
              </div>
            </div>

            {/* Fee selection */}
            <div className="border-t border-border pt-4">
              {activeWalletProvider === "xverse" && (
                <p className="text-xs text-primary text-right mt-1">
                  Note: For Xverse wallet, we recommend medium (3v/sat) or
                  higher as lower fees might fail.
                </p>
              )}
            </div>

            {/* Fee details */}
            <div className="bg-zinc-900 p-4 rounded-sm">
              <p className="text-sm mb-3 font-medium">Select priority</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card
                  className={cn(
                    "rounded-sm overflow-hidden border border-zinc-700 hover:border-primary cursor-pointer",
                    feePriority === TransactionPriority.Low
                      ? "bg-primary/20"
                      : "bg-zinc-900"
                  )}
                  onClick={() => setFeePriority(TransactionPriority.Low)}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-white text-sm font-medium mb-1">Low</p>
                    <p className="text-zinc-300 text-xs">
                      {loadingFees ? (
                        <Loader />
                      ) : (
                        `${feeEstimates.low.fee} sats`
                      )}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      ({feeEstimates.low.rate} sat/vB)
                    </p>
                    <p className="text-zinc-400 text-xs">30 min</p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "rounded-sm overflow-hidden border border-zinc-700 hover:border-primary cursor-pointer",
                    feePriority === TransactionPriority.Medium
                      ? "bg-primary/20"
                      : "bg-zinc-900"
                  )}
                  onClick={() => setFeePriority(TransactionPriority.Medium)}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-white text-sm font-medium mb-1">
                      Medium
                    </p>
                    <p className="text-zinc-300 text-xs">
                      {loadingFees ? (
                        <Loader />
                      ) : (
                        `${feeEstimates.medium.fee} sats`
                      )}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      ({feeEstimates.medium.rate} sat/vB)
                    </p>
                    <p className="text-zinc-400 text-xs">~20 min</p>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    "rounded-sm overflow-hidden border border-zinc-700 hover:border-primary cursor-pointer",
                    feePriority === TransactionPriority.High
                      ? "bg-primary/20"
                      : "bg-zinc-900"
                  )}
                  onClick={() => setFeePriority(TransactionPriority.High)}
                >
                  <CardContent className="p-3 text-center">
                    <p className="text-white text-sm font-medium mb-1">High</p>
                    <p className="text-zinc-300 text-xs">
                      {loadingFees ? (
                        <Loader />
                      ) : (
                        `${feeEstimates.high.fee} sats`
                      )}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      ({feeEstimates.high.rate} sat/vB)
                    </p>
                    <p className="text-zinc-400 text-xs">~10 min</p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-zinc-300 mt-4 text-left">
                Fees are estimated based on current network conditions.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-white hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={executeBitcoinTransaction}
              disabled={
                btcTxStatus === "pending" ||
                !activeWalletProvider ||
                !accessToken
              }
            >
              {btcTxStatus === "pending"
                ? "Processing..."
                : "Proceed to Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Success Modal */}
      {showSuccessModal && successTxId && (
        <Dialog
          open
          onOpenChange={() => {
            setShowSuccessModal(false);
            onClose();
          }}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center">
                Transaction Successful!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Success message */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-sm flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-zinc-400">
                  Your {swapType?.toUpperCase()} transaction has been
                  successfully broadcast to the Bitcoin network.
                </p>
              </div>

              {/* Transaction details */}
              <div className="bg-zinc-900 p-4 rounded-sm space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-zinc-300">
                    Amount:
                  </span>
                  <span className="text-sm font-mono">
                    {confirmationData.depositAmount} BTC
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-zinc-300">
                    Type:
                  </span>
                  <span className="text-sm font-mono">
                    {swapType?.toUpperCase()}
                  </span>
                </div>

                <div className="pt-3 border-t border-zinc-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-zinc-300">
                      Transaction ID:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        successTxId && copyToClipboard(successTxId)
                      }
                      className="h-6 w-6 p-0"
                    >
                      {copiedText === successTxId ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {/* Make the transaction ID clickable */}
                  <button
                    onClick={() =>
                      successTxId &&
                      window.open(
                        `https://mempool.space/tx/${successTxId}`,
                        "_blank"
                      )
                    }
                    className="w-full bg-zinc-800 hover:bg-zinc-700 transition-colors p-3 rounded-sm font-mono text-xs break-all text-left text-blue-400 hover:text-blue-300 underline decoration-dotted"
                  >
                    {successTxId}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    successTxId &&
                    window.open(
                      `https://mempool.space/tx/${successTxId}`,
                      "_blank"
                    )
                  }
                  className="w-full border-zinc-600 hover:border-zinc-500"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Mempool.space
                </Button>

                <Button
                  variant="primary"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onClose();
                  }}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
