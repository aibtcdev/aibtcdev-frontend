"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  // Sparkles,
  // Edit3,
  Check,
  ExternalLink,
  AlertCircle,
  Gift,
  Lock,
  // X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/reusables/Loader";
import type { DAO, Token } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/services/dao.service";
import { fetchAgents } from "@/services/agent.service";
import { fetchAirdropsBySender } from "@/services/airdrop.service";
import { checkProposalsInBitcoinBlock } from "@/services/contribution.service";
import { fetchLatestChainState } from "@/services/chain-state.service";
import { getStacksAddress } from "@/lib/address";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExplorerLink, truncateString } from "@/utils/format";
import { connectWebSocketClient } from "@stacks/blockchain-api-client";
import { getAllErrorDetails } from "@aibtc/types";
// import {
//   useUnicodeValidation,
//   UnicodeIssueWarning,
// } from "@/hooks/useUnicodeValidation";
import {
  proposeSendMessage,
  // generateProposalRecommendation,
  // isProposalRecommendationError,
  type ApiResponse,
  // type ProposalRecommendationRequest,
} from "@/services/tool.service";
import {
  fetchTwitterEmbed,
  isTwitterOEmbedError,
  type TwitterOEmbedResponse,
} from "@/services/twitter.service";
import { useWalletStore } from "@/store/wallet";
import { useTransactionVerification } from "@/hooks/useTransactionVerification";
import { TransactionStatusModal } from "@/components/ui/TransactionStatusModal";
import { useXStatus } from "@/hooks/useXStatus";
import { XLinking } from "@/components/auth/XLinking";
import { validateXUsernameMatch } from "@/services/x-auth.service";

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
  daoName?: string;
  onSubmissionSuccess?: () => void;
  headerOffset?: number;
}

interface ParsedOutput {
  success: boolean;
  message: string;
  data: {
    txid?: string;
    link?: string;
    reason?: string;
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

/**
 * Extracts error code from transaction result
 * @param txResult - The transaction result object from WebSocket
 * @returns The error code number or null if not found
 */
function extractErrorCode(txResult?: {
  hex: string;
  repr: string;
}): number | null {
  if (!txResult) return null;

  const raw = txResult.repr || txResult.hex;
  const match = raw.match(/u?(\d{4,})/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Checks if an error code requires contract approval
 * @param errorCode - The numeric error code
 * @returns boolean indicating if approval is needed
 */
function requiresContractApproval(errorCode: number | null): boolean {
  // u1101 specifically indicates the contract needs approval
  return errorCode === 1101;
}

/**
 * Cleans a Twitter/X.com URL by removing query parameters and extra arguments
 * @param url - The raw URL input
 * @returns The cleaned URL or empty string if invalid
 */
function cleanTwitterUrl(url: string): string {
  if (!url.trim()) return "";

  try {
    const urlObj = new URL(url.trim());

    // Check if it's a valid X.com or twitter.com domain
    if (!urlObj.hostname.match(/^(x.com|twitter.com)$/)) {
      return "";
    }

    // Extract the pathname and validate the structure
    const pathMatch = urlObj.pathname.match(
      /^\/([a-zA-Z0-9_]+)\/status\/(\d+)$/
    );
    if (!pathMatch) {
      return "";
    }

    const [, username, statusId] = pathMatch;

    // Return the cleaned URL (always use x.com as the canonical domain)
    return `https://x.com/${username}/status/${statusId}`;
  } catch {
    // If URL parsing fails, return empty string
    return "";
  }
}

export function ProposalSubmission({
  daoId,
  daoName,
  onSubmissionSuccess,
}: ProposalSubmissionProps) {
  const [contribution, setContribution] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [selectedAirdropTxHash, setSelectedAirdropTxHash] = useState<
    string | null
  >(null);
  // Twitter embed state
  const [twitterEmbedData, setTwitterEmbedData] =
    useState<TwitterOEmbedResponse | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);
  // Hover preview state
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const [hoverTimeoutId, setHoverTimeoutId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [submissionButtonText, setSubmissionButtonText] = useState("");
  // const [isGenerating, setIsGenerating] = useState(false);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const name = daoName;

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

  // Airdrop notification state
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const [showAirdropNotification, setShowAirdropNotification] = useState(false);

  // X username validation state
  const [isValidatingXUsername, setIsValidatingXUsername] = useState(false);
  const [xUsernameError, setXUsernameError] = useState<string | null>(null);

  const { accessToken, isLoading: isSessionLoading, userId } = useAuth();
  const {
    needsXLink,
    isLoading: isXLoading,
    refreshStatus,
    verificationStatus,
    canSubmitContribution,
  } = useXStatus();

  // Determine if user has access token
  const hasAccessToken = !!accessToken && !isSessionLoading;

  // State for DAO token balance
  // const [daoTokenBalance, setDaoTokenBalance] = useState<string | null>(null);
  const [agentDaoTokenBalance, setAgentDaoTokenBalance] = useState<
    string | null
  >(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // State for Bitcoin block validation
  const [hasProposalInCurrentBlock, setHasProposalInCurrentBlock] =
    useState(false);
  const [isCheckingBitcoinBlock, setIsCheckingBitcoinBlock] = useState(false);
  const [currentBitcoinBlock, setCurrentBitcoinBlock] = useState<number | null>(
    null
  );

  // Error code mapping
  const errorDetailsArray = getAllErrorDetails();
  const errorCodeMap = errorDetailsArray.reduce(
    (map, err) => {
      map[err.code] = err;
      return map;
    },
    {} as Record<number, (typeof errorDetailsArray)[0]> // Explicitly type the accumulator
  );

  // Contract approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalTxId, setApprovalTxId] = useState<string | null>(null);

  const {
    transactionMessage: approvalTransactionMessage,
    transactionStatus: approvalTransactionStatus,
    startMonitoring: startApprovalMonitoring,
    reset: resetApprovalVerification,
  } = useTransactionVerification();

  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    enabled: hasAccessToken, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // 10 min
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch user's DAO Manager agent
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: hasAccessToken && !!userId, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // 10 min
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch current Bitcoin block height
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    enabled: hasAccessToken, // Only fetch when authenticated
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Find the user's agent based on profile_id
  const userAgent = agents?.find((agent) => agent.profile_id === userId);
  const hasAgentAccount = !!userAgent?.account_contract;

  // Debug logs - these will show immediately when component renders
  console.log("DEBUG - ProposalSubmission Agent Validation:");
  console.log("  - userId:", userId);
  console.log("  - agents array:", agents);
  console.log("  - userAgent found:", userAgent);
  console.log("  - userAgent.account_contract:", userAgent?.account_contract);
  console.log("  - hasAgentAccount:", hasAgentAccount);
  console.log("  - isLoadingAgents:", isLoadingAgents);
  console.log("  - hasAccessToken:", hasAccessToken);
  console.log("  - agentDaoTokenBalance:", agentDaoTokenBalance);
  console.log(
    "  - hasAgentDaoTokens:",
    agentDaoTokenBalance && parseFloat(agentDaoTokenBalance) > 0
  );

  // Check DAO token balance (simplified - checking if user has any DAO tokens)
  const daoTokenExt = daoExtensions?.find(
    (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
  );
  // const hasDaoTokens = daoTokenBalance && parseFloat(daoTokenBalance) > 0;
  const hasAgentDaoTokens =
    agentDaoTokenBalance && parseFloat(agentDaoTokenBalance) > 0;

  // Fetch airdrops by sender address to check for matches
  const { data: senderAirdrops = [] } = useQuery({
    queryKey: ["airdrops", "sender", stacksAddress],
    queryFn: () => fetchAirdropsBySender(stacksAddress!),
    // queryFn: () => fetchAirdropsBySender(),
    enabled: hasAccessToken && !!stacksAddress, // Only fetch when authenticated and address available
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Twitter URL validation
  const twitterUrlRegex = /^https:\/\/x\.com\/[a-zA-Z0-9_]+\/status\/\d+$/;
  const isValidTwitterUrl = twitterUrlRegex.test(twitterUrl);

  // Calculate combined length including the Twitter URL
  const twitterReferenceText = twitterUrl
    ? `\n\nReference: ${cleanTwitterUrl(twitterUrl)}`
    : "";
  // No airdrop reference in message length calculation
  const combinedLength = contribution.length + twitterReferenceText.length;
  const isWithinLimit = combinedLength <= 2043;

  // Cleanup WebSocket and hover timeout on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe?.();
      }
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
      }
    };
  }, [hoverTimeoutId]);

  // Get connected wallet address
  useEffect(() => {
    if (hasAccessToken) {
      setStacksAddress(getStacksAddress());
    } else {
      setStacksAddress(null); // Clear address when not authenticated
    }
  }, [hasAccessToken]); // Re-run when authentication state changes

  // Fetch DAO token balance when we have the necessary data
  useEffect(() => {
    const fetchDaoTokenBalance = async () => {
      console.log("BALANCE FETCH - Starting fetch with conditions:");
      console.log("  hasAccessToken:", hasAccessToken);
      console.log("  stacksAddress:", stacksAddress);
      console.log(
        "  daoTokenExt?.contract_principal:",
        daoTokenExt?.contract_principal
      );
      console.log(
        "  userAgent?.account_contract:",
        userAgent?.account_contract
      );

      if (
        !hasAccessToken ||
        !stacksAddress ||
        !daoTokenExt?.contract_principal
      ) {
        console.log("BALANCE FETCH - Early return due to missing conditions");
        // setDaoTokenBalance(null);
        setAgentDaoTokenBalance(null);
        return;
      }

      setIsLoadingBalance(true);
      console.log("BALANCE FETCH - Starting balance fetch...");

      try {
        // Use the wallet store to fetch balance for user wallet
        const { fetchSingleBalance } = useWalletStore.getState();
        console.log(
          "BALANCE FETCH - Fetching user wallet balance for:",
          stacksAddress
        );
        const balance = await fetchSingleBalance(stacksAddress);
        console.log("BALANCE FETCH - User wallet balance response:", balance);

        if (balance?.fungible_tokens?.[daoTokenExt.contract_principal]) {
          const userBalance =
            balance.fungible_tokens[daoTokenExt.contract_principal].balance;
          console.log("BALANCE FETCH - User DAO token balance:", userBalance);
          // setDaoTokenBalance(userBalance);
        } else {
          console.log("BALANCE FETCH - No user DAO tokens found, setting to 0");
          // setDaoTokenBalance("0");
        }

        // Fetch balance for agent account contract if it exists
        if (userAgent?.account_contract) {
          console.log(
            "BALANCE FETCH - Fetching agent account balance for:",
            userAgent.account_contract
          );
          const agentBalance = await fetchSingleBalance(
            userAgent.account_contract
          );
          console.log(
            "BALANCE FETCH - Agent account balance response:",
            agentBalance
          );
          console.log(
            "BALANCE FETCH - Looking for DAO token contract:",
            daoTokenExt.contract_principal
          );
          console.log(
            "BALANCE FETCH - Available fungible tokens:",
            Object.keys(agentBalance?.fungible_tokens || {})
          );
          console.log("BALANCE FETCH - Looking for daoName:", daoName);

          // First try exact match
          if (agentBalance?.fungible_tokens?.[daoTokenExt.contract_principal]) {
            const agentTokenBalance =
              agentBalance.fungible_tokens[daoTokenExt.contract_principal]
                .balance;
            console.log(
              "BALANCE FETCH - Agent DAO token balance (exact match):",
              agentTokenBalance
            );
            setAgentDaoTokenBalance(agentTokenBalance);
          } else {
            // Try to find token by matching daoName after ::
            const matchingTokenContract = Object.keys(
              agentBalance?.fungible_tokens || {}
            ).find((contract) => {
              const tokenName = contract.split("::")[1];
              return tokenName === daoName?.toLowerCase();
            });

            if (matchingTokenContract && agentBalance?.fungible_tokens) {
              const agentTokenBalance =
                agentBalance.fungible_tokens[matchingTokenContract].balance;
              console.log(
                "BALANCE FETCH - Agent DAO token balance (name match):",
                agentTokenBalance,
                "for contract:",
                matchingTokenContract
              );
              setAgentDaoTokenBalance(agentTokenBalance);
            } else {
              console.log(
                "BALANCE FETCH - No agent DAO tokens found for contract:",
                daoTokenExt.contract_principal
              );
              console.log(
                "BALANCE FETCH - No matching token name found for:",
                daoName
              );
              console.log("BALANCE FETCH - Setting to 0");
              setAgentDaoTokenBalance("0");
            }
          }
        } else {
          console.log(
            "BALANCE FETCH - No agent account contract, setting agent balance to null"
          );
          setAgentDaoTokenBalance(null);
        }
      } catch (error) {
        console.error(
          "BALANCE FETCH - Error fetching DAO token balance:",
          error
        );
        // setDaoTokenBalance("0");
        setAgentDaoTokenBalance("0");
      } finally {
        setIsLoadingBalance(false);
        console.log("BALANCE FETCH - Finished loading");
      }
    };

    fetchDaoTokenBalance();
  }, [
    hasAccessToken,
    stacksAddress,
    daoTokenExt?.contract_principal,
    userAgent?.account_contract,
    daoName,
  ]);

  // Update button text based on submission step
  useEffect(() => {
    if (!isSubmitting) {
      setSubmissionButtonText("");
      return;
    }

    const stepMessages = [
      `Submitting contribution for ${daoName}...`,
      "Processing the contribution...",
      "Checking agent voting account...",
      "Setting up contribution transaction...",
      "Broadcasting transaction to network...",
    ];

    setSubmissionButtonText(stepMessages[submissionStep] || "submitting...");
  }, [isSubmitting, submissionStep, daoName]);

  // Check for proposals in current Bitcoin block
  useEffect(() => {
    const checkBitcoinBlockProposals = async () => {
      if (!hasAccessToken || !chainState?.bitcoin_block_height) {
        setHasProposalInCurrentBlock(false);
        setCurrentBitcoinBlock(null);
        return;
      }

      const bitcoinBlockHeight = parseInt(chainState.bitcoin_block_height);
      setCurrentBitcoinBlock(bitcoinBlockHeight);
      setIsCheckingBitcoinBlock(true);

      try {
        const hasProposal = await checkProposalsInBitcoinBlock(
          bitcoinBlockHeight,
          daoId
        );
        setHasProposalInCurrentBlock(hasProposal);
        console.log(
          `Bitcoin block ${bitcoinBlockHeight} validation for DAO ${daoId}:`,
          {
            hasProposal,
            blockHeight: bitcoinBlockHeight,
            daoId,
          }
        );
      } catch (error) {
        console.error("Error checking Bitcoin block proposals:", error);
        setHasProposalInCurrentBlock(false);
      } finally {
        setIsCheckingBitcoinBlock(false);
      }
    };

    checkBitcoinBlockProposals();
  }, [hasAccessToken, chainState?.bitcoin_block_height, daoId]);

  // Show airdrop notification if user has sent airdrops
  useEffect(() => {
    if (senderAirdrops.length > 0 && !showAirdropNotification) {
      setShowAirdropNotification(true);
    }
  }, [senderAirdrops, showAirdropNotification]);

  // Fetch Twitter embed when URL is valid
  useEffect(() => {
    const fetchEmbed = async () => {
      if (!twitterUrl || !isValidTwitterUrl) {
        setTwitterEmbedData(null);
        setEmbedError(null);
        return;
      }

      setIsLoadingEmbed(true);
      setEmbedError(null);

      try {
        const result = await fetchTwitterEmbed(cleanTwitterUrl(twitterUrl));

        if (isTwitterOEmbedError(result)) {
          setEmbedError(result.error);
          setTwitterEmbedData(null);
        } else {
          setTwitterEmbedData(result);
          setEmbedError(null);
        }
      } catch (error) {
        setEmbedError(
          error instanceof Error ? error.message : "Failed to load preview"
        );
        setTwitterEmbedData(null);
      } finally {
        setIsLoadingEmbed(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchEmbed, 500);
    return () => clearTimeout(timeoutId);
  }, [twitterUrl, isValidTwitterUrl]);

  // Hover preview handlers (desktop only)
  const handleMouseEnter = () => {
    // Only enable hover on desktop (screens >= 1024px)
    if (
      window.innerWidth >= 1024 &&
      twitterUrl &&
      isValidTwitterUrl &&
      twitterEmbedData
    ) {
      // Clear any existing timeout
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
      }
      // Show preview after a short delay
      const timeoutId = setTimeout(() => {
        setShowHoverPreview(true);
      }, 300); // 300ms delay
      setHoverTimeoutId(timeoutId);
    }
  };

  const handleMouseLeave = () => {
    // Only handle hover on desktop
    if (window.innerWidth >= 1024) {
      // Clear timeout if mouse leaves before delay completes
      if (hoverTimeoutId) {
        clearTimeout(hoverTimeoutId);
        setHoverTimeoutId(null);
      }
      // Hide preview immediately
      setShowHoverPreview(false);
    }
  };

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
          setContribution(""); // Clear proposal only after successful confirmation
          setTwitterUrl("");
          setSelectedAirdropTxHash(null);
          // Clear Twitter embed data
          setTwitterEmbedData(null);
          setEmbedError(null);
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
    const daoTokenExt = findExt("TOKEN", "DAO");

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

    const twitterReference = twitterUrl
      ? `\n\nReference: ${cleanTwitterUrl(twitterUrl)}`
      : "";

    // Simple message construction - just trim
    const cleanMessage = `${contribution.trim()}${twitterReference}`.trim();
    console.log("agentDaoTokenBalance:", agentDaoTokenBalance);
    console.log("userAgent:", userAgent);
    console.log("userAgent.account_contract:", userAgent?.account_contract);
    return {
      agent_account_contract: userAgent.account_contract,
      action_proposals_voting_extension:
        actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute:
        actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: cleanMessage,
      memo: "Contribution submitted via aibtcdev frontend",
      ...(selectedAirdropTxHash ? { airdrop_txid: selectedAirdropTxHash } : {}),
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
    airdrop_txid?: string;
  }) => {
    if (!accessToken) throw new Error("Missing access token");

    setIsSubmitting(true);
    setSubmissionStep(0);

    try {
      const animationController = { shouldStop: false };

      // Start the step sequence while making the API call
      const stepPromise = (async () => {
        // Step 1: Submitting contribution
        setSubmissionStep(0);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1500);
          const checkStop = () => {
            if (animationController.shouldStop) {
              clearTimeout(timeout);
              resolve(undefined);
            } else {
              setTimeout(checkStop, 100);
            }
          };
          checkStop();
        });
        if (animationController.shouldStop) return;

        // Step 2: Processing the contribution
        setSubmissionStep(1);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1200);
          const checkStop = () => {
            if (animationController.shouldStop) {
              clearTimeout(timeout);
              resolve(undefined);
            } else {
              setTimeout(checkStop, 100);
            }
          };
          checkStop();
        });
        if (animationController.shouldStop) return;

        // Step 3: Checking agent voting account
        setSubmissionStep(2);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1300);
          const checkStop = () => {
            if (animationController.shouldStop) {
              clearTimeout(timeout);
              resolve(undefined);
            } else {
              setTimeout(checkStop, 100);
            }
          };
          checkStop();
        });
        if (animationController.shouldStop) return;

        // Step 4: Setting up contribution transaction
        setSubmissionStep(3);
        await new Promise((resolve) => {
          const timeout = setTimeout(resolve, 1000);
          const checkStop = () => {
            if (animationController.shouldStop) {
              clearTimeout(timeout);
              resolve(undefined);
            } else {
              setTimeout(checkStop, 100);
            }
          };
          checkStop();
        });
        if (animationController.shouldStop) return;

        // Step 5: Broadcasting transaction to network
        setSubmissionStep(4);
      })();

      // Make the actual API call
      const apiPromise = proposeSendMessage(accessToken, payload).then(
        (response) => {
          // Stop animation when API call completes
          animationController.shouldStop = true;
          // Jump to final step
          setSubmissionStep(4);
          return response;
        }
      );

      // Wait for API call to complete (animation will stop when API finishes)
      const response = await apiPromise;
      console.log("API Response:", response);

      // Ensure animation promise is cleaned up
      await stepPromise;

      return response;
    } catch (error) {
      console.error("Submission error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
      setSubmissionStep(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !contribution.trim() ||
      !twitterUrl.trim() ||
      !isValidTwitterUrl ||
      !isWithinLimit ||
      needsXLink
    )
      return;

    // Validate X username matches the linked account
    setIsValidatingXUsername(true);
    setXUsernameError(null);

    try {
      const validation = await validateXUsernameMatch(twitterUrl);

      if (!validation.isValid) {
        setXUsernameError(validation.error || "X username validation failed");
        setIsValidatingXUsername(false);
        return;
      }

      setIsValidatingXUsername(false);
    } catch (error) {
      console.error("X username validation error:", error);
      setXUsernameError("Failed to validate X username. Please try again.");
      setIsValidatingXUsername(false);
      return;
    }

    const extensionData = buildExtensionData();
    if (!extensionData) {
      console.error("Could not determine required DAO extensions");
      return;
    }

    try {
      const response = await sendRequest(extensionData);

      // Small delay before showing transaction status modal
      await new Promise((resolve) => setTimeout(resolve, 300));

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
        // setContribution(""); // Do NOT clear here; will clear after confirmed-success
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

  const handleApproveContract = async () => {
    if (!accessToken || !userAgent?.account_contract || !daoExtensions) {
      console.error("Missing required data for contract approval");
      return;
    }

    const actionProposalsVotingExt = daoExtensions.find(
      (ext) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    if (!actionProposalsVotingExt) {
      console.error("Could not find ACTION_PROPOSAL_VOTING extension");
      return;
    }

    setIsApproving(true);
    setShowApprovalModal(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/agent_account/approve_contract?token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_account_contract: userAgent.account_contract,
            contract_to_approve: actionProposalsVotingExt.contract_principal,
            approval_type: "VOTING",
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      const parsed =
        typeof result.output === "string"
          ? JSON.parse(result.output)
          : result.output;

      // Extract transaction ID from the response
      const txId = parsed?.data?.txid || parsed?.txid || result?.txid;
      if (txId) {
        setApprovalTxId(txId);
        // Start monitoring the transaction
        await startApprovalMonitoring(txId);
      }
    } catch (error) {
      console.error("Contract approval error:", error);
      setShowApprovalModal(false);
    } finally {
      setIsApproving(false);
    }
  };

  // Parse the backend output for inner success and message
  const parsedApiResponse = apiResponse
    ? parseOutput(apiResponse.output)
    : null;
  console.log("parsedApiResponse", parsedApiResponse);
  const isInnerSuccess = apiResponse?.success && parsedApiResponse?.success;

  return (
    <>
      <div className="rounded-2xl bg-muted/10 border-white/10 p-4 sm:p-5 lg:p-6 flex flex-col relative max-w-full overflow-hidden">
        {/* Locked Overlay for Unauthenticated Users */}
        {!hasAccessToken && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="text-center space-y-4 max-w-md mx-auto px-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Join {daoName} to unlock earning
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Locked Overlay for Users without Agent DAO Tokens */}
        {hasAccessToken &&
          hasAgentAccount &&
          !isLoadingBalance &&
          !hasAgentDaoTokens && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center z-10">
              <div className="text-center space-y-4 max-w-md mx-auto px-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Join {daoName} to unlock earning
                  </h3>
                </div>
              </div>
            </div>
          )}
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-2xl font-bold">Earn ${daoName}</h2>
            {/* Tip positioned at top right */}
            <div className="relative group">
              <div className="flex items-center gap-1 text-sm text-zinc-400 cursor-pointer px-3 py-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors">
                💡 <strong>Tips</strong>
              </div>
              {/* Tooltip */}
              <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="text-sm text-zinc-200">
                  Make sure your contribution is clear, specific, and aligned
                  with the DAO's mission. AI agents will vote on this
                  contribution with {name}.
                </div>
                {/* Arrow pointing up */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-zinc-800 border-l border-t border-zinc-700 rotate-45"></div>
              </div>
            </div>
          </div>
          <p className="text-sm">
            Earn{" "}
            <span className="text-primary font-semibold">1000 ${daoName}</span>{" "}
            for contributing work that advances the mission. <br />
            Submit proof below. Agents will vote and grant rewards if approved.{" "}
            <br />
            Submitting contributions requires{" "}
            <span className="text-primary font-semibold">
              250 ${daoName}
            </span>{" "}
            bond.
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-3">
          {hasAccessToken && (
            <div className="bg-secondary/40 rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-300 flex-shrink-0" />
                  <div className="text-sm text-green-100">
                    {senderAirdrops.length > 0 ? (
                      <>
                        You've sent{" "}
                        <span className="font-medium">
                          {senderAirdrops.length}
                        </span>{" "}
                        boost
                        {senderAirdrops.length > 1 ? "s" : ""};{" "}
                        <span className="font-medium">
                          {senderAirdrops.reduce(
                            (total, airdrop) =>
                              total + airdrop.recipients.length,
                            0
                          )}
                        </span>{" "}
                        recipient
                        {senderAirdrops.reduce(
                          (total, airdrop) => total + airdrop.recipients.length,
                          0
                        ) === 1
                          ? ""
                          : "s"}{" "}
                        received.
                      </>
                    ) : (
                      <>
                        <a
                          href="https://faktory.fun/airdrop"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          Send airdrop
                        </a>{" "}
                        to boost your contribution.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                value={contribution}
                onChange={(e) => {
                  setContribution(e.target.value);
                }}
                placeholder={`Describe the work you've done that pushes the ${daoName} mission.`}
                className={`w-full min-h-[107px] p-3 sm:p-4 bg-background/60 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 max-w-full ${!isWithinLimit ? "" : ""}`}
                disabled={
                  isSubmitting ||
                  // isGenerating ||
                  isLoadingExtensions ||
                  isLoadingAgents
                }
              />
              {contribution.length > 0 && (
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  {combinedLength} / 2043 characters
                </div>
              )}
              {!isWithinLimit && (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ Combined text exceeds the 2043-character limit. Please
                  shorten your message or use a shorter Twitter URL.
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={twitterUrl}
                onChange={(e) => {
                  setTwitterUrl(e.target.value);
                }}
                onBlur={() => {
                  const cleaned = cleanTwitterUrl(twitterUrl);
                  if (cleaned) setTwitterUrl(cleaned);
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                placeholder="X.com URL to a post showing proof of your work."
                className={`w-full max-w-full p-3 sm:p-4 ${
                  twitterUrl && isValidTwitterUrl ? "pr-12 sm:pr-16" : ""
                } bg-background/60 border border-white/10 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200`}
                disabled={
                  isSubmitting ||
                  // isGenerating ||
                  isLoadingExtensions ||
                  isLoadingAgents
                }
                required
              />
              {/* Clickable link button inside input */}
              {twitterUrl && isValidTwitterUrl && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      cleanTwitterUrl(twitterUrl),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200 flex items-center justify-center"
                  title="Open Twitter post"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
              {twitterUrl && !isValidTwitterUrl && (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ Please enter a valid X.com (Twitter) post URL in the
                  format: https://x.com/username/status/1234567890123456789
                </div>
              )}

              {/* Hover Preview Tooltip - Desktop Only */}
              {showHoverPreview && twitterEmbedData && (
                <div
                  className="hidden lg:block absolute bottom-full left-0 right-0 z-[9999] mb-2 bg-background/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-2xl pointer-events-auto"
                  onMouseEnter={() => setShowHoverPreview(true)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    {/* <ExternalLink className="h-4 w-4" /> */}
                    <span>Twitter Post Preview</span>
                  </div>
                  <div
                    className="twitter-embed-container [&_iframe]:w-full [&_iframe]:max-w-none [&_iframe]:border-0 [&_iframe]:rounded-lg [&_iframe]:max-h-80 [&_iframe]:overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: twitterEmbedData.html,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Twitter Embed Preview - Mobile Only */}
            {twitterUrl && isValidTwitterUrl && (
              <div className="lg:hidden space-y-2">
                {isLoadingEmbed && (
                  <div className="bg-background/60 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader />
                      <span>Loading preview...</span>
                    </div>
                  </div>
                )}

                {embedError && (
                  <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Preview unavailable: {embedError}</span>
                    </div>
                  </div>
                )}

                {twitterEmbedData && !isLoadingEmbed && (
                  <div className="bg-background/60 border border-white/10 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>Twitter Post Preview</span>
                    </div>
                    <div
                      className="twitter-embed-container [&_iframe]:w-full [&_iframe]:max-w-none [&_iframe]:border-0 [&_iframe]:rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: twitterEmbedData.html,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Airdrop Selector - Always show when authenticated */}
            {hasAccessToken && (
              <div className="space-y-1">
                <Select
                  onValueChange={(value) =>
                    setSelectedAirdropTxHash(value === "none" ? null : value)
                  }
                  value={selectedAirdropTxHash || "none"}
                  disabled={false}
                >
                  <SelectTrigger
                    id="airdrop-select"
                    className="w-full bg-background/60 border border-white/10 h-10"
                  >
                    <SelectValue placeholder="Select a boost to reference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {senderAirdrops.length > 0
                        ? "Attach boost (optional)"
                        : "No boosts available - Create one to attach"}
                    </SelectItem>
                    {senderAirdrops.map((airdrop) => (
                      <SelectItem key={airdrop.tx_hash} value={airdrop.tx_hash}>
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {new Date(airdrop.created_at).toLocaleDateString()}{" "}
                            - {airdrop.recipients.length} recipients
                          </span>
                          <span className="ml-4 text-xs text-muted-foreground font-mono">
                            {truncateString(airdrop.tx_hash, 6, 6)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAirdropTxHash && (
                  <div className="mt-1 flex items-center justify-end">
                    <a
                      href={getExplorerLink("tx", selectedAirdropTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View selected boost on explorer
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Error/Status Messages - Only show when authenticated */}

            {/* X Username Validation Error */}
            {xUsernameError && (
              <div className="text-sm text-red-300 bg-red-900/20 border border-red-800/30 rounded-lg p-3">
                <strong>❌ X Username Mismatch</strong>
                <div className="text-xs text-red-200 mt-1">
                  {xUsernameError}
                </div>
              </div>
            )}

            {/* Agent Account Validation - Only show if we have actually loaded agents data */}
            {hasAccessToken &&
              !isLoadingAgents &&
              agents &&
              !hasAgentAccount && (
                <div className="text-sm text-orange-300 bg-orange-900/20 border border-orange-800/30 rounded-lg p-3">
                  <strong>⏳ Your agent account is being deployed</strong>
                </div>
              )}

            {/* Bitcoin Block Validation */}
            {hasAccessToken &&
              hasAgentAccount &&
              hasAgentDaoTokens &&
              !isCheckingBitcoinBlock &&
              hasProposalInCurrentBlock &&
              currentBitcoinBlock && (
                <div className="text-sm text-yellow-300 bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>⏱️ Bitcoin Block Limit Reached</strong>
                      <div className="text-xs text-yellow-200 mt-1">
                        Only one contribution per Bitcoin block. Please wait
                        until block {currentBitcoinBlock + 1}.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-yellow-200">
                        Current Block
                      </div>
                      <div className="font-bold">
                        {currentBitcoinBlock.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* {hasAccessToken && twitterUrl.trim() && !isValidTwitterUrl && (
              <div className="text-sm text-red-300 bg-red-900/40 border border-red-800 rounded-lg p-3">
                <strong>Invalid Twitter URL:</strong> URL must be in the format
                https://x.com/username/status/1234567890123456789
              </div>
            )} */}

            {isLoadingExtensions && (
              <div className="text-sm text-zinc-400 bg-zinc-900/40 rounded-lg p-3">
                ⏳ Loading DAO extensions...
              </div>
            )}

            {isLoadingAgents && (
              <div className="text-sm text-zinc-400 bg-zinc-900/40 rounded-lg p-3">
                ⏳ Loading user agent...
              </div>
            )}
          </form>
        </div>

        {/* Footer CTA */}
        <div className="pt-4">
          <div>
            <Button
              onClick={handleSubmit}
              disabled={
                !hasAccessToken ||
                !contribution.trim() ||
                !twitterUrl.trim() ||
                !isValidTwitterUrl ||
                !isWithinLimit ||
                isSubmitting ||
                isValidatingXUsername ||
                !hasAgentAccount ||
                // !hasDaoTokens ||
                !hasAgentDaoTokens ||
                isLoadingExtensions ||
                isLoadingAgents ||
                isLoadingBalance ||
                isCheckingBitcoinBlock ||
                hasProposalInCurrentBlock ||
                needsXLink ||
                isXLoading ||
                !!xUsernameError ||
                !canSubmitContribution
              }
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 min-h-[60px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2 text-center px-2">
                  <Loader />
                  <span className="break-words">
                    {submissionButtonText || "Processing..."}
                  </span>
                </div>
              ) : !hasAccessToken ? (
                <span>Connect Wallet to Submit</span>
              ) : needsXLink ? (
                <span>Link X Account to Submit</span>
              ) : verificationStatus.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <Loader />
                  <span>X Verification Pending</span>
                </div>
              ) : //  : verificationStatus.status === "not_verified" ? (
              //   <div className="flex items-center gap-2">
              //     <Lock className="w-4 h-4" />
              //     <span>X Account Not Verified</span>
              //   </div>
              // )
              isValidatingXUsername ? (
                <div className="flex items-center gap-2">
                  <Loader />
                  <span>Validating X Username...</span>
                </div>
              ) : xUsernameError ? (
                <span>Fix X Username to Submit</span>
              ) : !hasAgentAccount ? (
                <span>Waiting for Agent Account</span>
              ) : !hasAgentDaoTokens ? (
                <span>Join DAO to Submit</span>
              ) : isCheckingBitcoinBlock ? (
                <div className="flex items-center gap-2 text-center px-2">
                  <Loader />
                  <span className="break-words">Checking Bitcoin Block...</span>
                </div>
              ) : hasProposalInCurrentBlock && currentBitcoinBlock ? (
                <span>
                  Wait for Block {(currentBitcoinBlock + 1).toLocaleString()}
                </span>
              ) : (
                <div className="flex items-center gap-3">
                  <Send className="h-4 w-4" />
                  <span>Submit Contribution</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* X Account Lock Overlay */}
        {hasAccessToken && hasAgentDaoTokens && needsXLink && !isXLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]  flex flex-col items-center justify-center z-10">
            <div className="text-center space-y-4 max-w-md mx-auto px-6">
              <div>
                <XLinking
                  compact={false}
                  showTitle={false}
                  onLinkingComplete={() => {
                    refreshStatus();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* X Verification Lock Overlay */}
        {hasAccessToken &&
          hasAgentDaoTokens &&
          !needsXLink &&
          !isXLoading &&
          verificationStatus.status === "not_verified" && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
              <div className="text-center space-y-4 max-w-md mx-auto px-6">
                <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-800/30 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-300 mb-2">
                    X Account Not Verified
                  </h3>
                  <p className="text-sm text-red-200/80 leading-relaxed">
                    AIBTC is not for everyone.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* X Verification Pending Lock Overlay */}
        {hasAccessToken &&
          hasAgentDaoTokens &&
          !needsXLink &&
          !isXLoading &&
          verificationStatus.status === "pending" && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
              <div className="text-center space-y-4 max-w-md mx-auto px-6">
                <div className="w-16 h-16 rounded-full bg-yellow-900/20 border border-yellow-800/30 flex items-center justify-center mx-auto">
                  <Loader />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-2">
                    X Verification Pending
                  </h3>
                  <p className="text-sm text-yellow-200/80 leading-relaxed">
                    Your X account verification is being processed.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* ----------------------------- Result modal ----------------------------- */}
      <Dialog
        open={showResultDialog}
        onOpenChange={(open) => {
          setShowResultDialog(open);
          if (!open) setTxStatusView("initial");
        }}
      >
        <DialogContent className="p-6 sm:max-w-2xl">
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
                            Contribution Submitted
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            Your contribution is being processed on the
                            blockchain. This may take a few minutes.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          {parsed?.data?.txid && (
                            <div className="bg-background/60 rounded-xl p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Transaction Status
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  Processing
                                </span>
                              </div>
                            </div>
                          )}
                          <hr className="my-4 border-border/50" />
                          <div className="flex justify-end gap-3 mt-6">
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
                            Contribution Confirmed
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            Your contribution has been successfully submitted to
                            the DAO and is now live for voting.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          <div className="bg-background/60 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">
                                Transaction Status
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
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

                          <hr className="my-4 border-border/50" />
                          <div className="flex justify-end gap-3 mt-6">
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
                            Contribution Failed
                          </DialogTitle>
                          <DialogDescription className="text-base text-muted-foreground">
                            {(() => {
                              const errorCode = extractErrorCode(
                                websocketMessage?.tx_result
                              );
                              if (requiresContractApproval(errorCode)) {
                                return "Contract approval is required before you can submit contributions.";
                              }
                              return "The contribution transaction could not be completed. Please try again.";
                            })()}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                          <div className="bg-background/60 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm text-muted-foreground">
                                Transaction Status
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                                Failed
                              </span>
                            </div>
                            {websocketMessage?.tx_result && (
                              <div className="text-sm">
                                {(() => {
                                  const errorCode = extractErrorCode(
                                    websocketMessage.tx_result
                                  );
                                  let description = "Transaction failed";

                                  if (errorCode && errorCodeMap[errorCode]) {
                                    description =
                                      errorCodeMap[errorCode].description;
                                  }

                                  return (
                                    <>
                                      <span className="text-muted-foreground">
                                        Reason:{" "}
                                      </span>
                                      <span className="font-medium">
                                        {description}
                                      </span>
                                      {errorCode && (
                                        <span className="text-muted-foreground ml-2">
                                          (Error {errorCode})
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          <hr className="my-4 border-border/50" />
                          <div className="flex justify-end gap-3 mt-6">
                            {(() => {
                              const errorCode = extractErrorCode(
                                websocketMessage?.tx_result
                              );
                              const needsApproval =
                                requiresContractApproval(errorCode);

                              if (needsApproval) {
                                return (
                                  <Button
                                    variant="outline"
                                    onClick={handleApproveContract}
                                    disabled={isApproving}
                                  >
                                    {isApproving
                                      ? "Approving..."
                                      : "Approve Contract & Retry"}
                                  </Button>
                                );
                              }
                              return null;
                            })()}

                            {/* Only show Try Again if it's not a u1101 error */}
                            {!requiresContractApproval(
                              extractErrorCode(websocketMessage?.tx_result)
                            ) && (
                              <Button variant="outline" onClick={handleRetry}>
                                Try Again
                              </Button>
                            )}

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
                  There was an error processing sending your contribution.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-4">
                {parsedApiResponse?.message ? (
                  <div className="bg-background/60 rounded-xl p-4 shadow-sm">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Error: </span>
                      <span className="font-medium">
                        {parsedApiResponse.data?.reason === "NotEnoughFunds"
                          ? "Not enough DAO tokens in agent account. Transaction failed to broadcast."
                          : parsedApiResponse.message}
                      </span>
                    </div>
                  </div>
                ) : (
                  apiResponse?.error && (
                    <div className="bg-background/60 rounded-xl p-4 shadow-sm">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Error: </span>
                        <span className="font-medium">{apiResponse.error}</span>
                      </div>
                    </div>
                  )
                )}

                <hr className="my-4 border-border/50" />
                <div className="flex justify-end gap-3 mt-6">
                  {(() => {
                    // Insert approve button logic as sibling to actions in network error case
                    const needsApproval =
                      hasAccessToken &&
                      agents &&
                      daoExtensions &&
                      (parsedApiResponse?.data?.reason ===
                        "The specified asset is not recognized or supported." ||
                        parsedApiResponse?.message?.includes("1101"));

                    if (needsApproval) {
                      return (
                        <Button
                          variant="outline"
                          onClick={handleApproveContract}
                          disabled={isApproving}
                        >
                          {isApproving
                            ? "Approving..."
                            : "Approve Contract & Retry"}
                        </Button>
                      );
                    }
                    return null;
                  })()}

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

      {/* Contract Approval Status Modal */}
      <TransactionStatusModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          if (approvalTransactionStatus === "success") {
            // After successful approval, retry the original submission
            handleRetry();
          }
        }}
        txId={approvalTxId || undefined}
        transactionStatus={approvalTransactionStatus}
        transactionMessage={approvalTransactionMessage}
        title="Contract Approval Status"
        successTitle="Approval Confirmed"
        failureTitle="Approval Failed"
        successDescription="The contract has been successfully approved for voting operations. You can now retry your submission."
        failureDescription="The contract approval could not be completed. Please try again."
        pendingDescription="The contract approval is being processed on the blockchain. This may take a few minutes."
        onRetry={() => {
          setShowApprovalModal(false);
          resetApprovalVerification();
          setApprovalTxId(null);
          handleApproveContract();
        }}
        showRetryButton={true}
      />
    </>
  );
}
