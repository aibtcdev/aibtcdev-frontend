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
import { safeNumberFromBigInt } from "@/utils/proposal";
import Link from "next/link";
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
  // Memoize status configuration to prevent recalculation
  const statusConfig = useMemo(() => {
    // Check if proposal is in draft status first
    if (proposal.status === "DRAFT") {
      return {
        icon: AlertCircle,
        color: "text-gray-500",
        bg: "bg-gray-500/10",
        border: "border-gray-500/20",
        label: "Draft",
      };
    }

    // For deployed proposals, determine status based on timing windows
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const voteStart = safeNumberFromBigInt(proposal.vote_start);
    const voteEnd = safeNumberFromBigInt(proposal.vote_end);
    const execStart = safeNumberFromBigInt(proposal.exec_start || null);
    const execEnd = safeNumberFromBigInt(proposal.exec_end || null);

    // Initial delay before voting window
    if (now < voteStart) {
      return {
        icon: Clock,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        label: "Pending",
      };
    }

    // Inside voting window
    if (now >= voteStart && now < voteEnd) {
      return {
        icon: BarChart3,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        label: "Active",
      };
    }

    // Veto window (between vote_end and exec_start)
    if (execStart > 0 && now >= voteEnd && now < execStart) {
      return {
        icon: AlertCircle,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        label: "Veto Period",
      };
    }

    // Execution window (between exec_start and exec_end)
    if (execStart > 0 && execEnd > 0 && now >= execStart && now < execEnd) {
      return {
        icon: Clock,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        label: "Execution Window",
      };
    }

    // Completed (after exec_end or vote_end if no execution window)
    const endTime = execEnd > 0 ? execEnd : voteEnd;
    if (now >= endTime) {
      if (proposal.passed) {
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          label: "Passed",
        };
      } else {
        return {
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          label: "Failed",
        };
      }
    }

    // Fallback
    return {
      icon: AlertCircle,
      color: "text-muted-foreground",
      bg: "bg-muted/10",
      border: "border-muted/20",
      label: "Unknown",
    };
  }, [
    proposal.status,
    proposal.vote_start,
    proposal.vote_end,
    proposal.exec_start,
    proposal.exec_end,
    proposal.passed,
  ]);

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
  const forPercentage = liquidTokens > 0 ? (votesFor / liquidTokens) * 100 : 0;
  const againstPercentage =
    liquidTokens > 0 ? (votesAgainst / liquidTokens) * 100 : 0;

  // Memoize DAO info
  const daoInfo = useMemo(() => {
    const proposalWithDAO = proposal as ProposalWithDAO;
    if (proposalWithDAO.daos?.name) {
      const encodedDAOName = encodeURIComponent(proposalWithDAO.daos.name);
      return (
        <Link
          href={`/daos/${encodedDAOName}`}
          className="hover:text-foreground transition-colors duration-300 font-medium"
        >
          {proposalWithDAO.daos.name}
        </Link>
      );
    }
    return proposal.contract_principal
      ? formatAction(proposal.contract_principal)
      : "Unknown DAO";
  }, [proposal]);

  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="block group cursor-pointer"
    >
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-border/60 transition-all duration-300 group overflow-hidden">
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
              <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                {proposal.summary}
              </p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs text-muted-foreground mb-4">
          {showDAOInfo && (
            <div className="flex items-center gap-1 min-w-0 max-w-[120px] sm:max-w-none">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{daoInfo}</span>
            </div>
          )}
          <div className="flex items-center gap-1 min-w-0 max-w-[100px] sm:max-w-none">
            <User className="h-3 w-3 flex-shrink-0" />
            <a
              href={getExplorerLink("address", proposal.creator)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground transition-colors duration-300 truncate"
            >
              {truncateString(proposal.creator, 4, 4)}
            </a>
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
                <span className="text-green-500 font-medium">
                  For: {formatNumber(votesFor)} ({forPercentage.toFixed(1)}%)
                </span>
                <span className="text-red-500 font-medium">
                  Against: {formatNumber(votesAgainst)} (
                  {againstPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="w-full bg-muted/30 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div className="h-full flex">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${forPercentage}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Completed Status */}
        {(statusConfig.label === "Passed" ||
          statusConfig.label === "Failed") && (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">Final result: </span>
              <span className="font-medium">
                <span className="text-green-500">
                  {forPercentage.toFixed(1)}% For
                </span>
                ,{" "}
                <span className="text-red-500">
                  {againstPercentage.toFixed(1)}% Against
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Chart Section for detailed view */}
        {(statusConfig.label === "Active" ||
          statusConfig.label === "Veto Period" ||
          statusConfig.label === "Execution Window" ||
          statusConfig.label === "Passed" ||
          statusConfig.label === "Failed") &&
          totalVotes > 0 && (
            <div className="mt-4 pt-4 border-t border-border/30">
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
