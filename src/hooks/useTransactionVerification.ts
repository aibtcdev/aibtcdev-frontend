import { useState, useRef, useEffect, useCallback } from "react";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";

export interface WebSocketTransactionMessage {
  tx_id: string;
  tx_status:
    | "success"
    | "pending"
    | "abort_by_response"
    | "abort_by_post_condition"
    | "dropped_replace_by_fee"
    | "dropped_replace_across_fork"
    | "dropped_too_expensive"
    | "dropped_stale_garbage_collect"
    | "dropped_problematic";
  tx_result?: {
    hex: string;
    repr: string;
  };
  block_height?: number;
  block_time_iso?: string;
  nonce?: number;
  fee_rate?: string;
  sender_address?: string;
  sponsored?: boolean;
  post_condition_mode?: string;
  post_conditions?: unknown[];
  anchor_mode?: string;
  is_unanchored?: boolean;
  block_hash?: string;
  parent_block_hash?: string;
  burn_block_height?: number;
  burn_block_time?: number;
  burn_block_time_iso?: string;
  canonical?: boolean;
  tx_index?: number;
  microblock_hash?: string;
  microblock_sequence?: number;
  microblock_canonical?: boolean;
  event_count?: number;
  events?: unknown[];
  execution_cost_read_count?: number;
  execution_cost_read_length?: number;
  execution_cost_runtime?: number;
  execution_cost_write_count?: number;
  execution_cost_write_length?: number;
  tx_type?: string;
  contract_call?: unknown;
}

export type TransactionStatus = "pending" | "success" | "failed";

export interface UseTransactionVerificationReturn {
  transactionMessage: WebSocketTransactionMessage | null;
  transactionStatus: TransactionStatus;
  startMonitoring: (txid: string) => Promise<void>;
  stopMonitoring: () => void;
  reset: () => void;
}

export function useTransactionVerification(): UseTransactionVerificationReturn {
  const [transactionMessage, setTransactionMessage] =
    useState<WebSocketTransactionMessage | null>(null);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>("pending");

  const websocketRef = useRef<Awaited<
    ReturnType<typeof connectWebSocketClient>
  > | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | null>(
    null
  );
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopMonitoring = useCallback(async () => {
    if (subscriptionRef.current) {
      try {
        await subscriptionRef.current.unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from WebSocket:", error);
      }
      subscriptionRef.current = null;
    }
    if (websocketRef.current) {
      websocketRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setTransactionMessage(null);
    setTransactionStatus("pending");
  }, []);

  // Fallback function to check transaction status via API
  const checkTransactionStatus = useCallback(async (txid: string) => {
    try {
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
      const apiUrl = isMainnet
        ? "https://api.mainnet.hiro.so"
        : "https://api.testnet.hiro.so";

      const response = await fetch(`${apiUrl}/extended/v1/tx/${txid}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const txData = await response.json();
      console.log("API transaction check:", txData);

      // Create a WebSocket-like message from API response
      const message: WebSocketTransactionMessage = {
        tx_id: txData.tx_id,
        tx_status: txData.tx_status,
        tx_result: txData.tx_result,
        block_height: txData.block_height,
        block_time_iso: txData.block_time_iso,
        // ... other fields can be mapped as needed
      };

      setTransactionMessage(message);

      // Update status based on API response
      const isSuccess = txData.tx_status === "success";
      const isFailed = [
        "abort_by_response",
        "abort_by_post_condition",
        "dropped_replace_by_fee",
        "dropped_replace_across_fork",
        "dropped_too_expensive",
        "dropped_stale_garbage_collect",
        "dropped_problematic",
      ].includes(txData.tx_status);

      if (isSuccess) {
        setTransactionStatus("success");
        return true; // Final state reached
      } else if (isFailed) {
        setTransactionStatus("failed");
        return true; // Final state reached
      } else {
        setTransactionStatus("pending");
        return false; // Still pending
      }
    } catch (error) {
      console.error("Error checking transaction status via API:", error);
      return false;
    }
  }, []);

  const startMonitoring = useCallback(
    async (txid: string) => {
      try {
        // Clean up any existing connections
        await stopMonitoring();

        // Reset state
        reset();

        console.log("Starting transaction monitoring for:", txid);

        // First, do an immediate API check to see if transaction is already confirmed
        const isComplete = await checkTransactionStatus(txid);
        if (isComplete) {
          console.log(
            "Transaction already in final state, no need for WebSocket"
          );
          return;
        }

        // Start WebSocket monitoring
        const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
        const websocketUrl = isMainnet
          ? "wss://api.mainnet.hiro.so/"
          : "wss://api.testnet.hiro.so/";

        try {
          const client = await connectWebSocketClient(websocketUrl);
          websocketRef.current = client;

          // Subscribe to transaction updates for the specific txid
          const subscription = await client.subscribeTxUpdates(
            txid,
            (event) => {
              console.log("WebSocket transaction update:", event);
              setTransactionMessage(event);

              // Check if transaction has reached a final state
              const { tx_status } = event;
              const isSuccess = tx_status === "success";
              const isFailed = [
                "abort_by_response",
                "abort_by_post_condition",
                "dropped_replace_by_fee",
                "dropped_replace_across_fork",
                "dropped_too_expensive",
                "dropped_stale_garbage_collect",
                "dropped_problematic",
              ].includes(tx_status);

              // Update status
              if (isSuccess) {
                setTransactionStatus("success");
              } else if (isFailed) {
                setTransactionStatus("failed");
              } else {
                setTransactionStatus("pending");
              }

              const isFinalState = isSuccess || isFailed;
              if (isFinalState) {
                // Clean up subscription after receiving final update
                stopMonitoring();
              }
            }
          );

          subscriptionRef.current = subscription;
        } catch (wsError) {
          console.error(
            "WebSocket connection failed, falling back to polling:",
            wsError
          );
          // If WebSocket fails, start polling as fallback
          pollingIntervalRef.current = setInterval(async () => {
            const isComplete = await checkTransactionStatus(txid);
            if (isComplete) {
              stopMonitoring();
            }
          }, 5000); // Poll every 5 seconds
        }

        // Set up a fallback timeout to check via API after 30 seconds
        fallbackTimeoutRef.current = setTimeout(async () => {
          console.log(
            "Fallback timeout reached, checking transaction status via API"
          );
          const isComplete = await checkTransactionStatus(txid);
          if (!isComplete) {
            // If still pending after 30 seconds, continue polling every 10 seconds
            pollingIntervalRef.current = setInterval(async () => {
              const isComplete = await checkTransactionStatus(txid);
              if (isComplete) {
                stopMonitoring();
              }
            }, 10000);
          }
        }, 30000);
      } catch (error) {
        console.error("Transaction monitoring error:", error);
        setTransactionStatus("failed");
      }
    },
    [stopMonitoring, reset, checkTransactionStatus]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    transactionMessage,
    transactionStatus,
    startMonitoring,
    stopMonitoring,
    reset,
  };
}
