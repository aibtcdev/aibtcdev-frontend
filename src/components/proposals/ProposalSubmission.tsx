"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Edit3,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
import type { DAO, Token } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/services/dao.service";
import { fetchAgents } from "@/services/agent.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";
import { getAllErrorDetails } from "@aibtc/types";
import {
  useUnicodeValidation,
  UnicodeIssueWarning,
} from "@/hooks/useUnicodeValidation";
import {
  proposeSendMessage,
  generateProposalRecommendation,
  isProposalRecommendationError,
  type ApiResponse,
  type ProposalRecommendationRequest,
} from "@/services/tool.service";
import {
  fetchTwitterEmbed,
  isTwitterOEmbedError,
  type TwitterOEmbedResponse,
} from "@/services/twitter.service";

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

interface ProposalSubmissionProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  onSubmissionSuccess?: () => void;
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

export function ProposalSubmission({
  daoId,
  onSubmissionSuccess,
}: ProposalSubmissionProps) {
  const [proposal, setProposal] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [twitterEmbed, setTwitterEmbed] =
    useState<TwitterOEmbedResponse | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const { issues, hasAnyIssues, cleanText } = useUnicodeValidation(proposal);
  const handleClean = () => {
    setProposal(cleanText);
  };
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  // WebSocket state
  const [websocketMessage, setWebsocketMessage] =
    useState<WebSocketTransactionMessage | null>(null);
  const websocketRef = useRef<Awaited<
    ReturnType<typeof connectWebSocketClient>
  > | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => Promise<void> } | null>(
    null
  );

  // Modal view state: "initial" = submitted, "confirmed-success" = chain confirmed, "confirmed-failure" = chain failed
  const [txStatusView, setTxStatusView] = useState<
    "initial" | "confirmed-success" | "confirmed-failure"
  >("initial");

  const { accessToken, isLoading: isSessionLoading, userId } = useAuth();

  // Error code mapping
  const errorDetailsArray = getAllErrorDetails();
  const errorCodeMap = errorDetailsArray.reduce(
    (map, err) => {
      map[err.code] = err;
      return map;
    },
    {} as Record<number, (typeof errorDetailsArray)[0]>
  );

  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Fetch user's DAO Manager agent
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Twitter URL validation
  const twitterUrlRegex = /^https:\/\/x\.com\/[a-zA-Z0-9_]+\/status\/\d+$/;
  const isValidTwitterUrl = twitterUrlRegex.test(twitterUrl);

  // Calculate combined length including the Twitter URL
  const referenceText = twitterUrl ? `\n\nReference: ${twitterUrl}` : "";
  const combinedLength = proposal.length + referenceText.length;
  const isWithinLimit = combinedLength <= 2043;

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe?.();
      }
    };
  }, []);

  // Fetch Twitter embed when URL is valid
  useEffect(() => {
    const fetchEmbed = async () => {
      if (isValidTwitterUrl && twitterUrl) {
        setIsLoadingEmbed(true);
        setTwitterEmbed(null);

        try {
          const embedData = await fetchTwitterEmbed(twitterUrl);

          if (!isTwitterOEmbedError(embedData)) {
            setTwitterEmbed(embedData);
          } else {
            console.error("Failed to fetch Twitter embed:", embedData.error);
            setTwitterEmbed(null);
          }
        } catch (error) {
          console.error("Error fetching Twitter embed:", error);
          setTwitterEmbed(null);
        } finally {
          setIsLoadingEmbed(false);
        }
      } else {
        setTwitterEmbed(null);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchEmbed, 500);

    return () => clearTimeout(timeoutId);
  }, [twitterUrl, isValidTwitterUrl]);

  /* ---------------------- WebSocket helper functions --------------------- */
  const connectToWebSocket = async (txid: string) => {
    try {
      setWebsocketMessage(null);
      setTxStatusView("initial");

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
        const isSuccess = tx_status === "success";
        const isFailed =
          tx_status === "abort_by_response" ||
          tx_status === "abort_by_post_condition" ||
          tx_status === "dropped_replace_by_fee" ||
          tx_status === "dropped_replace_across_fork" ||
          tx_status === "dropped_too_expensive" ||
          tx_status === "dropped_stale_garbage_collect" ||
          tx_status === "dropped_problematic";
        const isFinalState = isSuccess || isFailed;

        // Update modal state based on status
        if (isSuccess) {
          setTxStatusView("confirmed-success");
          setProposal(""); // Clear proposal only after successful confirmation
        } else if (isFailed) setTxStatusView("confirmed-failure");

        if (isFinalState) {
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
    }
  };

  /* ---------------------- Helpers – extension data builder --------------------- */
  const buildExtensionData = () => {
    if (!daoExtensions || daoExtensions.length === 0 || !agents) return null;

    const findExt = (type: string, subtype: string) =>
      daoExtensions.find((ext) => ext.type === type && ext.subtype === subtype);

    const actionProposalsVotingExt = findExt(
      "EXTENSIONS",
      "ACTION_PROPOSAL_VOTING"
    );
    const actionProposalContractExt = findExt("ACTIONS", "SEND_MESSAGE");
    const daoTokenExt = findExt("TOKEN", "POOL");

    // Find the user's agent based on profile_id
    const userAgent = agents.find((agent) => agent.profile_id === userId);

    if (
      !actionProposalsVotingExt ||
      !actionProposalContractExt ||
      !daoTokenExt ||
      !userAgent?.account_contract
    ) {
      return null;
    }

    return {
      agent_account_contract: userAgent.account_contract,
      action_proposals_voting_extension:
        actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute:
        actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: `${proposal.trim()}\n\nReference: ${twitterUrl}`,
      memo: "Proposal submitted via aibtcdev frontend",
    };
  };

  /* ------------------------------ API call helper ------------------------------ */
  const sendRequest = async (payload: {
    agent_account_contract: string;
    action_proposals_voting_extension: string;
    action_proposal_contract_to_execute: string;
    dao_token_contract_address: string;
    message: string;
    memo: string;
  }) => {
    if (!accessToken) throw new Error("Missing access token");

    setIsSubmitting(true);
    try {
      const response = await proposeSendMessage(accessToken, payload);
      console.log("API Response:", response);

      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !proposal.trim() ||
      !twitterUrl.trim() ||
      !isValidTwitterUrl ||
      !isWithinLimit
    )
      return;

    const extensionData = buildExtensionData();
    if (!extensionData) {
      console.error("Could not determine required DAO extensions");
      return;
    }

    try {
      const response = await sendRequest(extensionData);

      setApiResponse(response);
      setShowResultDialog(true);
      setTxStatusView("initial");

      // If successful, start WebSocket monitoring
      if (response.success) {
        const parsed = parseOutput(response.output);
        const txid = parsed?.data?.txid;

        if (txid) {
          await connectToWebSocket(txid);
        }

        // Call success callback
        onSubmissionSuccess?.();
        // setProposal(""); // Do NOT clear here; will clear after confirmed-success
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
      setTxStatusView("initial");
    }
  };

  const handleAIGenerate = async () => {
    if (!accessToken) {
      console.error("No access token available for AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Generating AI proposal for DAO:", daoId);

      // Create the API request
      const request: ProposalRecommendationRequest = {
        dao_id: daoId,
        focus_area: "governance", // Default focus area, could be made configurable
        specific_needs:
          "Generate a comprehensive proposal that addresses current DAO needs and opportunities",
        model_name: "gpt-4.1", // Use the recommended model
        temperature: 0.3, // Balance between creativity and focus
      };

      // Make the API call
      const result = await generateProposalRecommendation(accessToken, request);

      if (isProposalRecommendationError(result)) {
        throw new Error(result.error);
      }

      // Set the generated content as the proposal text
      setProposal(result.content);

      console.log("AI proposal generated successfully:", {
        title: result.title,
        priority: result.priority,
        proposalsAnalyzed: result.proposals_analyzed,
        tokenUsage: result.token_usage,
      });
    } catch (error) {
      console.error("Failed to generate AI proposal:", error);

      // Fallback to a basic template if the API fails
      const fallbackText = `## Proposal Title
[Insert your proposal title here]

## Objective
Describe the main goal and purpose of this proposal.

## Rationale
Explain why this proposal is needed and how it benefits the DAO.

## Implementation Plan
Detail the specific steps needed to execute this proposal.

## Success Metrics
Define how success will be measured.

## Timeline
Provide an estimated timeline for completion.

## Budget Requirements
List any resources or funding needed.

Note: This is a template generated after AI assistance encountered an issue. Please customize it with your specific proposal details.`;

      setProposal(fallbackText);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setShowResultDialog(false);
    // Reset WebSocket state and modal status view
    setWebsocketMessage(null);
    setTxStatusView("initial");
    // Clean up any existing connections
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe?.();
    }
  };

  const hasAccessToken = !!accessToken && !isSessionLoading;

  // Parse the backend output for inner success and message
  const parsedApiResponse = apiResponse
    ? parseOutput(apiResponse.output)
    : null;
  const isInnerSuccess = apiResponse?.success && parsedApiResponse?.success;

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Edit3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Submit Contribution
            </h2>
            <p className="text-muted-foreground">
              Propose a completed contribution to the DAO to request a reward.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={proposal}
              onChange={(e) => {
                const value = e.target.value;
                setProposal(value);
              }}
              placeholder={
                hasAccessToken
                  ? "Describe what you contributed. What did you create or share? Why does it matter?"
                  : "Connect your wallet to create a proposal"
              }
              className="w-full min-h-[120px] p-4 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              disabled={
                !hasAccessToken ||
                isSubmitting ||
                isGenerating ||
                isLoadingExtensions ||
                isLoadingAgents
              }
            />
            {proposal.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {combinedLength} / 2043 characters
              </div>
            )}
          </div>
          {!isWithinLimit && (
            <div className="text-xs text-red-500 mt-1">
              ⚠️ Combined text exceeds the 2043-character limit. Please shorten
              your message or use a shorter Twitter URL.
            </div>
          )}
          <UnicodeIssueWarning issues={issues} />

          <div className="relative">
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="Paste the X.com (Twitter) post that shows your work"
              className="w-full p-4 bg-background/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              disabled={
                !hasAccessToken ||
                isSubmitting ||
                isGenerating ||
                isLoadingExtensions ||
                isLoadingAgents
              }
              required
            />
            {twitterUrl && !isValidTwitterUrl && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ Please enter a valid X.com (Twitter) post URL in the format:
                https://x.com/username/status/1234567890123456789
              </div>
            )}
          </div>

          {/* Twitter Embed Preview */}
          {twitterUrl && isValidTwitterUrl && (
            <div className="bg-background/50 border border-border/50 rounded-xl p-4">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                Twitter Post Preview
              </div>
              {isLoadingEmbed ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Loading preview...
                  </div>
                </div>
              ) : twitterEmbed ? (
                <div
                  className="twitter-embed"
                  dangerouslySetInnerHTML={{ __html: twitterEmbed.html }}
                />
              ) : (
                <div className="text-sm text-muted-foreground py-4">
                  Failed to load Twitter post preview
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAIGenerate}
              disabled={
                !hasAccessToken ||
                isSubmitting ||
                isGenerating ||
                isLoadingExtensions ||
                isLoadingAgents
              }
              className="flex items-center gap-2 border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary"
            >
              <Sparkles
                className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
              />
              {isGenerating ? "Generating..." : "Generate Message"}
            </Button>
            {hasAnyIssues && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClean}
                className="flex items-center gap-2 border-secondary/50 text-secondary hover:bg-secondary/10 hover:border-secondary"
              >
                Remove Issues
              </Button>
            )}
            <Button
              type="submit"
              disabled={
                !hasAccessToken ||
                !proposal.trim() ||
                !twitterUrl.trim() ||
                !isValidTwitterUrl ||
                !isWithinLimit ||
                isSubmitting ||
                isGenerating ||
                isLoadingExtensions ||
                isLoadingAgents ||
                hasAnyIssues
              }
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
            >
              {isSubmitting ? <Loader /> : <Send className="h-4 w-4" />}
              {isSubmitting ? "Submitting..." : "Submit Proposal"}
            </Button>
          </div>

          {/* Error/Status Messages */}
          {!hasAccessToken && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              💡 <strong>Note:</strong> Connect your wallet to submit proposals
              to the DAO.
            </div>
          )}

          {hasAccessToken && !twitterUrl.trim() && (
            <div className="text-sm rounded-lg p-3">
              <strong>Twitter URL Required:</strong> Please provide a reference
              X.com (Twitter) post URL.
            </div>
          )}

          {hasAccessToken && twitterUrl.trim() && !isValidTwitterUrl && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3">
              <strong>Invalid Twitter URL:</strong> URL must be in the format
              https://x.com/username/status/1234567890123456789
            </div>
          )}

          {hasAccessToken &&
            proposal.trim() &&
            twitterUrl.trim() &&
            isValidTwitterUrl &&
            isWithinLimit && (
              <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
                💡 <strong>Tip:</strong> Make sure your proposal is clear and
                includes specific actionable items. The community will vote on
                this proposal.
              </div>
            )}

          {isLoadingExtensions && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              ⏳ Loading DAO extensions...
            </div>
          )}

          {isLoadingAgents && (
            <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              ⏳ Loading user agent...
            </div>
          )}
        </form>
      </div>

      {/* ----------------------------- Result modal ----------------------------- */}
      <Dialog
        open={showResultDialog}
        onOpenChange={(open) => {
          setShowResultDialog(open);
          if (!open) setTxStatusView("initial");
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {isInnerSuccess ? (
            <>
              {(() => {
                const parsed = parseOutput(apiResponse.output);
                // Three states: initial (submitted), confirmed-success, confirmed-failure
                return (
                  <>
                    {txStatusView === "initial" && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                          <Loader />
                        </div>
                        <DialogHeader className="text-center">
                          <DialogTitle className="text-2xl font-bold mb-2">
                            Proposal Submitted
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            Your proposal is being processed on the blockchain.
                            This may take a few minutes.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          {parsed?.data?.txid && (
                            <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Transaction Status
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                  Processing
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {parsed?.data?.link && (
                              <Button variant="outline" asChild>
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
                            )}
                            <Button
                              onClick={() => {
                                setShowResultDialog(false);
                                setTxStatusView("initial");
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {txStatusView === "confirmed-success" && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                          <Check className="w-8 h-8 text-primary" />
                        </div>
                        <DialogHeader className="text-center">
                          <DialogTitle className="text-2xl font-bold mb-2">
                            Proposal Confirmed
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            Your proposal has been successfully submitted to the
                            DAO and is now live for voting.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">
                                Transaction Status
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                Confirmed
                              </span>
                            </div>
                            {websocketMessage?.block_height && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Block Height
                                </span>
                                <span className="font-mono">
                                  {websocketMessage.block_height.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            {parsed?.data?.link && (
                              <Button variant="outline" asChild>
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
                            )}
                            <Button
                              onClick={() => {
                                setShowResultDialog(false);
                                setTxStatusView("initial");
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {txStatusView === "confirmed-failure" && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                          <AlertCircle className="w-8 h-8 text-secondary" />
                        </div>
                        <DialogHeader className="text-center">
                          <DialogTitle className="text-2xl font-bold mb-2">
                            Proposal Failed
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            The proposal transaction could not be completed.
                            Please try again.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">
                                Transaction Status
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                                Failed
                              </span>
                            </div>
                            {websocketMessage?.tx_result && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">
                                  Reason:{" "}
                                </span>
                                <span className="font-medium">
                                  {(() => {
                                    const raw =
                                      websocketMessage.tx_result.repr ||
                                      websocketMessage.tx_result.hex;
                                    const match = raw.match(/u?(\d{4,})/);
                                    if (match) {
                                      const code = parseInt(match[1], 10);
                                      const description =
                                        errorCodeMap[code]?.description;
                                      return (
                                        description || "Transaction failed"
                                      );
                                    }
                                    return "Transaction failed";
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button variant="outline" onClick={handleRetry}>
                              Try Again
                            </Button>
                            {parsed?.data?.link && (
                              <Button variant="outline" asChild>
                                <a
                                  href={parsed.data.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Details
                                </a>
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setShowResultDialog(false);
                                setTxStatusView("initial");
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          ) : (
            // Error state (API/network)
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-secondary" />
              </div>
              <DialogHeader className="text-center">
                <DialogTitle className="text-2xl font-bold mb-2">
                  Submission Failed
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  There was an error processing your proposal. Please check your
                  connection and try again.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-4">
                {parsedApiResponse?.message ? (
                  <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Error: </span>
                      <span className="font-medium">
                        {parsedApiResponse.message}
                      </span>
                    </div>
                  </div>
                ) : (
                  apiResponse?.error && (
                    <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Error: </span>
                        <span className="font-medium">{apiResponse.error}</span>
                      </div>
                    </div>
                  )
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={handleRetry}>
                    Try Again
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResultDialog(false);
                      setTxStatusView("initial");
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
