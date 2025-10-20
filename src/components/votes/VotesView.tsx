"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ThumbsUp,
  ThumbsDown,
  Vote,
  // Search,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  XCircle,
  ExternalLink,
  X,
  Eye,
  ChevronDown,
  // Shield,
  // Link as LinkIcon,
  // Image,
  // MessageSquare,
  Edit3,
  // Settings,
  // Edit3,
} from "lucide-react";

interface EvaluationData {
  flags: string[];
  summary: string;
  decision: boolean;
  categories: Array<{
    score: number;
    weight: number;
    category: string;
    reasoning: string[];
  }>;
  explanation: string;
  final_score: number;
  token_usage?: string;
  images_processed?: number;
}

import { Badge } from "@/components/ui/badge";
import { AI_MODELS } from "@/lib/constant";
import { Button } from "@/components/ui/button";
import type { Vote as VoteType, Proposal } from "@/types";
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { useAuth } from "@/hooks/useAuth";
import { getProposalStatus } from "@/utils/proposal";
import { useProposalStatus } from "@/hooks/useProposalStatus";

// Helper function to convert Vote to Proposal-like object for useProposalStatus hook
const voteToProposal = (vote: VoteType): Proposal => ({
  id: vote.proposal_id,
  proposal_id: vote.blockchain_proposal_id || BigInt(0),
  title: vote.proposal_title,
  content: vote.proposal_content || "",
  status: vote.proposal_status || "PENDING",
  passed: vote.proposal_passed ?? false,
  vote_start: vote.vote_start || BigInt(0),
  vote_end: vote.vote_end || BigInt(0),
  exec_start: vote.exec_start || BigInt(0),
  exec_end: vote.exec_end || BigInt(0),
  created_at: vote.created_at,
  dao_id: vote.dao_id,
  evaluation_score: vote.evaluation_score || {},
  flags: vote.flags || [],
  // Required fields from Proposal interface with default values
  summary: vote.proposal_content || "",
  contract_principal: "",
  tx_id: vote.tx_id || "",
  action: "",
  caller: "",
  creator: "",
  liquid_tokens: "0",
  concluded_by: "",
  executed: false,
  met_quorum: false,
  met_threshold: false,
  votes_against: "0",
  votes_for: "0",
  bond: "0",
  type: "",
  contract_caller: "",
  created_btc: BigInt(0),
  created_stx: BigInt(0),
  memo: "",
  tx_sender: "",
  voting_delay: BigInt(0),
  voting_period: BigInt(0),
  voting_quorum: BigInt(0),
  voting_reward: "0",
  voting_threshold: BigInt(0),
});

const enableSingleDaoMode = true;
const singleDaoName = "AIBTC";

import {
  fetchActiveAgentPromptByDaoAndAgent,
  updateAgentPrompt,
  createAgentPrompt,
} from "@/services/agent-prompt.service";
import {
  fetchDAOsWithExtension,
  fetchDAOs,
  fetchToken,
} from "@/services/dao.service";
import type { AgentPrompt, DAO } from "@/types";
import { getProposalVotes } from "@/lib/vote-utils";
import { EvaluationModal } from "./EvaluationModal";
import { checkAgentVetoStatus } from "@/services/veto.service";
import { useProposalHasVetos } from "@/hooks/useVetos";

// Utility function to format vote balances
function formatBalance(value: string | number, decimals: number = 8) {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";

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

// Helper function to mask addresses
const maskAddress = (addr?: string | null) => {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
};

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  currentBitcoinHeight: number;
}

type TabType = "pending" | "active" | "veto" | "passed" | "failed" | "all";

interface EditingPromptData {
  prompt_text: string;
  model: string;
  temperature: number;
}

interface VetoEntry {
  address: string | null;
  amount: string;
  tx_id: string | null;
}

// Helper function to format time in a compact way
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

// Helper function to safely convert bigint to number for comparison
// const safeNumberFromBigInt = (value: bigint | null): number => {
//   if (value === null) return 0;
//   if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
//     return Number.MAX_SAFE_INTEGER;
//   }
//   return Number(value);
// };

function VoteCard({ vote }: VoteCardProps) {
  // const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editingData, setEditingData] = useState<EditingPromptData>({
    prompt_text: "",
    model: "openai/gpt-5",
    temperature: 0.1,
  });
  const [currentAgentPrompt, setCurrentAgentPrompt] =
    useState<AgentPrompt | null>(null);
  const [daoManagerAgentId, setDaoManagerAgentId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Convert vote to proposal-like structure and use the same status logic as ProposalCard
  const proposalLike = useMemo(() => voteToProposal(vote), [vote]);
  const { status: proposalStatus, statusConfig } =
    useProposalStatus(proposalLike);

  // Fetch agents to get the DAO manager agent ID
  const { userId, isAuthenticated } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: isAuthenticated && !!userId,
  });

  // Get agent account address for veto checking
  const agentAccountAddress = useMemo(() => {
    if (!agents.length) return null;
    const agent = agents[0];
    return agent.account_contract || null;
  }, [agents]);

  // Check if current user (agent) has already vetoed this proposal
  const { data: existingVeto } = useQuery({
    queryKey: ["agentVeto", vote.proposal_id, agentAccountAddress],
    queryFn: () => {
      if (!vote.proposal_id || !agentAccountAddress) return null;
      return checkAgentVetoStatus(vote.proposal_id, agentAccountAddress);
    },
    enabled: !!vote.proposal_id && !!agentAccountAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all vetos for this proposal
  const {
    hasVetos,
    vetoCount,
    vetos: allVetos,
  } = useProposalHasVetos(vote.proposal_id || "");

  // Set DAO manager agent ID
  useEffect(() => {
    if (agents.length > 0) {
      setDaoManagerAgentId(agents[0].id);
    }
  }, [agents]);

  // Fetch current agent prompt for this DAO
  const { data: agentPrompt } = useQuery({
    queryKey: [
      "agentPrompts",
      "active",
      "dao",
      vote.dao_id,
      "agent",
      daoManagerAgentId,
    ],
    queryFn: () =>
      fetchActiveAgentPromptByDaoAndAgent(vote.dao_id, daoManagerAgentId),
    enabled: !!vote.dao_id && !!daoManagerAgentId,
  });

  useEffect(() => {
    if (agentPrompt) {
      setCurrentAgentPrompt(agentPrompt);
      setEditingData({
        prompt_text: agentPrompt.prompt_text,
        model: agentPrompt.model,
        temperature: agentPrompt.temperature,
      });
      setIsCreating(false);
    } else if (daoManagerAgentId && vote.dao_id) {
      // No prompt exists, prepare for creation
      setIsCreating(true);
      setCurrentAgentPrompt(null);
    }
  }, [agentPrompt, daoManagerAgentId, vote.dao_id]);

  // Create agent prompt mutation
  const createPromptMutation = useMutation({
    mutationFn: (
      data: Omit<AgentPrompt, "id" | "created_at" | "updated_at">
    ) => {
      return createAgentPrompt(data);
    },
    onSuccess: (newPrompt) => {
      toast({
        title: "Success",
        description: "Agent instructions created successfully",
      });
      setCurrentAgentPrompt(newPrompt);
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["agentPrompts"] });
      setIsEditingInstructions(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create agent instructions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update agent prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: (data: Partial<AgentPrompt>) => {
      if (!currentAgentPrompt?.id) {
        throw new Error("No agent prompt found to update");
      }
      return updateAgentPrompt(currentAgentPrompt.id, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent instructions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["agentPrompts"] });
      setIsEditingInstructions(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update agent instructions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveInstructions = () => {
    if (isCreating || !currentAgentPrompt) {
      // Create new prompt
      const newPromptData = {
        dao_id: vote.dao_id,
        agent_id: daoManagerAgentId,
        profile_id: vote.profile_id || "",
        prompt_text: editingData.prompt_text,
        model: editingData.model,
        temperature: 0.1, // Default temperature
        is_active: true,
      };
      createPromptMutation.mutate(newPromptData);
    } else {
      // Update existing prompt
      updatePromptMutation.mutate({
        ...editingData,
        temperature: 0.1, // Default temperature
      });
    }
  };

  const handleCancelInstructions = () => {
    if (currentAgentPrompt) {
      setEditingData({
        prompt_text: currentAgentPrompt.prompt_text,
        model: currentAgentPrompt.model,
        temperature: currentAgentPrompt.temperature,
      });
    }
    setIsEditingInstructions(false);
  };

  const getContributionStatusBadge = () => {
    const StatusIcon = statusConfig.icon;
    return (
      <Badge
        variant={statusConfig.variant}
        className={`${statusConfig.bg} ${statusConfig.color}`}
      >
        <StatusIcon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const renderAgentVoteBadge = () => {
    return (
      <Badge
        className={`text-xs px-2 py-1 ${
          vote.answer ? "text-white " : " text-white bg-muted"
        }`}
      >
        <div className="flex items-center gap-1">
          {vote.answer ? (
            <>
              <ThumbsUp className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">Yes</span>
            </>
          ) : (
            <>
              <ThumbsDown className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">No</span>
            </>
          )}
        </div>
      </Badge>
    );
  };

  const getAgentVotingBadge = () => {
    // For pending contributions, don't show voting status
    if (proposalStatus === "PENDING") {
      return null;
    }

    // If contribution is in active voting, show voting state
    if (proposalStatus === "ACTIVE") {
      if (vote.voted === false) {
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">Pending</span>
            </div>
          </Badge>
        );
      } else {
        return renderAgentVoteBadge();
      }
    }

    // For other statuses (VETO_PERIOD, EXECUTION_WINDOW, PASSED, FAILED), show final vote if available
    if (vote.voted === true) {
      return renderAgentVoteBadge();
    }

    return (
      <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs px-2 py-1">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="font-medium">No Vote</span>
        </div>
      </Badge>
    );
  };

  // Parse contribution content and reference
  const parseContributionContent = () => {
    if (!vote.proposal_content) return { content: "", reference: null };

    const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
    const match = vote.proposal_content.match(referenceRegex);
    const referenceLink = match?.[1];
    const cleanedContent = vote.proposal_content
      .replace(referenceRegex, "")
      .trim();

    return { content: cleanedContent, reference: referenceLink };
  };

  const {
    // content,
    // reference,
  } = parseContributionContent();

  // Parse evaluation data and extract summary
  const parseEvaluation = (evaluation: string | object) => {
    try {
      // If it's already an object, return it directly
      if (typeof evaluation === "object") {
        return evaluation as EvaluationData;
      }
      // If it's a string, try to parse it as JSON
      if (
        typeof evaluation === "string" &&
        evaluation.trim().startsWith("{") &&
        evaluation.trim().endsWith("}")
      ) {
        return JSON.parse(evaluation);
      }
      return null;
    } catch {
      return null;
    }
  };

  const evaluationData = vote.evaluation
    ? parseEvaluation(vote.evaluation)
    : null;
  const reasoningPreview =
    evaluationData?.summary ||
    (typeof vote.evaluation === "string"
      ? vote.evaluation.split(".")[0] + "."
      : null) ||
    null;

  // Debug logging
  // console.log("VoteCard - Vote evaluation:", vote.evaluation);
  // console.log("VoteCard - Parsed evaluation data:", evaluationData);

  // Try both DAO fetching methods to find the correct one
  const { data: daosWithExtensions } = useQuery({
    queryKey: ["daosWithExtensions"],
    queryFn: fetchDAOsWithExtension,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: daosBasic } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Use whichever DAO list contains our target DAO
  const daos = useMemo(() => {
    const foundInExtensions = daosWithExtensions?.find(
      (dao: DAO) => dao.id === vote.dao_id
    );
    const foundInBasic = daosBasic?.find((dao: DAO) => dao.id === vote.dao_id);

    if (foundInExtensions) {
      return daosWithExtensions;
    } else if (foundInBasic) {
      return daosBasic;
    }

    return daosWithExtensions || daosBasic;
  }, [daosWithExtensions, daosBasic, vote.dao_id]);

  // Find the DAO and get the voting extension contract principal
  const daoData = useMemo(() => {
    return daos?.find((dao: DAO) => dao.id === vote.dao_id);
  }, [daos, vote.dao_id]);

  // Fetch token data for the DAO to get image_url
  const { data: tokenData } = useQuery({
    queryKey: ["token", vote.dao_id],
    queryFn: () => fetchToken(vote.dao_id),
    enabled: !!vote.dao_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const votingContractPrincipal = useMemo(() => {
    if (!daoData?.extensions) {
      return null;
    }

    const votingExtension = daoData.extensions.find(
      (ext: { type: string; subtype?: string; contract_principal?: string }) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    return votingExtension?.contract_principal || null;
  }, [daoData]);

  // Fetch real vote data for this proposal
  const {
    data: voteData,
    // isLoading: isLoadingVoteData,
    // error: voteDataError,
  } = useQuery({
    queryKey: [
      "proposalVotes",
      votingContractPrincipal,
      vote.blockchain_proposal_id,
      proposalStatus === "ACTIVE" ? "bustCache" : "cached", // Add cache busting key for active proposals
    ],
    queryFn: () => {
      if (!vote.blockchain_proposal_id) {
        return null;
      }
      const proposalIdNum = Number(vote.blockchain_proposal_id);
      // Bust cache if proposal is in active voting to get real-time vote counts
      const shouldBustCache = proposalStatus === "ACTIVE";
      return getProposalVotes(
        votingContractPrincipal!,
        proposalIdNum,
        shouldBustCache
      );
    },
    enabled: !!votingContractPrincipal && !!vote.blockchain_proposal_id,
    staleTime: proposalStatus === "ACTIVE" ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds for active, 5 minutes for others
    refetchInterval: proposalStatus === "ACTIVE" ? 30 * 1000 : undefined, // Auto-refetch every 30 seconds for active proposals
  });

  // Extract and format vote data
  const voteDisplayData = useMemo(() => {
    if (!voteData) return null;

    const rawFor = voteData.votesFor || voteData.data?.votesFor;
    const rawAgainst = voteData.votesAgainst || voteData.data?.votesAgainst;
    const rawLiquidTokens =
      voteData.liquidTokens || voteData.data?.liquidTokens;

    if (!rawFor || !rawAgainst || !rawLiquidTokens) return null;

    return {
      votesFor: formatBalance(rawFor),
      votesAgainst: formatBalance(rawAgainst),
      liquidTokens: formatBalance(rawLiquidTokens),
      rawVotesFor: rawFor,
      rawVotesAgainst: rawAgainst,
      rawLiquidTokens: rawLiquidTokens,
    };
  }, [voteData]);

  // Normalize vetoes - use all vetos from the hook, plus agent's veto if it exists
  const vetoes = useMemo<VetoEntry[]>(() => {
    const vetoList: VetoEntry[] = [];

    // Add all vetos from the database
    if (allVetos && Array.isArray(allVetos)) {
      allVetos.forEach((veto) => {
        vetoList.push({
          address: veto.address || null,
          amount: veto.amount || "0",
          tx_id: veto.tx_id || null,
        });
      });
    }

    // If agent has vetoed but it's not in the allVetos list, add it
    if (existingVeto && agentAccountAddress) {
      const agentVetoExists = vetoList.some(
        (v) => v.address === agentAccountAddress
      );
      if (!agentVetoExists) {
        vetoList.push({
          address: agentAccountAddress,
          amount: existingVeto.amount || "0",
          tx_id: existingVeto.tx_id || null,
        });
      }
    }

    return vetoList;
  }, [allVetos, existingVeto, agentAccountAddress]);

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px]">
          {/* Main Content */}
          <div className="p-6 space-y-4">
            {/* Contribution Header */}
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={tokenData?.image_url} alt={vote.dao_name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {vote.dao_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/aidaos/${encodeURIComponent(vote.dao_name)}`}>
                    <span className="font-bold hover:text-primary cursor-pointer transition-colors flex items-center gap-1">
                      {vote.dao_name}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                  <Link href={`/proposals/${vote.proposal_id}`}>
                    <span className="text-base font-semibold text-foreground hover:text-primary cursor-pointer transition-colors flex items-center gap-1">
                      Contribution #
                      {vote.blockchain_proposal_id || vote.proposal_id}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </Link>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getContributionStatusBadge()}

                  <span className="text-sm text-muted-foreground">
                    Submitted: {formatRelativeTime(vote.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-foreground leading-tight">
              {vote.proposal_title}
            </h3>

            {/* Reference Links - Extract from content and display below title */}
            {(() => {
              if (!vote.proposal_content) return null;

              const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
              const airdropReferenceRegex =
                /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i;
              const referenceMatch =
                vote.proposal_content.match(referenceRegex);
              const airdropMatch = vote.proposal_content.match(
                airdropReferenceRegex
              );
              const referenceLink = referenceMatch?.[1];
              const airdropTxId = airdropMatch?.[1];

              if (!referenceLink && !airdropTxId) return null;

              return (
                <div className="space-y-3 mb-4">
                  {referenceLink && (
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">
                        Reference
                      </div>
                      <span
                        role="link"
                        className="text-sm text-primary hover:text-primary/80 transition-colors break-all cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            referenceLink,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        <svg
                          className="h-4 w-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span className="inline-block max-w-full break-all">
                          {referenceLink}
                        </span>
                      </span>
                    </div>
                  )}
                  {airdropTxId && (
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">
                        Airdrop Transaction ID
                      </div>
                      <span
                        role="link"
                        className="text-sm text-primary hover:text-primary/80 transition-colors break-all cursor-pointer flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `https://explorer.hiro.so/txid/${airdropTxId}?chain=${process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet"}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                      >
                        <svg
                          className="h-4 w-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        <span className="inline-block max-w-full break-all">
                          {airdropTxId}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Vote Counts - Hide when status is pending */}
            {proposalStatus !== "PENDING" && (
              <div className="space-y-2">
                {/* Progress Bar - Hide when status is pending */}
                {voteDisplayData && (
                  <div className="space-y-2">
                    <div className="relative">
                      {/* Background bar */}
                      <div className="h-6 bg-muted rounded-lg overflow-hidden">
                        {/* Votes for (green) */}
                        <div
                          className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                            voteDisplayData.rawVotesFor &&
                            Number(voteDisplayData.rawVotesFor) > 0
                              ? "rounded-l-lg"
                              : ""
                          } ${
                            (!voteDisplayData.rawVotesAgainst ||
                              Number(voteDisplayData.rawVotesAgainst) === 0) &&
                            voteDisplayData.rawVotesFor &&
                            Number(voteDisplayData.rawVotesFor) > 0
                              ? "rounded-r-lg"
                              : ""
                          }`}
                          style={{
                            width: `${Math.min(
                              voteDisplayData.rawLiquidTokens
                                ? Math.round(
                                    (Number(voteDisplayData.rawVotesFor) /
                                      Number(voteDisplayData.rawLiquidTokens)) *
                                      100
                                  )
                                : 0,
                              100
                            )}%`,
                          }}
                        />
                        {/* Votes against (red) */}
                        <div
                          className={`absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out ${
                            voteDisplayData.rawVotesAgainst &&
                            Number(voteDisplayData.rawVotesAgainst) > 0 &&
                            (!voteDisplayData.rawVotesFor ||
                              Number(voteDisplayData.rawVotesFor) === 0)
                              ? "rounded-l-lg"
                              : ""
                          } ${
                            voteDisplayData.rawVotesAgainst &&
                            Number(voteDisplayData.rawVotesAgainst) > 0
                              ? "rounded-r-lg"
                              : ""
                          }`}
                          style={{
                            width: `${Math.min(
                              voteDisplayData.rawLiquidTokens
                                ? Math.round(
                                    (Number(voteDisplayData.rawVotesAgainst) /
                                      Number(voteDisplayData.rawLiquidTokens)) *
                                      100
                                  )
                                : 0,
                              100
                            )}%`,
                            left: `${Math.min(
                              voteDisplayData.rawLiquidTokens
                                ? Math.round(
                                    (Number(voteDisplayData.rawVotesFor) /
                                      Number(voteDisplayData.rawLiquidTokens)) *
                                      100
                                  )
                                : 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Vote breakdown */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>For: {voteDisplayData.votesFor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span>Against: {voteDisplayData.votesAgainst}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span>Total: {voteDisplayData.liquidTokens}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show veto button only if current user hasn't vetoed yet */}
            {proposalStatus === "VETO_PERIOD" && !existingVeto && (
              <DAOVetoProposal
                daoId={vote.dao_id}
                proposalId={vote.proposal_id}
                size="sm"
                variant="destructive"
              />
            )}
            {/* Agent Evaluation Summary */}
            {(evaluationData || reasoningPreview) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    <span className="hidden sm:inline">Agent Evaluation</span>
                    <span className="sm:hidden">Expand Evaluation</span>
                    {getAgentVotingBadge()}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/proposals/${vote.proposal_id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Contribution
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEvaluationModalOpen(true)}
                      className="text-xs h-6 px-2"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Expand
                    </Button>
                  </div>
                </div>

                {evaluationData ? (
                  <div className="space-y-3">
                    {/* Decision and Score */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {evaluationData.summary}
                      </p>
                    </div>

                    {/* Flags (compact) */}
                    {evaluationData.flags &&
                      evaluationData.flags.length > 0 && (
                        <div className="space-y-1">
                          <h6 className="text-xs font-medium text-muted-foreground">
                            Flags ({evaluationData.flags.length})
                          </h6>
                          {evaluationData.flags
                            .slice(0, 1)
                            .map((flag: string, index: number) => (
                              <div
                                key={index}
                                className="bg-muted/30 text-muted-foreground rounded p-2"
                              >
                                <p className="text-xs text-muted-foreground">
                                  {flag}
                                </p>
                              </div>
                            ))}
                          {evaluationData.flags.length > 1 && (
                            <p className="text-xs text-muted-foreground">
                              +{evaluationData.flags.length - 1} more
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {reasoningPreview}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Inline Veto Button or Vetoed Status */}
            {vote.dao_id &&
              vote.proposal_id &&
              (hasVetos || proposalStatus === "VETO_PERIOD") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Veto Status
                    </span>
                    <Badge
                      variant={hasVetos ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {hasVetos
                        ? `${vetoCount} Veto${vetoCount !== 1 ? "s" : ""}`
                        : "No Vetos"}
                    </Badge>
                  </div>

                  {vetoes.length > 0 && (
                    <div className="space-y-2">
                      {vetoes.slice(0, 3).map((veto, index) => (
                        <div
                          key={index}
                          className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-destructive">
                              Vetoed {formatBalance(veto.amount)}{" "}
                              {vote.dao_name} by {maskAddress(veto.address)}
                            </span>
                            {veto.tx_id && (
                              <a
                                href={`https://explorer.hiro.so/txid/${veto.tx_id}?chain=${process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet"}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 ml-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Transaction
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {vetoes.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{vetoes.length - 3} more vetos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Right Sidebar - Training Feedback */}
          <div className="border-l border-border/50 p-6 bg-muted/20 space-y-6">
            {/* Training Feedback Section */}
            <div className="space-y-3">
              <h5 className="text-lg font-semibold text-foreground">
                Training Feedback
              </h5>
              <p className="text-base text-muted-foreground mt-2 mb-3">
                Are you satisfied with the agent's vote in this contribution for{" "}
                {vote.dao_name}?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-sm h-8">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button size="sm" variant="outline" className="text-sm h-8">
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            </div>

            {/* Agent Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {/* <Settings className="h-5 w-5 text-muted-foreground" /> */}
                <span className="text-lg font-semibold">
                  Your Instructions to Agent for {vote.dao_name}
                </span>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={editingData.prompt_text}
                  onChange={(e) =>
                    setEditingData({
                      ...editingData,
                      prompt_text: e.target.value,
                    })
                  }
                  placeholder={
                    currentAgentPrompt?.prompt_text ||
                    (isCreating
                      ? "Enter instructions for your agent..."
                      : "No instructions configured. Click Edit to add.")
                  }
                  className="min-h-[100px] resize-none text-base"
                  readOnly={!isEditingInstructions}
                  autoFocus={isEditingInstructions}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Select
                      value={editingData.model}
                      onValueChange={(value) =>
                        setEditingData({ ...editingData, model: value })
                      }
                      disabled={!isEditingInstructions}
                    >
                      <SelectTrigger className="h-10 text-base w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    {isEditingInstructions ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelInstructions}
                          disabled={
                            updatePromptMutation.isPending ||
                            createPromptMutation.isPending
                          }
                          className="h-10 px-4 text-base"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveInstructions}
                          disabled={
                            updatePromptMutation.isPending ||
                            createPromptMutation.isPending
                          }
                          className="h-10 px-4 text-base"
                        >
                          {updatePromptMutation.isPending ||
                          createPromptMutation.isPending
                            ? isCreating
                              ? "Creating..."
                              : "Saving..."
                            : isCreating
                              ? "Create"
                              : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingInstructions(true)}
                        className="h-8 px-4 text-sm"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Evaluation Modal */}
      <EvaluationModal
        isOpen={isEvaluationModalOpen}
        onClose={() => setIsEvaluationModalOpen(false)}
        evaluation={vote.evaluation}
        proposalTitle={vote.proposal_title}
      />
    </Card>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedDao, setSelectedDao] = useState<string | null>(null);
  // const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch current Bitcoin block height
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const currentBitcoinHeight = chainState?.bitcoin_block_height
    ? Number.parseInt(chainState.bitcoin_block_height)
    : 0;

  const getTabCount = useCallback(
    (tab: TabType): number => {
      switch (tab) {
        case "pending":
          // Count contributions that are pending
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "PENDING";
          }).length;
        case "active":
          // Count contributions in active voting status
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "ACTIVE";
          }).length;
        case "veto":
          // Count contributions in veto period
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "VETO_PERIOD";
          }).length;
        case "passed":
          // Count contributions that have passed
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "PASSED";
          }).length;
        case "failed":
          // Count contributions that have failed
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "FAILED";
          }).length;
        case "all":
        default:
          return votes.length;
      }
    },
    [votes, currentBitcoinHeight]
  );

  // Determine default tab based on available votes - prioritize actionable items
  const getDefaultTab = useCallback((): TabType => {
    // First priority: Items requiring immediate action
    if (getTabCount("veto") > 0) return "veto";
    if (getTabCount("pending") > 0) return "pending";
    if (getTabCount("active") > 0) return "active";

    // Second priority: Recent outcomes
    if (getTabCount("passed") > 0) return "passed";
    if (getTabCount("failed") > 0) return "failed";

    // Fallback: Show all if any votes exist, otherwise pending
    return votes.length > 0 ? "all" : "pending";
  }, [getTabCount, votes.length]);

  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize activeTab only once when data is first loaded
  useEffect(() => {
    if (!hasInitialized && votes.length > 0 && currentBitcoinHeight > 0) {
      const defaultTab = getDefaultTab();
      setActiveTab(defaultTab);
      setHasInitialized(true);
    }
  }, [getDefaultTab, votes.length, currentBitcoinHeight, hasInitialized]);

  // Reset pagination when tab changes
  useEffect(() => {
    setVisibleCount(10);
  }, [activeTab]);

  // Filter votes based on tab and DAO filter using the same logic as useProposalStatus
  const filteredVotes = useMemo(() => {
    // Don't filter until activeTab is initialized
    if (activeTab === null) return [];

    const byTab = (() => {
      switch (activeTab) {
        case "pending":
          // Show contributions that are pending using getProposalStatus logic
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            // console.log('Vote:', vote.proposal_title, 'Status:', status, 'DB Status:', vote.proposal_status, 'Vote Start:', vote.vote_start);
            return status === "PENDING";
          });
        case "active":
          // Show contributions in active voting status
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "ACTIVE";
          });
        case "veto":
          // Show contributions in veto period
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "VETO_PERIOD";
          });
        case "passed":
          // Show contributions that have passed
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "PASSED";
          });
        case "failed":
          // Show contributions that have failed
          return votes.filter((vote) => {
            const proposalLike = voteToProposal(vote);
            const status = getProposalStatus(
              proposalLike,
              currentBitcoinHeight
            );
            return status === "FAILED";
          });
        case "all":
        default:
          return votes;
      }
    })();

    let filteredByDao = byTab;
    if (enableSingleDaoMode) {
      filteredByDao = filteredByDao.filter((vote) => vote.dao_name === singleDaoName);
    }

    return selectedDao
      ? filteredByDao.filter((vote) => vote.dao_name === selectedDao)
      : filteredByDao;
  }, [votes, activeTab, currentBitcoinHeight, selectedDao]);

  const paginatedVotes = filteredVotes.slice(0, visibleCount);

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case "pending":
        return "Pending Contributions";
      case "active":
        return "Active Voting";
      case "veto":
        return "Veto Period";
      case "passed":
        return "Passed Contributions";
      case "failed":
        return "Failed Contributions";
      case "all":
      default:
        return "All Contributions";
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "pending":
        return Clock;
      case "active":
        return Vote;
      case "veto":
        return Ban;
      case "passed":
        return CheckCircle;
      case "failed":
        return XCircle;
      case "all":
      default:
        return FileText;
    }
  };

  const tabs: TabType[] = [
    "pending",
    "active",
    "veto",
    "passed",
    "failed",
    "all",
  ];

  // Get unique DAO names
  const uniqueDaoNames = useMemo(() => {
    const daoNamesSet = new Set(votes.map((v) => v.dao_name));
    return Array.from(daoNamesSet);
  }, [votes]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Your Agent&apos;s Votes Across All DAOs
          </h1>
          <p className="text-muted-foreground">
            {filteredVotes.length}{" "}
            {filteredVotes.length === 1 ? "contribution" : "contributions"}
            {selectedDao && ` from ${selectedDao}`}
          </p>
        </div>

        {/* Compact Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {activeTab ? getTabTitle(activeTab) : "Loading..."}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {tabs.map((tab) => {
                  const Icon = getTabIcon(tab);
                  const tabCount = getTabCount(tab);
                  // const hasActionableItems =
                  //   (tab === "veto" || tab === "voting") && tabCount > 0;

                  if (tab === "all" && votes.length === 0) return null;

                  return (
                    <DropdownMenuItem
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 ${
                        activeTab === tab ? "bg-accent" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{getTabTitle(tab)}</span>
                      {tabCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="h-5 text-xs ml-auto"
                        >
                          {tabCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* DAO Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">DAO:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {selectedDao || "All DAOs"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => setSelectedDao(null)}
                  className={`flex items-center gap-2 ${
                    selectedDao === null ? "bg-accent" : ""
                  }`}
                >
                  <div
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setActiveTab("all" as TabType)}
                  />
                  <span className="flex-1">All DAOs</span>
                  <Badge variant="secondary" className="h-5 text-xs ml-auto">
                    {votes.length}
                  </Badge>
                </DropdownMenuItem>
                {uniqueDaoNames.map((daoName) => {
                  const daoVoteCount = votes.filter(
                    (vote) => vote.dao_name === daoName
                  ).length;
                  const isSelected = selectedDao === daoName;

                  return (
                    <DropdownMenuItem
                      key={daoName}
                      onClick={() => setSelectedDao(daoName)}
                      className={`flex items-center gap-2 ${
                        isSelected ? "bg-accent" : ""
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                      <span className="flex-1 truncate" title={daoName}>
                        {daoName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="h-5 text-xs ml-auto"
                      >
                        {daoVoteCount}
                      </Badge>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear Filters */}
          {(activeTab !== "all" || selectedDao) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveTab("all");
                setSelectedDao(null);
              }}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        {filteredVotes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                {(() => {
                  const IconComponent = getTabIcon(activeTab!);
                  return (
                    <IconComponent className="h-8 w-8 text-muted-foreground" />
                  );
                })()}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No {activeTab ? getTabTitle(activeTab).toLowerCase() : "items"}{" "}
                found
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {activeTab === "pending" && "No pending contributions found."}
                {activeTab === "active" &&
                  "No contributions are currently in active voting."}
                {activeTab === "veto" &&
                  "No contributions are in the veto window."}
                {activeTab === "passed" && "No contributions have passed yet."}
                {activeTab === "failed" && "No contributions have failed yet."}
                {activeTab === "all" &&
                  selectedDao &&
                  `No contributions found for ${selectedDao}.`}
                {activeTab === "all" &&
                  !selectedDao &&
                  "No contributions available."}
              </p>
              <Link href="/proposals">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4" />
                  Browse All Contributions
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedVotes.map((vote) => (
                <VoteCard
                  key={vote.id}
                  vote={vote}
                  currentBitcoinHeight={currentBitcoinHeight}
                />
              ))}
            </div>

            {filteredVotes.length > visibleCount && (
              <div className="text-center pt-6">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="gap-2"
                >
                  Load More Contributions
                  <span className="text-xs text-muted-foreground">
                    ({visibleCount} of {filteredVotes.length})
                  </span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
