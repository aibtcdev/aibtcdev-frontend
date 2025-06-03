"use client";

import type React from "react";
import { Clock, User, BarChart3, CheckCircle, XCircle, AlertCircle, Building2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVotingStatus } from "./TimeStatus";
import type { Proposal, ProposalWithDAO } from "@/types/supabase";
import { format } from "date-fns";
import { truncateString, getExplorerLink, formatAction } from "@/helpers/helper";
import { safeNumberFromBigInt } from "@/helpers/proposal-utils";
import Link from "next/link";
import VoteStatusChart from "./VoteStatusChart";

interface ProposalCardProps {
  proposal: Proposal | ProposalWithDAO;
  onToggleVisibility: (proposalId: string) => void;
  isHidden: boolean;
  tokenSymbol?: string;
  showDAOInfo?: boolean;
}

export default function ProposalCard({
  proposal,
  onToggleVisibility,
  isHidden,
  tokenSymbol = "",
  showDAOInfo = false,
}: ProposalCardProps) {
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end),
  );

  const getStatusConfig = () => {
    if (isActive) {
      return {
        icon: BarChart3,
        color: 'text-primary',
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        label: 'Active'
      };
    } else if (isEnded && proposal.passed) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        label: 'Passed'
      };
    } else if (isEnded && !proposal.passed) {
      return {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        label: 'Failed'
      };
    } else {
      return {
        icon: AlertCircle,
        color: 'text-muted-foreground',
        bg: 'bg-muted/10',
        border: 'border-muted/20',
        label: 'Pending'
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  const getVoteSummary = () => {
    const votesFor = Number(proposal.votes_for || 0);
    const votesAgainst = Number(proposal.votes_against || 0);
    const totalVotes = votesFor + votesAgainst;
    return { votesFor, votesAgainst, totalVotes };
  };

  const { votesFor, votesAgainst, totalVotes } = getVoteSummary();
  const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0;

  const getDAOInfo = () => {
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
  };

  return (
    <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-6 hover:border-border/60 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-1">
              {proposal.title}
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color} border`}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </div>
          </div>
          
          {proposal.content && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {proposal.content}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleVisibility(proposal.id)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-300"
            title={isHidden ? "Show proposal" : "Hide proposal"}
          >
            {isHidden ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Link href={`/proposals/${proposal.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300"
              title="View details"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        {showDAOInfo && (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span>{getDAOInfo()}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <a
            href={getExplorerLink("address", proposal.creator)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors duration-300"
          >
            {truncateString(proposal.creator, 4, 4)}
          </a>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {proposal.created_at
              ? format(new Date(proposal.created_at), "MMM dd, yyyy")
              : "Unknown date"}
          </span>
        </div>
        {totalVotes > 0 && (
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span>{formatNumber(totalVotes)} votes</span>
          </div>
        )}
      </div>

      {/* Voting Progress for Active Proposals */}
      {isActive && totalVotes > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-green-500 font-medium">
                For: {formatNumber(votesFor)} ({forPercentage.toFixed(1)}%)
              </span>
              <span className="text-red-500 font-medium">
                Against: {formatNumber(votesAgainst)} ({againstPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
          
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
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
      {isEnded && (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Final result: </span>
            <span className={proposal.passed ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
              {forPercentage.toFixed(1)}% for, {againstPercentage.toFixed(1)}% against
            </span>
          </div>
        </div>
      )}

             {/* Enhanced Chart Section for detailed view */}
       {totalVotes > 0 && (
         <div className="mt-4 pt-4 border-t border-border/30">
           <VoteStatusChart 
             votesFor={proposal.votes_for}
             votesAgainst={proposal.votes_against}
             contractAddress={proposal.contract_principal}
             proposalId={proposal.proposal_id?.toString()}
             tokenSymbol={tokenSymbol}
             liquidTokens={proposal.liquid_tokens || "0"}
             isActive={isActive}
           />
         </div>
       )}
    </div>
  );
} 