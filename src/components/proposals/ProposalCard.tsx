"use client";

import type React from "react";
import {
  Clock,
  User,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { Proposal, ProposalWithDAO } from "@/types";
import { format } from "date-fns";
import { truncateString, getExplorerLink, formatAction } from "@/utils/format";
import { getProposalStatus } from "@/utils/proposal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import VoteStatusChart from "./VoteStatusChart";
import { useMemo } from "react";

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

  // Use the same status logic as AllProposals - consistent status calculation
  const proposalStatus = getProposalStatus(proposal);

  // Memoize status configuration to prevent recalculation
  const statusConfig = useMemo(() => {
    switch (proposalStatus) {
      case "DRAFT":
        return {
          icon: AlertCircle,
          color: "text-muted-foreground",
          bg: "bg-muted/10",
          border: "border-muted/20",
          label: "Draft",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-secondary",
          bg: "bg-secondary/10",
          border: "border-secondary/20",
          label: "Pending",
        };
      case "ACTIVE":
        return {
          icon: BarChart3,
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          label: "Active",
        };
      case "VETO_PERIOD":
        return {
          icon: Clock,
          color: "text-accent",
          bg: "bg-accent/10",
          border: "border-accent/20",
          label: "Veto Period",
        };
      case "EXECUTION_WINDOW":
        return {
          icon: Clock,
          color: "text-accent",
          bg: "bg-accent/10",
          border: "border-accent/20",
          label: "Execution Window",
        };
      case "PASSED":
        return {
          icon: CheckCircle,
          color: "text-success",
          bg: "bg-success/10",
          border: "border-success/20",
          label: "Passed",
        };
      case "FAILED":
        return {
          icon: XCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
          border: "border-destructive/20",
          label: "Failed",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-muted-foreground",
          bg: "bg-muted/10",
          border: "border-muted/20",
          label: "Unknown",
        };
    }
  }, [proposalStatus]);

  const StatusIcon = statusConfig.icon;

  // Memoize formatting functions
  const formatNumber = useMemo(() => {
    return (num: number) => {
      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
      return num.toString();
    };
  }, []);

  // Memoize vote summary
  const voteSummary = useMemo(() => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;
    return { votesFor, votesAgainst, totalVotes };
  }, [proposal.votes_for, proposal.votes_against]);

  // Parse liquid_tokens as a number for use in percentage calculations
  const liquidTokens = Number(proposal.liquid_tokens || 0);
  const { votesFor, votesAgainst, totalVotes } = voteSummary;

  // Calculate percentages correctly - based on liquid tokens (like VotingProgressChart)
  const forPercentage = liquidTokens > 0 ? (votesFor / liquidTokens) * 100 : 0;
  const againstPercentage =
    liquidTokens > 0 ? (votesAgainst / liquidTokens) * 100 : 0;

  // Calculate approval rate from cast votes (for display purposes)
  const approvalRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;

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
      return `/daos/${encodeURIComponent(proposalWithDAO.daos.name)}`;
    }
    return null;
  }, [proposal]);

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="block group cursor-pointer"
    >
      <div className="p-4 sm:p-6 group-hover:bg-muted/20 transition-colors duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 min-w-0">
                {proposal.proposal_id
                  ? `#${proposal.proposal_id}: ${proposal.title}`
                  : proposal.title}
              </h3>
              <div
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} border self-start sm:self-auto flex-shrink-0`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConfig.label}
              </div>
            </div>

            {proposal.summary && (
              <p className="text-sm text-foreground/75 line-clamp-2 mb-3">
                {proposal.summary}
              </p>
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
              {proposal.created_at
                ? format(new Date(proposal.created_at), "MMM dd, yyyy")
                : "Unknown date"}
            </span>
          </div>
          {totalVotes > 0 && (
            <div className="flex items-center gap-1 min-w-0 max-w-[80px] sm:max-w-none">
              <BarChart3 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatNumber(totalVotes)} votes</span>
            </div>
          )}
        </div>

        {/* Voting Progress for Active Proposals */}
        {statusConfig.label === "Active" && totalVotes > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm gap-1 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <span className="text-success font-medium">
                  For: {formatNumber(votesFor)} ({forPercentage.toFixed(1)}% of
                  liquid)
                </span>
                <span className="text-destructive font-medium">
                  Against: {formatNumber(votesAgainst)} (
                  {againstPercentage.toFixed(1)}% of liquid)
                </span>
              </div>
              <div className="text-xs text-foreground/75">
                Approval: {approvalRate.toFixed(1)}% of votes cast
              </div>
            </div>

            <div className="w-full bg-muted/30 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-success transition-all duration-500"
                  style={{ width: `${forPercentage}%` }}
                />
                <div
                  className="bg-destructive transition-all duration-500"
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Completed Status */}
        {(statusConfig.label === "Passed" ||
          statusConfig.label === "Failed") && (
          <div className="text-sm">
            <span className="text-foreground/75">Final result: </span>
            <span className="font-medium">
              <span className="text-success">{formatNumber(votesFor)} For</span>
              ,{" "}
              <span className="text-destructive">
                {formatNumber(votesAgainst)} Against
              </span>
            </span>
          </div>
        )}

        {/* Enhanced Chart Section for detailed view */}
        {(statusConfig.label === "Active" ||
          statusConfig.label === "Veto Period" ||
          statusConfig.label === "Execution Window" ||
          statusConfig.label === "Passed" ||
          statusConfig.label === "Failed") &&
          totalVotes > 0 && (
            <div className="mt-4 pt-4">
              <VoteStatusChart
                votesFor={proposal.votes_for}
                votesAgainst={proposal.votes_against}
                contractAddress={proposal.contract_principal}
                proposalId={proposal.proposal_id?.toString()}
                tokenSymbol={tokenSymbol}
                liquidTokens={proposal.liquid_tokens || "0"}
                isActive={statusConfig.label === "Active"}
              />
            </div>
          )}
      </div>
    </Link>
  );
}
