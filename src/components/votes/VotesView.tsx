"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ThumbsUp,
  ThumbsDown,
  Vote,
  Search,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  XCircle,
  ExternalLink,
  Filter,
  X,
  Eye,
  Settings,
  Edit3,
  Save,
  ChevronDown,
  MoreHorizontal,
  Building2,
  User,
  MessageSquare,
  Image,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Vote as VoteType } from "@/types";
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import {
  fetchActiveAgentPromptByDaoAndAgent,
  updateAgentPrompt,
  createAgentPrompt,
} from "@/services/agent-prompt.service";
import { fetchDAOsWithExtension, fetchDAOs } from "@/services/dao.service";
import type { AgentPrompt, DAO } from "@/types";
import { getProposalVotes } from "@/lib/vote-utils";

// Utility function to format vote balances
function formatBalance(value: string | number, decimals: number = 8) {
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

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  currentBitcoinHeight: number;
}

interface VoteAnalysisModalProps {
  vote: VoteType;
  currentBitcoinHeight: number;
}

type TabType = "evaluation" | "voting" | "veto" | "passed" | "failed" | "all";

interface EditingPromptData {
  prompt_text: string;
  model: string;
  temperature: number;
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
const safeNumberFromBigInt = (value: bigint | null): number => {
  if (value === null) return 0;
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(value);
};

// Helper function to check if a vote is in the veto window
const isInVetoWindow = (
  vote: VoteType,
  currentBitcoinHeight: number
): boolean => {
  if (vote.voted === false) return false;
  if (!vote.vote_end || !vote.exec_start) return false;

  const voteEnd = safeNumberFromBigInt(vote.vote_end);
  const execStart = safeNumberFromBigInt(vote.exec_start);

  return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
};

// Helper function to check if a vote has passed or failed
const getVoteOutcome = (
  vote: VoteType,
  currentBitcoinHeight: number
): "passed" | "failed" | "pending" => {
  if (vote.voted !== true) return "pending";
  if (!vote.exec_end) return "pending";

  const execEnd = safeNumberFromBigInt(vote.exec_end);
  if (currentBitcoinHeight <= execEnd) return "pending";

  return vote.answer ? "passed" : "failed";
};

function VoteAnalysisModal({
  vote,
  currentBitcoinHeight,
}: VoteAnalysisModalProps) {
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

  const { content, reference } = parseContributionContent();

  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  // Extract first sentence from reasoning for summary
  const getReasoningPreview = (reasoning: string) => {
    if (!reasoning) return "";

    const sentences = reasoning
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    return sentences[0]?.trim() + "." || "";
  };

  const reasoningPreview = vote.reasoning
    ? getReasoningPreview(vote.reasoning)
    : null;

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold pr-8">
          Vote Analysis
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* SUMMARY PANEL - Critical Info at Top */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-6">
          {/* Title and DAO Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">
                {vote.proposal_title}
              </h3>
            </div>
            <div className="text-right">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-1"
              >
                {vote.dao_name}
              </Badge>
              <div className="text-sm text-muted-foreground">
                {formatRelativeTime(vote.created_at)}
              </div>
            </div>
          </div>

          {/* Agent Vote Decision */}
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Your agent's vote on this contribution:{" "}
              </span>
              {vote.voted === false ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Pending
                </span>
              ) : (
                <span
                  className={`font-semibold ${
                    vote.answer
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {vote.answer ? "Yes" : "No"}
                </span>
              )}
            </div>

            {vote.confidence !== null && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Agent's confidence on voting:{" "}
                </span>
                <span className="font-semibold text-foreground">
                  {Math.round(vote.confidence * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Agent's Reasoning */}
          {reasoningPreview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Your agent's reason to vote {vote.answer ? "yes" : "no"} in
                  this proposal:
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReasoningExpanded(!isReasoningExpanded)}
                  className="text-xs"
                >
                  {isReasoningExpanded ? "Show Less" : "Show More"}
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {isReasoningExpanded ? vote.reasoning : reasoningPreview}
                </div>
              </div>
            </div>
          )}

          {/* Veto Button */}
          {vote.dao_id &&
            vote.proposal_id &&
            isInVetoWindow(vote, currentBitcoinHeight) && (
              <div className="flex justify-end">
                <DAOVetoProposal
                  daoId={vote.dao_id}
                  proposalId={vote.proposal_id}
                  size="default"
                  variant="destructive"
                />
              </div>
            )}
        </div>

        {/* Contribution Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h4 className="text-lg font-semibold text-foreground">
              Contribution Details
            </h4>
          </div>

          <div className="bg-muted/30 rounded-xl p-4">
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {content || "No contribution message available."}
            </div>
          </div>

          {/* Reference Link as Preview Card */}
          {reference && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-foreground mb-1">
                    Reference Link
                  </h5>
                  <a
                    href={reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors break-all block"
                  >
                    {reference}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view external source
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Details - Moved to Bottom */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              Technical Details
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/20 rounded-lg p-3 border border-muted">
              <div className="text-xs text-muted-foreground mb-1">
                Proposal ID
              </div>
              <div className="text-sm font-mono">{vote.proposal_id}</div>
            </div>

            {vote.vote_start && (
              <div className="bg-muted/20 rounded-lg p-3 border border-muted">
                <div className="text-xs text-muted-foreground mb-1">
                  Vote Start Block
                </div>
                <div className="text-sm font-mono">
                  {safeNumberFromBigInt(vote.vote_start)}
                </div>
              </div>
            )}

            {vote.vote_end && (
              <div className="bg-muted/20 rounded-lg p-3 border border-muted">
                <div className="text-xs text-muted-foreground mb-1">
                  Vote End Block
                </div>
                <div className="text-sm font-mono">
                  {safeNumberFromBigInt(vote.vote_end)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Link href={`/proposals/${vote.proposal_id}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View Full Contribution
            </Button>
          </Link>
        </div>
      </div>
    </DialogContent>
  );
}

function VoteCard({ vote, currentBitcoinHeight }: VoteCardProps) {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editingData, setEditingData] = useState<EditingPromptData>({
    prompt_text: "",
    model: "gpt-4o",
    temperature: 0.1,
  });
  const [currentAgentPrompt, setCurrentAgentPrompt] =
    useState<AgentPrompt | null>(null);
  const [daoManagerAgentId, setDaoManagerAgentId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents to get the DAO manager agent ID
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

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

  const getStatusBadge = () => {
    if (vote.voted === false) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          Approval Pending
        </Badge>
      );
    }

    if (isInVetoWindow(vote, currentBitcoinHeight)) {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Veto Period Active
        </Badge>
      );
    }

    const outcome = getVoteOutcome(vote, currentBitcoinHeight);
    if (outcome === "passed") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          Approved
        </Badge>
      );
    } else if (outcome === "failed") {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          Denied
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
        Voting Active
      </Badge>
    );
  };

  const getVoteChip = () => {
    if (vote.voted === false) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }

    const confidenceText =
      vote.confidence !== null ? ` ${Math.round(vote.confidence * 100)}%` : "";

    return (
      <Badge
        className={`${
          vote.answer
            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300"
            : "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300"
        }`}
      >
        {vote.answer ? (
          <>
            <ThumbsUp className="h-3 w-3 mr-1" />
            Approve{confidenceText}
          </>
        ) : (
          <>
            <ThumbsDown className="h-3 w-3 mr-1" />
            Deny{confidenceText}
          </>
        )}
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

  const { content, reference } = parseContributionContent();

  // Extract first sentence from reasoning for preview
  const getReasoningPreview = (reasoning: string) => {
    if (!reasoning) return "";
    const sentences = reasoning
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    return sentences[0]?.trim() + "." || "";
  };

  const reasoningPreview = vote.reasoning
    ? getReasoningPreview(vote.reasoning)
    : null;

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

  const votingContractPrincipal = useMemo(() => {
    if (!daoData?.extensions) {
      return null;
    }

    const votingExtension = daoData.extensions.find(
      (ext: any) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    return votingExtension?.contract_principal || null;
  }, [daoData]);

  // Fetch real vote data for this proposal
  const {
    data: voteData,
    isLoading: isLoadingVoteData,
    error: voteDataError,
  } = useQuery({
    queryKey: [
      "proposalVotes",
      votingContractPrincipal,
      vote.blockchain_proposal_id,
    ],
    queryFn: () => {
      if (!vote.blockchain_proposal_id) {
        return null;
      }
      const proposalIdNum = Number(vote.blockchain_proposal_id);
      return getProposalVotes(votingContractPrincipal!, proposalIdNum);
    },
    enabled: !!votingContractPrincipal && !!vote.blockchain_proposal_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate vote progress percentages
  const voteProgress = useMemo(() => {
    if (!voteData) {
      return { yes: 0, no: 0, abstain: 0 };
    }

    const votesFor = parseFloat(voteData.formattedVotesFor) || 0;
    const votesAgainst = parseFloat(voteData.formattedVotesAgainst) || 0;
    const totalVotes = votesFor + votesAgainst;

    if (totalVotes === 0) {
      return { yes: 0, no: 0, abstain: 0 };
    }

    const yesPercent = Math.round((votesFor / totalVotes) * 100);
    const noPercent = Math.round((votesAgainst / totalVotes) * 100);
    const abstainPercent = Math.max(0, 100 - yesPercent - noPercent); // Handle rounding

    return {
      yes: yesPercent,
      no: noPercent,
      abstain: abstainPercent,
    };
  }, [voteData]);

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <div className="p-6 space-y-4">
            {/* Contribution Header */}
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/shapes/svg?seed=${vote.dao_name}`}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {vote.dao_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-muted-foreground">
                    {vote.dao_name}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    Contribution #
                    {vote.blockchain_proposal_id || vote.proposal_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge()}
                  <span className="text-xs text-muted-foreground">
                    Submitted: {formatRelativeTime(vote.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground leading-tight">
              {vote.proposal_title}
            </h3>

            {/* Vote Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vote Progress</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green-600">
                    Yes: {formatBalance(voteData?.votesFor || "0")} (
                    {voteProgress.yes}%)
                  </span>
                  <span className="text-red-600">
                    No: {formatBalance(voteData?.votesAgainst || "0")} (
                    {voteProgress.no}%)
                  </span>
                  <span className="text-gray-500">
                    Abstain: {voteProgress.abstain}%
                  </span>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-green-500"
                  style={{ width: `${voteProgress.yes}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${voteProgress.no}%` }}
                />
                <div
                  className="bg-gray-400"
                  style={{ width: `${voteProgress.abstain}%` }}
                />
              </div>
            </div>

            {/* Your Agent Voted */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Your Agent Voted:
              </span>
              {getVoteChip()}
            </div>

            {/* Reasoning Preview */}
            {reasoningPreview && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Reasoning
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsReasoningExpanded(!isReasoningExpanded)
                      }
                      className="text-xs h-6 px-2"
                    >
                      {isReasoningExpanded ? "Show Less" : "Expand"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Evaluation Scores
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isReasoningExpanded ? vote.reasoning : reasoningPreview}
                  </p>
                </div>
              </div>
            )}

            {/* Inline Veto Button */}
            {vote.dao_id &&
              vote.proposal_id &&
              isInVetoWindow(vote, currentBitcoinHeight) && (
                <div className="pt-2">
                  <DAOVetoProposal
                    daoId={vote.dao_id}
                    proposalId={vote.proposal_id}
                    size="sm"
                    variant="destructive"
                  />
                </div>
              )}
          </div>

          {/* Right Rail */}
          <div className="border-l bg-muted/20 p-4 space-y-4">
            {/* Media/Reference Preview */}
            {reference ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Reference</span>
                </div>
                <div className="bg-background rounded-lg p-3 border">
                  <a
                    href={reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 break-all"
                  >
                    {reference}
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Media Preview</span>
                </div>
                <div className="bg-background rounded-lg p-3 border border-dashed">
                  <p className="text-xs text-muted-foreground text-center">
                    No media attached
                  </p>
                </div>
              </div>
            )}

            {/* Training Feedback */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Training Feedback</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  👍 Yes
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  👎 No
                </Button>
              </div>
            </div>

            {/* Agent Instructions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Your Instructions to Agent
                </span>
              </div>

              <div className="space-y-2">
                {isEditingInstructions ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editingData.prompt_text}
                      onChange={(e) =>
                        setEditingData({
                          ...editingData,
                          prompt_text: e.target.value,
                        })
                      }
                      placeholder="Enter your agent instructions..."
                      className="min-h-[80px] resize-none text-xs"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Select
                          value={editingData.model}
                          onValueChange={(value) =>
                            setEditingData({ ...editingData, model: value })
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">
                              GPT-4o Mini
                            </SelectItem>
                            <SelectItem value="gpt-4-turbo">
                              GPT-4 Turbo
                            </SelectItem>
                            <SelectItem value="claude-3-5-sonnet-20241022">
                              Claude 3.5 Sonnet
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelInstructions}
                          disabled={
                            updatePromptMutation.isPending ||
                            createPromptMutation.isPending
                          }
                          className="h-7 px-2 text-xs"
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
                          className="h-7 px-3 text-xs"
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
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="bg-background rounded-lg p-3 border cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={() => setIsEditingInstructions(true)}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed flex-1 pr-2">
                        {currentAgentPrompt?.prompt_text ||
                          (isCreating
                            ? "Click to add instructions for your agent..."
                            : "No instructions configured. Click to add.")}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {currentAgentPrompt && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {currentAgentPrompt.model}
                          </span>
                        )}
                        <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Details */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  View Full Details
                </Button>
              </DialogTrigger>
              <VoteAnalysisModal
                vote={vote}
                currentBitcoinHeight={currentBitcoinHeight}
              />
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedDao, setSelectedDao] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
        case "evaluation":
          return votes.filter((vote) => vote.voted === false).length;
        case "voting":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_start || !vote.vote_end) return false;
            const voteStart = safeNumberFromBigInt(vote.vote_start);
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            return (
              currentBitcoinHeight >= voteStart &&
              currentBitcoinHeight <= voteEnd
            );
          }).length;
        case "veto":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_end || !vote.exec_start) return false;
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            const execStart = safeNumberFromBigInt(vote.exec_start);
            return (
              currentBitcoinHeight > voteEnd &&
              currentBitcoinHeight <= execStart
            );
          }).length;
        case "passed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "passed"
          ).length;
        case "failed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "failed"
          ).length;
        case "all":
        default:
          return votes.length;
      }
    },
    [votes, currentBitcoinHeight]
  );

  // Determine default tab based on available votes
  const getDefaultTab = useCallback((): TabType => {
    if (getTabCount("veto") > 0) return "veto";
    if (getTabCount("voting") > 0) return "voting";
    if (getTabCount("evaluation") > 0) return "evaluation";
    if (getTabCount("passed") > 0) return "passed";
    if (votes.length > 0) return "all";
    return "evaluation";
  }, [getTabCount, votes.length]);

  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab());

  // Update activeTab when votes or currentBitcoinHeight changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [getDefaultTab]);

  // Reset pagination when tab changes
  useEffect(() => {
    setVisibleCount(10);
  }, [activeTab]);

  // Filter votes based on tab and DAO filter
  const filteredVotes = useMemo(() => {
    const byTab = (() => {
      switch (activeTab) {
        case "evaluation":
          return votes.filter((vote) => vote.voted === false);
        case "voting":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_start || !vote.vote_end) return false;
            const voteStart = safeNumberFromBigInt(vote.vote_start);
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            return (
              currentBitcoinHeight >= voteStart &&
              currentBitcoinHeight <= voteEnd
            );
          });
        case "veto":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_end || !vote.exec_start) return false;
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            const execStart = safeNumberFromBigInt(vote.exec_start);
            return (
              currentBitcoinHeight > voteEnd &&
              currentBitcoinHeight <= execStart
            );
          });
        case "passed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "passed"
          );
        case "failed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "failed"
          );
        case "all":
        default:
          return votes;
      }
    })();

    return selectedDao
      ? byTab.filter((vote) => vote.dao_name === selectedDao)
      : byTab;
  }, [votes, activeTab, currentBitcoinHeight, selectedDao]);

  const paginatedVotes = filteredVotes.slice(0, visibleCount);

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case "evaluation":
        return "Awaiting Vote";
      case "voting":
        return "Active Voting";
      case "veto":
        return "Veto Period";
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      case "all":
      default:
        return "All Votes";
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "evaluation":
        return Search;
      case "voting":
        return Clock;
      case "veto":
        return Ban;
      case "passed":
        return CheckCircle;
      case "failed":
        return XCircle;
      case "all":
      default:
        return Vote;
    }
  };

  const tabs: TabType[] = [
    "evaluation",
    "voting",
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
            {filteredVotes.length === 1 ? "proposal" : "proposals"}
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
                  {getTabTitle(activeTab)}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {tabs.map((tab) => {
                  const Icon = getTabIcon(tab);
                  const tabCount = getTabCount(tab);
                  const hasActionableItems =
                    (tab === "veto" || tab === "voting") && tabCount > 0;

                  if (tab === "all" && votes.length === 0) return null;

                  return (
                    <DropdownMenuItem
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 ${
                        activeTab === tab ? "bg-accent" : ""
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          tab === "veto" && tabCount > 0 && activeTab !== tab
                            ? "animate-pulse text-red-500"
                            : ""
                        }`}
                      />
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
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        selectedDao === null
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
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
                  const Icon = getTabIcon(activeTab);
                  return <Icon className="h-8 w-8 text-muted-foreground" />;
                })()}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No {getTabTitle(activeTab).toLowerCase()} found
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {activeTab === "evaluation" &&
                  "Your agent has already voted on every proposal."}
                {activeTab === "voting" &&
                  "No proposals are currently open for voting."}
                {activeTab === "veto" && "No proposals are in the veto window."}
                {activeTab === "passed" && "No proposals have passed yet."}
                {activeTab === "failed" && "No proposals have failed yet."}
                {activeTab === "all" &&
                  selectedDao &&
                  `No proposals found for ${selectedDao}.`}
                {activeTab === "all" &&
                  !selectedDao &&
                  "No proposals available."}
              </p>
              <Link href="/proposals">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-4 w-4" />
                  Browse All Proposals
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
                  Load More Proposals
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
