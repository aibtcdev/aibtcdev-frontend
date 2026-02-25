"use client";

import { memo, useMemo } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ExternalLink,
  User2,
} from "lucide-react";
import type { Proposal, ProposalWithDAO } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { truncateString, getExplorerLink } from "@/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TokenBalance } from "../reusables/BalanceDisplay";
import { ProposalStatusBadge } from "./ProposalBadge";
import { cn } from "@/lib/utils";
import { getProposalStatus, safeNumberFromBigInt } from "@/utils/proposal";
import { useProposalVote } from "@/hooks/useProposalVote";
import type {
  ProposalVoteData,
  ProposalVetoData,
} from "@/hooks/useBatchProposalVotes";

interface NewProposalCardProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
  showDAOInfo?: boolean;
  voteData?: ProposalVoteData;
  vetoData?: ProposalVetoData;
  currentBlockHeight?: number | null;
}

// Helper function to get status config
const getStatusConfig = (status: string) => {
  switch (status) {
    case "DRAFT":
      return {
        label: "Draft",
        color: "text-muted-foreground",
        bg: "bg-muted/10",
        border: "border-muted/20",
      };
    case "PENDING":
      return {
        label: "Pending",
        color: "text-secondary",
        bg: "bg-secondary/10",
        border: "border-secondary/20",
      };
    case "ACTIVE":
      return {
        label: "Active",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
      };
    case "VETO_PERIOD":
      return {
        label: "Veto Period",
        color: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
      };
    case "EXECUTION_WINDOW":
      return {
        label: "Execution Window",
        color: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
      };
    case "PASSED":
      return {
        label: "Passed",
        color: "text-success",
        bg: "bg-success/10",
        border: "border-success/20",
      };
    case "FAILED":
      return {
        label: "Failed",
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/20",
      };
    default:
      return {
        label: "Unknown",
        color: "text-muted-foreground",
        bg: "bg-muted/10",
        border: "border-muted/20",
      };
  }
};

// Extract reference links and username - memoized helper
const extractReferences = (content: string | null | undefined) => {
  if (!content)
    return { referenceLink: null, airdropTxId: null, username: null };

  const referenceMatch = content.match(/Reference:\s*(https?:\/\/\S+)/i);
  const airdropMatch = content.match(
    /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i
  );

  // Extract username from X/Twitter URL (e.g., https://x.com/username or https://twitter.com/username)
  let username = null;
  if (referenceMatch?.[1]) {
    const urlMatch = referenceMatch[1].match(
      /(?:x\.com|twitter\.com)\/([^\/\?]+)/i
    );
    if (urlMatch?.[1]) {
      username = urlMatch[1];
    }
  }

  return {
    referenceLink: referenceMatch?.[1] || null,
    airdropTxId: airdropMatch?.[1] || null,
    username,
  };
};

// Clean summary helper
const cleanSummary = (
  summary: string | null | undefined,
  content: string | null | undefined
) => {
  if (!summary) return null;
  if (!content) return summary;

  return summary
    .replace(/Reference:\s*(https?:\/\/\S+)/i, "")
    .replace(/Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i, "")
    .replace(/(https?:\/\/\S+)/g, "")
    .trim();
};

function NewProposalCard({
  proposal,
  voteData,
  vetoData,
  currentBlockHeight,
}: NewProposalCardProps) {
  // Use the same vote hook as VoteStatusChart for consistent data
  const { voteDisplayData, calculations, hasData } = useProposalVote({
    proposal: proposal,
    fallbackVotesFor: voteData?.rawVotesFor,
    fallbackVotesAgainst: voteData?.rawVotesAgainst,
  });
  const router = useRouter();

  // Compute status from props
  const { status, statusConfig, isActive } = useMemo(() => {
    const computedStatus = getProposalStatus(
      proposal,
      currentBlockHeight ?? null
    );
    const config = getStatusConfig(computedStatus);
    return {
      status: computedStatus,
      statusConfig: config,
      isActive: computedStatus === "ACTIVE",
    };
  }, [proposal, currentBlockHeight]);

  // Use vote data from useProposalVote hook (same as VoteStatusChart)
  const voteSummary = useMemo(() => {
    if (hasData && voteDisplayData && calculations) {
      return {
        votesFor: calculations.votesForNum,
        votesAgainst: calculations.votesAgainstNum,
        totalVotes: calculations.totalVotes,
        hasVoteData: true,
      };
    }

    // Fallback to pre-fetched batch data if available
    if (voteData?.hasVoteData) {
      return {
        votesFor: voteData.votesFor,
        votesAgainst: voteData.votesAgainst,
        totalVotes: voteData.totalVotes,
        hasVoteData: true,
      };
    }

    // Final fallback to proposal props
    const hasVoteData =
      proposal.votes_for != null && proposal.votes_against != null;

    if (!hasVoteData) {
      return {
        votesFor: null,
        votesAgainst: null,
        totalVotes: null,
        hasVoteData: false,
      };
    }

    const votesFor = Number(proposal.votes_for);
    const votesAgainst = Number(proposal.votes_against);
    return {
      votesFor,
      votesAgainst,
      totalVotes: votesFor + votesAgainst,
      hasVoteData: true,
    };
  }, [
    hasData,
    voteDisplayData,
    calculations,
    voteData,
    proposal.votes_for,
    proposal.votes_against,
  ]);

  // Memoize reference extraction
  const references = useMemo(
    () => extractReferences(proposal.content),
    [proposal.content]
  );

  const cleanedSummary = useMemo(
    () => cleanSummary(proposal.summary, proposal.content),
    [proposal.summary, proposal.content]
  );

  // Memoize relative time
  const timeAgo = useMemo(
    () =>
      formatDistanceToNow(new Date(proposal.created_at), {
        addSuffix: true,
      }).replace("about ", ""),
    [proposal.created_at]
  );

  // Check if vetoed - use calculations if available, fallback to prop
  const isVetoed =
    !isActive &&
    ((calculations && vetoData?.totalVetoAmount
      ? vetoData.totalVetoAmount > calculations.votesForNum
      : false) ||
      (vetoData?.vetoExceedsForVote ?? false));

  // Enhanced calculations for quorum and threshold display
  const enhancedCalculations = useMemo(() => {
    if (!voteSummary.hasVoteData || voteSummary.votesFor === null) return null;

    const liquidTokensNum = Number(proposal.liquid_tokens) || 0;
    const votesForNum = voteSummary.votesFor;
    const totalVotesNum = voteSummary.totalVotes || 0;

    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum);
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold);

    const safeCalc = (numerator: number, denominator: number) =>
      denominator > 0 ? (numerator / denominator) * 100 : 0;

    const participationRate = safeCalc(totalVotesNum, liquidTokensNum);
    const approvalRate = safeCalc(votesForNum, totalVotesNum);

    const metQuorum = participationRate >= quorumPercentage;
    const metThreshold =
      totalVotesNum > 0 && approvalRate >= thresholdPercentage;

    return {
      participationRate,
      approvalRate,
      quorumPercentage,
      thresholdPercentage,
      metQuorum,
      metThreshold,
    };
  }, [
    voteSummary.hasVoteData,
    voteSummary.votesFor,
    voteSummary.totalVotes,
    proposal.liquid_tokens,
    proposal.voting_quorum,
    proposal.voting_threshold,
  ]);

  const getStatusText = (met: boolean, percentage?: number) => {
    if (status === "PENDING" || status === "DRAFT") return "Pending";
    if (isActive) {
      return percentage !== undefined
        ? `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`
        : "0%";
    }
    return met ? "Passed" : "Failed";
  };

  const showBadges =
    enhancedCalculations &&
    statusConfig.label !== "Pending" &&
    statusConfig.label !== "Draft";

  return (
    <Link href={`/proposals/${proposal.id}`} className="block group h-full">
      <article className="bg-card rounded-sm hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col ">
        {/* Header */}
        <div className="p-4 flex-1">
          {/* Top row - User info and Status Badge */}
          <div className="flex items-start justify-between mb-3">
            {/* Left side - Avatar and User info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-sm bg-primary/20 flex items-center justify-center">
                <User2 className="w-7 h-7 text-primary" />
              </div>

              {/* User info and timestamp */}
              <div className="flex flex-col">
                {references.username ? (
                  <span
                    className="text-sm font-semibold hover:underline cursor-pointer text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (references.referenceLink) {
                        window.open(
                          references.referenceLink,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    @{references.username}
                  </span>
                ) : (
                  <span
                    className="text-sm font-semibold hover:underline cursor-pointer text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        getExplorerLink("address", proposal.creator),
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    @{truncateString(proposal.creator, 4, 4)}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
            </div>

            {/* Status Badge - top right */}
            <div className="flex-shrink-0">
              <ProposalStatusBadge proposal={proposal} size="md" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-1">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {proposal.proposal_id && (
                <span className="text-primary">#{proposal.proposal_id} </span>
              )}
              {proposal.title}
            </h3>
          </div>

          {/* Summary */}
          {cleanedSummary && (
            <p className="text-md text-muted-foreground mb-2 line-clamp-4 leading-relaxed">
              {cleanedSummary}
            </p>
          )}
        </div>

        {/* Quorum and Threshold Badges */}
        {showBadges && enhancedCalculations && (
          <div className="flex items-center gap-3 px-4 pb-3">
            {/* Quorum */}
            <div
              className={cn(
                "rounded-sm px-2 py-1 border flex items-center gap-2",
                isActive
                  ? enhancedCalculations.metQuorum
                    ? "bg-success/10 border-success/30"
                    : "bg-card border-border"
                  : enhancedCalculations.metQuorum
                    ? "bg-success/10 border-success/30"
                    : "bg-destructive/10 border-destructive/30"
              )}
            >
              <span className="text-xs">QUORUM:</span>
              <span
                className={cn(
                  "text-xs uppercase font-bold",
                  isActive
                    ? enhancedCalculations.metQuorum
                      ? "text-success"
                      : "text-foreground"
                    : enhancedCalculations.metQuorum
                      ? "text-success"
                      : "text-destructive"
                )}
              >
                {getStatusText(
                  enhancedCalculations.metQuorum,
                  enhancedCalculations.participationRate
                )}
              </span>
            </div>

            {/* Threshold */}
            <div
              className={cn(
                "rounded-sm px-2 py-1 border flex items-center gap-2",
                isActive
                  ? enhancedCalculations.metThreshold
                    ? "bg-success/10 border-success/30"
                    : "bg-card border-border"
                  : enhancedCalculations.metThreshold
                    ? "bg-success/10 border-success/30"
                    : "bg-destructive/10 border-destructive/30"
              )}
            >
              <span className="  text-xs">THRESHOLD:</span>
              <span
                className={cn(
                  "text-xs uppercase font-bold",
                  isActive
                    ? enhancedCalculations.metThreshold
                      ? "text-success"
                      : "text-foreground"
                    : enhancedCalculations.metThreshold
                      ? "text-success"
                      : "text-destructive"
                )}
              >
                {getStatusText(
                  enhancedCalculations.metThreshold,
                  enhancedCalculations.approvalRate
                )}
              </span>
            </div>

            {/* Vetoed Badge */}
            {isVetoed && (
              <div className="rounded-sm px-1 border bg-destructive/10 border-destructive/30">
                <span className="text-xs text-destructive uppercase">
                  VETOED
                </span>
              </div>
            )}
          </div>
        )}

        {/* Vote Actions Bar */}
        <div className="border-t border-border">
          <div className="flex items-center px-6 py-4">
            {/* Thumbs Up (For) */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-success/10 transition-colors group/btn mr-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="w-8 h-8 rounded-sm bg-success/10 flex items-center justify-center">
                <ThumbsUp
                  className={cn(
                    "h-4 w-4 transition-colors",
                    voteSummary.totalVotes !== null &&
                      voteSummary.totalVotes > 0 &&
                      (voteSummary.votesFor || 0) > 0
                      ? "text-success"
                      : "text-muted-foreground group-hover/btn:text-success"
                  )}
                />
              </div>
              {voteSummary.totalVotes !== null &&
                voteSummary.totalVotes > 0 && (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      (voteSummary.votesFor || 0) > 0
                        ? "text-success"
                        : "text-muted-foreground"
                    )}
                  >
                    <TokenBalance
                      value={(voteSummary.votesFor || 0).toString()}
                      variant="abbreviated"
                    />
                  </span>
                )}
            </button>

            {/* Thumbs Down (Against) */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-destructive/10 transition-colors group/btn mr-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="w-8 h-8 rounded-sm bg-destructive/10 flex items-center justify-center">
                <ThumbsDown
                  className={cn(
                    "h-4 w-4 transition-colors",
                    voteSummary.totalVotes !== null &&
                      voteSummary.totalVotes > 0 &&
                      (voteSummary.votesAgainst || 0) > 0
                      ? "text-destructive"
                      : "text-muted-foreground group-hover/btn:text-destructive"
                  )}
                />
              </div>
              {voteSummary.totalVotes !== null &&
                voteSummary.totalVotes > 0 && (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      (voteSummary.votesAgainst || 0) > 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    <TokenBalance
                      value={(voteSummary.votesAgainst || 0).toString()}
                      variant="abbreviated"
                    />
                  </span>
                )}
            </button>

            {/* Reference Link or View */}
            {references.referenceLink ? (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-muted/10 transition-colors group/btn ml-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (references.referenceLink) {
                    window.open(
                      references.referenceLink,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover/btn:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground group-hover/btn:text-foreground">
                  Post
                </span>
              </button>
            ) : (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-muted/10 transition-colors group/btn ml-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/proposals/${proposal.id}`);
                }}
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground group-hover/btn:text-foreground" />
                <span className="text-sm font-medium text-muted-foreground group-hover/btn:text-foreground">
                  View
                </span>
              </button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export default memo(NewProposalCard);
