import { useState, useRef, useEffect } from "react";
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

  const stopMonitoring = async () => {
    if (subscriptionRef.current) {
      await subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (websocketRef.current) {
      websocketRef.current = null;
    }
  };

  const reset = () => {
    setTransactionMessage(null);
    setTransactionStatus("pending");
  };

  const startMonitoring = async (txid: string) => {
    try {
      // Clean up any existing connections
      await stopMonitoring();

      // Reset state
      reset();

      // Determine WebSocket URL based on environment
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
      const websocketUrl = isMainnet
        ? "wss://api.mainnet.hiro.so/"
        : "wss://api.testnet.hiro.so/";

      const client = await connectWebSocketClient(websocketUrl);
      websocketRef.current = client;

      // Subscribe to transaction updates for the specific txid
      const subscription = await client.subscribeTxUpdates(txid, (event) => {
        console.log("WebSocket transaction update:", event);
        setTransactionMessage(event);

        // Check if transaction has reached a final state
        const { tx_status } = event;
        const isSuccess = tx_status === "success";
        const isFailed =
          tx_status === "abort_by_response" ||
          tx_status === "abort_by_post_condition" ||
          tx_status === "dropped_replace_by_fee" ||
          tx_status === "dropped_replace_across_fork" ||
          tx_status === "dropped_too_expensive" ||
          tx_status === "dropped_stale_garbage_collect" ||
          tx_status === "dropped_problematic";

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
        } else {
          // Transaction is still pending, keep connection open
          console.log(`Transaction still pending with status: ${tx_status}`);
        }
      });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setTransactionStatus("failed");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    transactionMessage,
    transactionStatus,
    startMonitoring,
    stopMonitoring,
    reset,
  };
}
