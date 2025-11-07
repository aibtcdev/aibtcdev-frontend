"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Check,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import type { DAO } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/services/dao.service";
import { vetoProposal, type ApiResponse } from "@/services/tool.service";
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

interface DAOVetoProposalProps {
  daoId: string;
  proposalId: string;
  dao?: DAO;
  size?: "sm" | "default" | "lg";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  disabled?: boolean;
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
 * Parse the output field from the API response to extract JSON data
 */
function parseOutput(raw: string): ParsedOutput | null {
  const idxArr: number[] = [];
  for (let i = 0; i < raw.length; i++) if (raw[i] === "{") idxArr.push(i);
  for (const idx of idxArr) {
    const slice = raw.slice(idx).trim();
    try {
      return JSON.parse(slice);
    } catch {
      continue;
    }
  }
  return null;
}

export function DAOVetoProposal({
  daoId,
  proposalId,
  size = "default",
  variant = "destructive",
  className,
  disabled = false,
}: DAOVetoProposalProps) {
  const [showResultDialog, setShowResultDialog] = useState(false);
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

  /* ---------------------- Helper to build payload data --------------------- */
  const buildVetoPayload = () => {
    if (!daoExtensions || daoExtensions.length === 0) return null;

    const actionProposalsVotingExt = daoExtensions.find(
      (ext) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    if (!actionProposalsVotingExt) return null;

    return {
      dao_action_proposal_voting_contract:
        actionProposalsVotingExt.contract_principal,
      proposal_id: proposalId,
    };
  };

  /* ------------------------------ API call helper ------------------------------ */
  const sendVetoRequest = async (payload: {
    dao_action_proposal_voting_contract: string;
    proposal_id: string;
  }) => {
    if (!accessToken) throw new Error("Missing access token");

    setIsSubmitting(true);
    try {
      const response = await vetoProposal(accessToken, payload);
      console.log("Veto API Response:", response);

      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* --------------------------------- Handlers --------------------------------- */
  const handleVetoProposal = async () => {
    const payload = buildVetoPayload();
    if (!payload) {
      const errorResponse: ApiResponse = {
        success: false,
        error: "Could not determine required DAO extensions for veto action",
        output: "",
      };
      setApiResponse(errorResponse);
      setShowResultDialog(true);
      return;
    }

    try {
      const response = await sendVetoRequest(payload);

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

  /* ---------------------- Transaction Status Helper --------------------- */
  const getTransactionStatus = () => {
    if (!websocketMessage) {
      if (isWaitingForTx)
        return { status: "broadcasting", label: "Broadcasting", icon: Loader };
      return null;
    }

    const { tx_status } = websocketMessage;

    switch (tx_status) {
      case "success":
        return { status: "confirmed", label: "Confirmed", icon: CheckCircle2 };
      case "pending":
        return { status: "pending", label: "Pending", icon: Clock };
      case "abort_by_response":
      case "abort_by_post_condition":
      case "dropped_replace_by_fee":
      case "dropped_replace_across_fork":
      case "dropped_too_expensive":
      case "dropped_stale_garbage_collect":
      case "dropped_problematic":
        return { status: "failed", label: "Failed", icon: XCircle };
      default:
        return { status: "unknown", label: "Processing", icon: Clock };
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                   */
  /* -------------------------------------------------------------------------- */

  const hasAccessToken = !!accessToken && !isSessionLoading;

  return (
    <>
      {/* ----------------------------- Veto Button ------------------------------ */}
      <Button
        variant={variant}
        size={size}
        onClick={handleVetoProposal}
        disabled={
          !hasAccessToken || isSubmitting || isLoadingExtensions || disabled
        }
        className={className}
      >
        {isSubmitting ? (
          <Loader />
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Veto Contribution
          </>
        )}
      </Button>

      {/* ----------------------------- Result Modal ----------------------------- */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-2xl">
          {apiResponse?.success ? (
            // Success state
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Check className="w-6 h-6" />
                  Veto Transaction Submitted
                </DialogTitle>
                <DialogDescription>
                  Your veto contribution has been successfully broadcasted to
                  the blockchain.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {(() => {
                  const parsed = parseOutput(apiResponse.output);
                  const txStatus = getTransactionStatus();

                  return (
                    <>
                      {/* Transaction Link */}
                      {parsed?.data?.link && (
                        <div className="flex justify-center">
                          <Button asChild variant="outline">
                            <a
                              href={parsed.data.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Transaction
                            </a>
                          </Button>
                        </div>
                      )}

                      {/* Transaction Status */}
                      {parsed?.data?.txid && (
                        <div className="border rounded-sm p-6">
                          <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold">
                              Transaction Status
                            </h3>

                            {txStatus && (
                              <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {txStatus.icon === Loader ? (
                                    <Loader />
                                  ) : (
                                    <txStatus.icon
                                      className={`w-6 h-6 ${
                                        txStatus.status === "confirmed"
                                          ? "text-green-600"
                                          : txStatus.status === "failed"
                                            ? "text-red-600"
                                            : "text-blue-600"
                                      }`}
                                    />
                                  )}
                                  <span className="text-lg font-medium">
                                    {txStatus.label}
                                  </span>
                                </div>

                                {txStatus.status === "confirmed" && (
                                  <p className="text-sm text-muted-foreground">
                                    Your veto contribution has been confirmed on
                                    the blockchain.
                                  </p>
                                )}

                                {txStatus.status === "pending" && (
                                  <p className="text-sm text-muted-foreground">
                                    Your transaction is being processed. This
                                    may take a few minutes.
                                  </p>
                                )}

                                {txStatus.status === "failed" && (
                                  <p className="text-sm text-muted-foreground">
                                    Your transaction failed to process. You can
                                    try again.
                                  </p>
                                )}

                                {txStatus.status === "broadcasting" && (
                                  <p className="text-sm text-muted-foreground">
                                    Broadcasting your transaction to the
                                    network...
                                  </p>
                                )}
                              </div>
                            )}

                            {!txStatus && !websocketError && (
                              <div className="flex flex-col items-center gap-3">
                                <Loader />
                                <span className="text-lg font-medium">
                                  Monitoring Transaction
                                </span>
                                <p className="text-sm text-muted-foreground">
                                  Waiting for blockchain confirmation...
                                </p>
                              </div>
                            )}

                            {/* Transaction Details */}
                            {websocketMessage?.block_height &&
                              txStatus?.status === "confirmed" && (
                                <div className="pt-4 border-t space-y-2">
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      Block Height:
                                    </span>{" "}
                                    {websocketMessage.block_height.toLocaleString()}
                                  </div>
                                  {websocketMessage.block_time_iso && (
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Confirmed At:
                                      </span>{" "}
                                      {new Date(
                                        websocketMessage.block_time_iso
                                      ).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* WebSocket Error */}
                            {websocketError && (
                              <div className="text-sm text-muted-foreground">
                                Unable to monitor transaction status
                                automatically. You can check the transaction
                                status using the link above.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowResultDialog(false)}>
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
                <DialogDescription>
                  There was an error processing your veto contribution.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <div className="border rounded-sm p-4">
                  <h4 className="font-semibold mb-2">Error Details</h4>
                  <p className="text-sm text-muted-foreground">
                    {apiResponse?.error || "An unknown error occurred"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button onClick={() => setShowResultDialog(false)}>
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
