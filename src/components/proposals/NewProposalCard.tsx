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
  // tokenSymbol = "",
  // showDAOInfo = false,
  voteData,
  vetoData,
  currentBlockHeight,
}: NewProposalCardProps) {
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

  // Use pre-fetched vote data - exact same logic as ProposalCard
  const voteSummary = useMemo(() => {
    if (voteData?.hasVoteData) {
      return {
        votesFor: voteData.votesFor,
        votesAgainst: voteData.votesAgainst,
        totalVotes: voteData.totalVotes,
        hasVoteData: true,
      };
    }

    // Fallback to proposal props
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
  }, [voteData, proposal.votes_for, proposal.votes_against]);

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

  // Check if vetoed
  const isVetoed = vetoData?.vetoExceedsForVote && !isActive;

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
    voteSummary,
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
      <article className="bg-card rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="p-4 pb-3 flex-1">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <User2 className="w-5 h-5 text-primary" />
              </div>

              {/* User info and timestamp */}
              <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
                {references.username ? (
                  <span
                    className="text-sm font-semibold hover:underline cursor-pointer"
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
                    className="text-sm font-semibold hover:underline cursor-pointer"
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

                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{timeAgo}</span>
              </div>
            </div>

            {/* Status Badge - top right */}
            <div className="flex-shrink-0">
              <ProposalStatusBadge proposal={proposal} size="sm" />
            </div>
          </div>

          {/* Title and summary - full width */}
          <div className="mb-3">
            {/* Proposal title */}
            <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors leading-snug">
              {proposal.proposal_id && (
                <span className="text-muted-foreground">
                  #{proposal.proposal_id}{" "}
                </span>
              )}
              {proposal.title}
            </h3>

            {/* Summary */}
            {cleanedSummary && (
              <p className="text-base text-muted-foreground mb-0 line-clamp-3 leading-relaxed">
                {cleanedSummary}
              </p>
            )}
          </div>

          {/* Quorum and Threshold Badges - below summary */}
          {showBadges && enhancedCalculations && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quorum Badge */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-sm border font-medium",
                  isActive
                    ? enhancedCalculations.metQuorum
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-primary/10 border-primary/20 text-primary"
                    : enhancedCalculations.metQuorum
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                )}
              >
                Quorum:{" "}
                {getStatusText(
                  enhancedCalculations.metQuorum,
                  enhancedCalculations.participationRate
                )}
              </span>

              {/* Threshold Badge */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-sm border font-medium",
                  isActive
                    ? enhancedCalculations.metThreshold
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-primary/10 border-primary/20 text-primary"
                    : enhancedCalculations.metThreshold
                      ? "bg-success/10 border-success/20 text-success"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                )}
              >
                Threshold:{" "}
                {getStatusText(
                  enhancedCalculations.metThreshold,
                  enhancedCalculations.approvalRate
                )}
              </span>

              {isVetoed && (
                <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                  Vetoed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Vote Actions Bar */}
        <div className="border-t border-border px-4 py-2">
          <div className="flex items-center justify-around">
            {/* Thumbs Up (For) */}
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-success/10 transition-colors group/btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ThumbsUp
                className={cn(
                  "h-5 w-5 transition-colors",
                  voteSummary.hasVoteData &&
                    status !== "PENDING" &&
                    status !== "DRAFT" &&
                    (voteSummary.votesFor || 0) > 0
                    ? "text-success fill-success"
                    : "text-muted-foreground group-hover/btn:text-success"
                )}
              />
              {voteSummary.hasVoteData &&
                status !== "PENDING" &&
                status !== "DRAFT" && (
                  <span
                    className={cn(
                      "text-sm font-medium",
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors group/btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ThumbsDown
                className={cn(
                  "h-5 w-5 transition-colors",
                  voteSummary.hasVoteData &&
                    status !== "PENDING" &&
                    status !== "DRAFT" &&
                    (voteSummary.votesAgainst || 0) > 0
                    ? "text-destructive fill-destructive"
                    : "text-muted-foreground group-hover/btn:text-destructive"
                )}
              />
              {voteSummary.hasVoteData &&
                status !== "PENDING" &&
                status !== "DRAFT" && (
                  <span
                    className={cn(
                      "text-sm font-medium",
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

            {/* Reference Link */}
            {references.referenceLink ? (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors group/btn"
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
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover/btn:text-primary" />
                <span className="text-sm font-medium text-muted-foreground group-hover/btn:text-primary">
                  Post
                </span>
              </button>
            ) : (
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors group/btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/proposals/${proposal.id}`);
                }}
              >
                <MessageCircle className="h-5 w-5 text-muted-foreground group-hover/btn:text-primary" />
                <span className="text-sm font-medium text-muted-foreground group-hover/btn:text-primary">
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
