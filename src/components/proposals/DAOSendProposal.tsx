"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Send, Check, ExternalLink, AlertCircle } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { Input } from "@/components/ui/input";
import type { DAO, Token } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/services/dao.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";

interface WebSocketTransactionMessage {
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

interface DAOSendProposalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
  className?: string;
}

interface ApiResponse {
  output: string;
  error: string | null;
  success: boolean;
}

interface ParsedOutput {
  success: boolean;
  message: string;
  data: {
    txid?: string;
    link?: string;
  };
}

/**
 * The `output` field that comes back from the backend is *not* pure JSON – it
 * contains a bunch of human‑readable logging lines followed by the JSON block
 * we actually want.  This helper finds the **last** opening curly brace and
 * tries to `JSON.parse` everything from there onward.
 */
function parseOutput(raw: string): ParsedOutput | null {
  const idxArr: number[] = [];
  for (let i = 0; i < raw.length; i++) if (raw[i] === "{") idxArr.push(i);
  for (const idx of idxArr) {
    const slice = raw.slice(idx).trim();
    try {
      return JSON.parse(slice);
    } catch {
      continue; // keep trying – probably hit a nested "{" first
    }
  }
  return null;
}

export function DAOSendProposal({
  daoId,
  size = "default",
  className,
}: DAOSendProposalProps) {
  const [inputValue, setInputValue] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  // WebSocket state
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const [websocketMessage, setWebsocketMessage] =
    useState<WebSocketTransactionMessage | null>(null);
  const [websocketError, setWebsocketError] = useState<string | null>(null);
  const websocketRef = useRef<Awaited<
    ReturnType<typeof connectWebSocketClient>
  > | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | null>(
    null
  );

  const { accessToken, isLoading: isSessionLoading } = useAuth();

  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe?.();
      }
    };
  }, []);

  /* ---------------------- WebSocket helper functions --------------------- */
  const connectToWebSocket = async (txid: string) => {
    try {
      setIsWaitingForTx(true);
      setWebsocketError(null);
      setWebsocketMessage(null);

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
        setWebsocketMessage(event);

        // Check if transaction has reached a final state
        const { tx_status } = event;
        const isFinalState =
          tx_status === "success" ||
          tx_status === "abort_by_response" ||
          tx_status === "abort_by_post_condition" ||
          tx_status === "dropped_replace_by_fee" ||
          tx_status === "dropped_replace_across_fork" ||
          tx_status === "dropped_too_expensive" ||
          tx_status === "dropped_stale_garbage_collect" ||
          tx_status === "dropped_problematic";

        if (isFinalState) {
          // Transaction is complete, stop waiting and close connection
          setIsWaitingForTx(false);

          // Clean up subscription after receiving final update
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe?.();
          }
        } else {
          // Transaction is still pending, keep connection open but update UI
          console.log(`Transaction still pending with status: ${tx_status}`);
        }
      });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setWebsocketError(
        error instanceof Error
          ? error.message
          : "Failed to connect to WebSocket"
      );
      setIsWaitingForTx(false);
    }
  };

  /* ---------------------- Helpers – extension data builder --------------------- */
  const buildExtensionData = () => {
    if (!daoExtensions || daoExtensions.length === 0) return null;

    const findExt = (type: string, subtype: string) =>
      daoExtensions.find((ext) => ext.type === type && ext.subtype === subtype);

    const actionProposalsVotingExt = findExt(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const actionProposalContractExt = findExt("ACTIONS", "SEND_MESSAGE");
    const daoTokenExt = findExt("TOKEN", "DAO");

    if (!actionProposalsVotingExt || !actionProposalContractExt || !daoTokenExt)
      return null;

    return {
      action_proposals_voting_extension:
        actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute:
        actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: inputValue.trim(),
    };
  };

  /* ------------------------------ API call helper ------------------------------ */
  const sendRequest = async (payload: Record<string, string>) => {
    if (!accessToken) throw new Error("Missing access token");

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `https://core-staging.aibtc.dev/tools/dao/action_proposals/propose_send_message?token=${encodeURIComponent(
          accessToken
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = (await res.json()) as ApiResponse;
      console.log("API Response:", json);

      return json;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------------- Handlers --------------------------------- */
  const handleSendMessage = async () => {
    if (inputValue.trim().length < 50) {
      setInputError("Message should have at least 50 characters");
      return;
    }

    setInputError(null);

    const extensionData = buildExtensionData();
    if (!extensionData) {
      setInputError("Could not determine required DAO extensions");
      return;
    }

    try {
      const response = await sendRequest(extensionData);

      setApiResponse(response);
      setShowResultDialog(true);

      // If successful, start WebSocket monitoring
      if (response.success) {
        const parsed = parseOutput(response.output);
        const txid = parsed?.data?.txid;

        if (txid) {
          await connectToWebSocket(txid);
        }
      }

      // Clear input after any response (success or error)
      setInputValue("");
    } catch (err) {
      // Handle network errors or other unexpected errors
      const networkErrorResponse: ApiResponse = {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to the server",
        output: "",
      };

      setApiResponse(networkErrorResponse);
      setShowResultDialog(true);
    }
  };

  const handleRetry = () => {
    setShowResultDialog(false);
    // Reset WebSocket state
    setIsWaitingForTx(false);
    setWebsocketMessage(null);
    setWebsocketError(null);

    // Clean up any existing connections
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  const hasAccessToken = !!accessToken && !isSessionLoading;

  return (
    <>
      {/* ------------------------------- Input box ------------------------------ */}
      <div className={`w-full ${className ?? ""}`}>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={
              hasAccessToken
                ? "Send on-chain message"
                : "Connect your wallet to send a message"
            }
            className={`w-full h-20 pr-16 text-base ${
              inputError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onKeyDown={handleKeyDown}
            disabled={!hasAccessToken || isSubmitting || isLoadingExtensions}
          />
          <div className="absolute bottom-2 right-2">
            <Button
              variant="primary"
              size={size}
              onClick={handleSendMessage}
              disabled={
                !hasAccessToken ||
                !inputValue.trim() ||
                inputValue.trim().length < 50 ||
                isSubmitting ||
                isLoadingExtensions
              }
            >
              {isSubmitting ? <Loader /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {inputError && (
          <p className="text-sm text-red-500 mt-1">{inputError}</p>
        )}
        {!inputError &&
          hasAccessToken &&
          inputValue.trim().length > 0 &&
          inputValue.trim().length < 50 && (
            <p className="text-sm text-red-500 mt-1">
              {`Message needs ${50 - inputValue.trim().length} more characters`}
            </p>
          )}
        {isLoadingExtensions && (
          <p className="text-sm text-gray-500 mt-1">Loading DAO extensions…</p>
        )}
      </div>

      {/* ----------------------------- Result modal ----------------------------- */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-auto">
          {apiResponse?.success ? (
            // Success state
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Transaction Successful
                </DialogTitle>
                <DialogDescription className="text-base">
                  Your DAO proposal has been successfully submitted to the
                  blockchain.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                {(() => {
                  const parsed = parseOutput(apiResponse.output);
                  return (
                    <>
                      {parsed?.data?.link && (
                        <div className="flex justify-center">
                          <Button asChild>
                            <a
                              href={parsed.data.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View on Explorer
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* WebSocket Status and Message */}
                      {parsed?.data?.txid && (
                        <div className="border rounded-lg p-4 bg-muted">
                          <h4 className="font-semibold mb-2">
                            Transaction Monitoring
                          </h4>
                          <p className="text-sm mb-2">
                            Transaction ID:{" "}
                            <code className=" px-1 py-0.5 rounded">
                              {parsed.data.txid}
                            </code>
                          </p>

                          {isWaitingForTx && (
                            <div className="flex items-center gap-2 text-sm">
                              <Loader />
                              <span>
                                Waiting for transaction confirmation via
                                WebSocket...
                              </span>
                            </div>
                          )}

                          {websocketError && (
                            <div className="text-sm text-red-500">
                              <strong>WebSocket Error:</strong> {websocketError}
                            </div>
                          )}

                          {websocketMessage && (
                            <div className="mt-3">
                              <h5 className="font-medium mb-3">
                                Transaction Status Update:
                              </h5>
                              {(() => {
                                const {
                                  tx_status,
                                  tx_result,
                                  block_height,
                                  block_time_iso,
                                  tx_id,
                                } = websocketMessage;
                                const isSuccess = tx_status === "success";
                                const isPending = tx_status === "pending";
                                const isFailed =
                                  tx_status === "abort_by_response" ||
                                  tx_status === "abort_by_post_condition" ||
                                  tx_status === "dropped_replace_by_fee" ||
                                  tx_status === "dropped_replace_across_fork" ||
                                  tx_status === "dropped_too_expensive" ||
                                  tx_status ===
                                    "dropped_stale_garbage_collect" ||
                                  tx_status === "dropped_problematic";

                                return (
                                  <div className="space-y-3">
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">
                                        Status:
                                      </span>
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          isSuccess
                                            ? "bg-green-100 text-green-800"
                                            : isPending
                                              ? "bg-orange-100 text-orange-800"
                                              : isFailed
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {tx_status?.toUpperCase() || "UNKNOWN"}
                                      </span>
                                    </div>

                                    {/* Transaction Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      {tx_id && (
                                        <div>
                                          <span className="font-medium">
                                            Transaction ID:
                                          </span>
                                          <p className="font-mono text-xs mt-1 break-all">
                                            {tx_id}
                                          </p>
                                        </div>
                                      )}

                                      {block_height && (
                                        <div>
                                          <span className="font-medium">
                                            Block Height:
                                          </span>
                                          <p className="mt-1">
                                            {block_height.toLocaleString()}
                                          </p>
                                        </div>
                                      )}

                                      {block_time_iso && (
                                        <div>
                                          <span className="font-medium">
                                            Block Time:
                                          </span>
                                          <p className="mt-1">
                                            {new Date(
                                              block_time_iso
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Success Result */}
                                    {isSuccess && tx_result && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <h6 className="font-medium text-green-800 mb-2">
                                          ✅ Transaction Successful
                                        </h6>
                                        <div className="text-sm text-green-700">
                                          <span className="font-medium">
                                            Result:
                                          </span>
                                          <p className="font-mono mt-1">
                                            {tx_result.repr || tx_result.hex}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Failed Result */}
                                    {isFailed && tx_result && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <h6 className="font-medium text-red-800 mb-2">
                                          ❌ Transaction Failed
                                        </h6>
                                        <div className="text-sm text-red-700">
                                          {/* <span className="font-medium">Error Details:</span> */}
                                          <p className="font-mono mt-1">
                                            {tx_result.repr || tx_result.hex}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Pending State */}
                                    {isPending && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                        <h6 className="font-medium text-orange-800 mb-2">
                                          ⏳ Transaction Pending
                                        </h6>
                                        <p className="text-sm text-orange-700">
                                          Transaction is being processed...
                                        </p>
                                      </div>
                                    )}

                                    {/* Raw Data Toggle */}
                                    <details className="mt-3">
                                      <summary className="cursor-pointer hover:underline text-sm text-gray-600">
                                        View raw WebSocket data
                                      </summary>
                                      <pre className="whitespace-pre-wrap text-xs  p-3 rounded border mt-2 max-h-48 overflow-auto font-mono">
                                        {JSON.stringify(
                                          websocketMessage,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </details>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="default"
                  onClick={() => setShowResultDialog(false)}
                >
                  Close
                </Button>
              </div>
            </>
          ) : (
            // Error state
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Transaction Failed
                </DialogTitle>
                <DialogDescription className="text-base">
                  There was an error processing your DAO proposal.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4">
                <div className="bg-muted border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Error Details</h4>
                  <div className="text-sm">
                    {apiResponse?.error || "An unknown error occurred"}
                  </div>
                  {apiResponse?.output && (
                    <details className="mt-3">
                      <summary className="cursor-pointer hover:underline">
                        View full response
                      </summary>
                      <pre className="whitespace-pre-wrap text-xs  p-3 rounded border mt-2 max-h-48 overflow-auto font-mono">
                        {apiResponse.output}
                      </pre>
                    </details>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowResultDialog(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
