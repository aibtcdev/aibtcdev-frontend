"use client";

import type React from "react";
import { Clock, User, BarChart3, Building2, Coins } from "lucide-react";
import type { Proposal, ProposalWithDAO } from "@/types";
import { format } from "date-fns";
import { truncateString, getExplorerLink, formatAction } from "@/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoteStatusChart from "./VoteStatusChart";
import { useMemo, useEffect, useRef, useState } from "react";
import { TokenBalance } from "../reusables/BalanceDisplay";
import { ProposalStatusBadge } from "./ProposalBadge";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useProposalVote } from "@/hooks/useProposalVote";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface ProposalCardProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
  showDAOInfo?: boolean;
}

export default function ProposalCard({
  proposal,
  tokenSymbol = "",
  showDAOInfo = false,
}: ProposalCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Use the unified status system
  const { statusConfig, isActive, isPassed } = useProposalStatus(proposal);

  // Use centralized vote hook for consistent data fetching
  const {
    voteDisplayData,
    error: hasVoteDataError,
    refreshVoteData,
    isLoading: isLoadingVotes,
  } = useProposalVote({
    proposal,
    contractPrincipal: proposal.contract_principal,
  });

  // Extract vote data with fallback to proposal props
  const voteSummary = useMemo(() => {
    // Use hook data if available, otherwise fallback to proposal props
    if (voteDisplayData && !hasVoteDataError) {
      const votesForNum = Number(voteDisplayData.rawVotesFor);
      const votesAgainstNum = Number(voteDisplayData.rawVotesAgainst);
      return {
        votesFor: votesForNum,
        votesAgainst: votesAgainstNum,
        totalVotes: votesForNum + votesAgainstNum,
        hasVoteData: true,
      };
    }

    // Fallback to proposal props if hook data unavailable
    const hasVoteData =
      proposal.votes_for !== null &&
      proposal.votes_for !== undefined &&
      proposal.votes_against !== null &&
      proposal.votes_against !== undefined;

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
    const totalVotes = votesFor + votesAgainst;

    return { votesFor, votesAgainst, totalVotes, hasVoteData: true };
  }, [
    voteDisplayData,
    hasVoteDataError,
    proposal.votes_for,
    proposal.votes_against,
  ]);

  // Parse liquid_tokens as a number for use in percentage calculations
  const liquidTokens = Number(proposal.liquid_tokens);
  const { totalVotes, hasVoteData } = voteSummary;

  // Memoize DAO info
  const daoInfo = useMemo(() => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    if (proposalWithDAO.daos?.name) {
      return proposalWithDAO.daos.name;
    }
    return proposal.contract_principal
      ? formatAction(proposal.contract_principal)
      : "Unknown DAO";
  }, [proposal]);

  // Memoize DAO link for navigation
  const daoLink = useMemo(() => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    if (proposalWithDAO.daos?.name) {
      return `/aidaos/${encodeURIComponent(proposalWithDAO.daos.name)}`;
    }
    return null;
  }, [proposal]);

  return (
    <Link
      ref={cardRef}
      href={`/proposals/${proposal.id}`}
      className={`block group cursor-pointer transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="py-4 px-1 sm:p-5 lg:p-6 bg-muted/10 rounded-sm mb-3 group-hover:bg-muted/20 transition-colors duration-300 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 min-w-0">
                {proposal.proposal_id
                  ? `#${proposal.proposal_id}: ${proposal.title}`
                  : proposal.title}
              </h3>
              <ProposalStatusBadge
                proposal={proposal}
                size="sm"
                className="self-start sm:self-auto flex-shrink-0"
              />
            </div>

            {/* Reference Links - Extract from content and display below title */}
            {(() => {
              if (!proposal.content) return null;

              const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
              const airdropReferenceRegex =
                /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i;
              const referenceMatch = proposal.content.match(referenceRegex);
              const airdropMatch = proposal.content.match(
                airdropReferenceRegex
              );
              const referenceLink = referenceMatch?.[1];
              const airdropTxId = airdropMatch?.[1];

              if (!referenceLink && !airdropTxId) return null;

              return (
                <div className="space-y-3 mb-4">
                  {referenceLink && (
                    <div className="p-3 bg-background/50 rounded-sm border border-border/50">
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

            {proposal.summary && (
              <div className="text-base text-foreground/75 mb-3 break-words overflow-hidden">
                {(() => {
                  if (!proposal.content) return proposal.summary;

                  // Remove reference links from summary since we show them separately
                  const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
                  const airdropReferenceRegex =
                    /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i;

                  let cleanedSummary = proposal.summary
                    .replace(referenceRegex, "")
                    .replace(airdropReferenceRegex, "")
                    .trim();

                  // Remove any remaining URLs from summary
                  cleanedSummary = cleanedSummary
                    .replace(/(https?:\/\/\S+)/g, "")
                    .trim();

                  return <span className="break-words">{cleanedSummary}</span>;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs text-foreground/75 mb-4">
          {showDAOInfo && (
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
          )}
          <div className="flex items-center gap-1 min-w-0 max-w-[100px] sm:max-w-none">
            <User className="h-3 w-3 flex-shrink-0" />
            <span
              className="hover:text-foreground transition-colors duration-300 truncate cursor-pointer"
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
              {truncateString(proposal.creator, 4, 4)}
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-0 max-w-[100px] sm:max-w-none">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {format(new Date(proposal.created_at), "MMM d")}
            </span>
          </div>
          {hasVoteData && totalVotes !== null && totalVotes > 0 && (
            <div className="flex items-center gap-1 min-w-0 max-w-[80px] sm:max-w-none">
              <BarChart3 className="h-3 w-3 flex-shrink-0" />
              <TokenBalance
                variant="abbreviated"
                value={totalVotes.toString()}
              />
            </div>
          )}
          {liquidTokens > 0 && (
            <div className="flex items-center gap-1 min-w-0 max-w-[100px] sm:max-w-none">
              <Coins className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs text-muted-foreground">Liquid:</span>
              <TokenBalance
                variant="abbreviated"
                value={liquidTokens.toString()}
              />
            </div>
          )}
        </div>

        {/* Vote Data Error Handling */}
        {hasVoteDataError && !voteDisplayData && (
          <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-sm">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Failed to fetch vote data</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                refreshVoteData();
              }}
              disabled={isLoadingVotes}
              className="h-8 px-2 text-destructive hover:text-destructive"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${isLoadingVotes ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        )}

        {/* Completed Status */}
        {/* {isPassed && (
          <div className="text-sm">
            <span className="text-foreground/75">Final result: </span>
            <span className="font-medium">
              <span className="text-success">
                <TokenBalance variant="abbreviated" value={votesFor} /> For
              </span>
              ,{" "}
              <span className="text-destructive">
                <TokenBalance variant="abbreviated" value={votesAgainst} />{" "}
                Against
              </span>
            </span>
          </div>
        )} */}

        {/* Enhanced Chart Section for detailed view - Hide for pending proposals */}
        {(isActive ||
          statusConfig.label === "Veto Period" ||
          statusConfig.label === "Execution Window" ||
          isPassed ||
          statusConfig.label === "Failed") &&
          statusConfig.label !== "Pending" && (
            <div className="">
              <VoteStatusChart
                proposalId={proposal.proposal_id?.toString()}
                tokenSymbol={tokenSymbol}
                liquidTokens={proposal.liquid_tokens}
                proposal={proposal}
              />
            </div>
          )}
      </div>
    </Link>
  );
}
