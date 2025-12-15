"use client";

import { memo, useMemo } from "react";
import { Clock, Building2, ExternalLinkIcon, ExternalLink } from "lucide-react";
import type { Proposal, ProposalWithDAO } from "@/types";
import { format } from "date-fns";
import { truncateString, getExplorerLink, formatAction } from "@/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoteStatusChart from "./VoteStatusChart";
import { TokenBalance } from "../reusables/BalanceDisplay";
import { ProposalStatusBadge } from "./ProposalBadge";
import { safeNumberFromBigInt } from "@/utils/proposal";
import { cn } from "@/lib/utils";
import { getProposalStatus } from "@/utils/proposal";
import type {
  ProposalVoteData,
  ProposalVetoData,
} from "@/hooks/useBatchProposalVotes";

interface ProposalCardProps {
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

// Extract reference links - memoized helper
const extractReferences = (content: string | null | undefined) => {
  if (!content) return { referenceLink: null, airdropTxId: null };

  const referenceMatch = content.match(/Reference:\s*(https?:\/\/\S+)/i);
  const airdropMatch = content.match(
    /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i
  );

  return {
    referenceLink: referenceMatch?.[1] || null,
    airdropTxId: airdropMatch?.[1] || null,
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

function ProposalCard({
  proposal,
  tokenSymbol = "",
  showDAOInfo = false,
  voteData,
  vetoData,
  currentBlockHeight,
}: ProposalCardProps) {
  const router = useRouter();

  // Compute status from props instead of hook
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

  // Use pre-fetched vote data instead of hook
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

  const { totalVotes, hasVoteData } = voteSummary;

  // Enhanced calculations for quorum and threshold display
  const enhancedCalculations = useMemo(() => {
    if (!voteSummary.hasVoteData || voteSummary.votesFor === null) return null;

    const liquidTokensNum = Number(proposal.liquid_tokens) || 0;
    const votesForNum = voteSummary.votesFor;
    // const votesAgainstNum = voteSummary.votesAgainst || 0;
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
      totalVotes: totalVotesNum,
    };
  }, [
    voteSummary,
    proposal.liquid_tokens,
    proposal.voting_quorum,
    proposal.voting_threshold,
  ]);

  // Memoize reference extraction (expensive regex)
  const references = useMemo(
    () => extractReferences(proposal.content),
    [proposal.content]
  );

  const cleanedSummary = useMemo(
    () => cleanSummary(proposal.summary, proposal.content),
    [proposal.summary, proposal.content]
  );

  const daoInfo = useMemo(() => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    return (
      proposalWithDAO.daos?.name ||
      (proposal.contract_principal
        ? formatAction(proposal.contract_principal)
        : "Unknown DAO")
    );
  }, [proposal]);

  const daoLink = useMemo(() => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    return proposalWithDAO.daos?.name
      ? `/aidaos/${encodeURIComponent(proposalWithDAO.daos.name)}`
      : null;
  }, [proposal]);

  // Memoize formatted date
  const formattedDate = useMemo(
    () => format(new Date(proposal.created_at), "MMM d, yyyy h:mm a"),
    [proposal.created_at]
  );

  const getStatusText = (met: boolean, percentage?: number) => {
    if (status === "PENDING" || status === "DRAFT") return "Pending";
    if (isActive) {
      return percentage !== undefined
        ? `${percentage.toFixed(4).replace(/\.?0+$/, "")}%`
        : "0%";
    }
    return met ? "Passed" : "Failed";
  };

  const showVoteChart =
    (isActive ||
      statusConfig.label === "Veto Period" ||
      statusConfig.label === "Execution Window" ||
      statusConfig.label === "Passed" ||
      statusConfig.label === "Failed") &&
    statusConfig.label !== "Pending";

  const showBadges =
    enhancedCalculations &&
    statusConfig.label !== "Pending" &&
    statusConfig.label !== "Draft";

  // Check if vetoed (from pre-fetched data)
  const isVetoed = vetoData?.vetoExceedsForVote && !isActive;

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="block group cursor-pointer"
    >
      <div className="py-4 px-8 rounded-sm mb-3 bg-background group-hover:bg-black transition-colors duration-300 max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-2">
              {proposal.proposal_id
                ? `#${proposal.proposal_id}: ${proposal.title}`
                : proposal.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <ProposalStatusBadge
                proposal={proposal}
                size="sm"
                className="flex-shrink-0"
              />

              {showBadges && enhancedCalculations && (
                <>
                  {/* Quorum Badge */}
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-xs font-medium border flex-shrink-0",
                      isActive
                        ? enhancedCalculations.metQuorum
                          ? "bg-success/10 border-success/20"
                          : "bg-primary/10 border-primary/20"
                        : enhancedCalculations.metQuorum
                          ? "bg-success/10 border-success/20"
                          : "bg-destructive/10 border-destructive/20"
                    )}
                  >
                    <span className="text-muted-foreground">Quorum:</span>{" "}
                    <span
                      className={cn(
                        isActive
                          ? enhancedCalculations.metQuorum
                            ? "text-success"
                            : "text-primary"
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

                  {/* Threshold Badge */}
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-sm text-xs font-medium border flex-shrink-0",
                      isActive
                        ? enhancedCalculations.metThreshold
                          ? "bg-success/10 border-success/20"
                          : "bg-primary/10 border-primary/20"
                        : enhancedCalculations.metThreshold
                          ? "bg-success/10 border-success/20"
                          : "bg-destructive/10 border-destructive/20"
                    )}
                  >
                    <span className="text-muted-foreground">Threshold:</span>{" "}
                    <span
                      className={cn(
                        isActive
                          ? enhancedCalculations.metThreshold
                            ? "text-success"
                            : "text-primary"
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
                </>
              )}

              {/* Veto Override Warning Badge */}
              {isVetoed && (
                <div className="px-2 py-0.5 rounded-sm text-xs font-medium border flex-shrink-0 bg-destructive/10 border-destructive/20">
                  <span className="text-destructive">⚠️ Vetoed</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-foreground/75 flex-shrink-0">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
            </div>

            {/* Reference Links */}
            {(references.referenceLink || references.airdropTxId) && (
              <ReferenceLinks
                referenceLink={references.referenceLink}
                airdropTxId={references.airdropTxId}
              />
            )}

            {cleanedSummary && (
              <div className="text-base text-foreground/75 mb-3 break-words overflow-hidden">
                <span className="break-words">{cleanedSummary}</span>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs text-foreground/75 mb-4">
          {showDAOInfo && (
            <DAOInfoLink daoInfo={daoInfo} daoLink={daoLink} router={router} />
          )}

          <CreatorLink creator={proposal.creator} />

          {hasVoteData && totalVotes !== null && totalVotes > 0 && (
            <div className="flex items-center gap-1 min-w-0 sm:max-w-none">
              <span className="text-xs text-muted-foreground">
                Total Votes:
              </span>
              <TokenBalance
                variant="abbreviated"
                value={totalVotes.toString()}
              />
            </div>
          )}
        </div>

        {/* Vote Status Chart */}
        {showVoteChart && (
          <VoteStatusChart
            proposalId={proposal.proposal_id?.toString()}
            tokenSymbol={tokenSymbol}
            liquidTokens={proposal.liquid_tokens}
            proposal={proposal}
          />
        )}
      </div>
    </Link>
  );
}

// Extracted sub-components for better memoization
const ReferenceLinks = memo(function ReferenceLinks({
  referenceLink,
  airdropTxId,
}: {
  referenceLink: string | null;
  airdropTxId: string | null;
}) {
  return (
    <div className="space-y-3 mb-4">
      {referenceLink && (
        <div className="rounded-sm">
          <div className="text-xs text-muted-foreground mb-1">Reference</div>
          <span
            role="link"
            className="text-sm text-primary hover:text-primary/80 transition-colors break-all cursor-pointer flex items-center gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(referenceLink, "_blank", "noopener,noreferrer");
            }}
          >
            <span className="inline-block max-w-full break-all">
              {referenceLink}
            </span>
            <ExternalLinkIcon className="h-4 w-4" />
          </span>
        </div>
      )}
      {airdropTxId && (
        <div className="p-3 bg-background/50 rounded-sm border border-border/50">
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
            <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
            <span className="inline-block max-w-full break-all">
              {airdropTxId}
            </span>
          </span>
        </div>
      )}
    </div>
  );
});

const DAOInfoLink = memo(function DAOInfoLink({
  daoInfo,
  daoLink,
  router,
}: {
  daoInfo: string;
  daoLink: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0 max-w-[120px] sm:max-w-none">
      <Building2 className="h-3 w-3 flex-shrink-0" />
      {daoLink ? (
        <span
          className="truncate hover:text-foreground transition-colors duration-300 font-medium cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(daoLink);
          }}
        >
          {daoInfo}
        </span>
      ) : (
        <span className="truncate">{daoInfo}</span>
      )}
    </div>
  );
});

const CreatorLink = memo(function CreatorLink({
  creator,
}: {
  creator: string;
}) {
  return (
    <div className="flex items-center gap-1 min-w-0 sm:max-w-none">
      <span className="text-xs text-muted-foreground">Creator:</span>
      <span
        className="hover:text-foreground transition-colors duration-300 truncate cursor-pointer flex items-center gap-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(
            getExplorerLink("address", creator),
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        {truncateString(creator, 4, 4)}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </span>
    </div>
  );
});

export default memo(ProposalCard);
