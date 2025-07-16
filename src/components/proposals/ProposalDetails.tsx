"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import TimeStatus from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import VotingProgressChart from "./VotingProgressChart";
import { useVotingStatus } from "@/hooks/useVotingStatus";
import type { Proposal, ProposalWithDAO } from "@/types";
import {
  Blocks,
  Layers,
  Hash,
  FileText,
  TrendingUp,
  Clock,
  Vote,
} from "lucide-react";
import { truncateString, getExplorerLink, formatAction } from "@/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import { safeNumberFromBigInt, safeString } from "@/utils/proposal";

interface ProposalDetailsProps {
  proposal: Proposal | ProposalWithDAO;
  className?: string;
  tokenSymbol?: string;
}

const ProposalDetails = ({
  proposal,
  className = "",
  tokenSymbol = "",
}: ProposalDetailsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isActive } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end)
  );

  const refreshVotesData = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["votes", proposal.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["proposals"],
      });
    } catch (error) {
      console.error("Failed to refresh votes data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, proposal.id, refreshing]);

  // Cleanup intervals on unmount
  useEffect(() => {
    const refreshInterval = refreshIntervalRef.current;
    const countdownInterval = countdownIntervalRef.current;

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  // Auto-refresh for active proposals
  useEffect(() => {
    if (isActive) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        refreshVotesData();
      }, 30000); // Refresh every 30 seconds

      countdownIntervalRef.current = countdownInterval;

      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isActive, refreshVotesData]);

  return (
    <div className={`space-y-12 ${className}`}>
      {/* On-chain Message - Top Priority */}
      {proposal.content && (
        <div className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12 border border-border/50 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground tracking-tight">
                On-chain Message
              </h3>
              <p className="text-muted-foreground">
                Contribution description and details
              </p>
            </div>
          </div>
          {(() => {
            const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
            const match = proposal.content.match(referenceRegex);
            const referenceLink = match?.[1];
            const cleanedContent = proposal.content
              .replace(referenceRegex, "")
              .trim();

            return (
              <>
                <MessageDisplay message={cleanedContent} />
                {referenceLink && (
                  <div className="mt-4">
                    <a
                      href={referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:text-primary/80 transition-colors"
                    >
                      Reference: {referenceLink}
                    </a>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Hero Progress Section - Full Width */}
      <div className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12 border border-border/50 shadow-lg overflow-x-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              Voting Progress
            </h3>
            <p className="text-muted-foreground">
              Real-time contribution voting analytics
            </p>
          </div>
        </div>
        <VotingProgressChart proposal={proposal} tokenSymbol={tokenSymbol} />
      </div>

      {/* Vote Details - Full Width */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-border/50 hover:border-border/80 transition-all duration-300 overflow-x-auto">
        <div className="flex items-center gap-3 mb-6">
          <Vote className="h-6 w-6 text-primary" />
          <h4 className="text-xl font-semibold text-foreground">
            Vote Details
          </h4>
        </div>
        <VotesTable proposalId={proposal.id} />
      </div>

      {/* Blockchain Information - Compact Layout */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 overflow-x-auto">
        <div className="flex items-center gap-3 mb-6">
          <Blocks className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Blockchain Details
          </h3>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Block Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Layers className="h-4 w-4" />
              <span>Blocks</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Snapshot
                </div>
                <BlockVisual
                  value={safeNumberFromBigInt(proposal.created_stx)}
                  type="stacks"
                />
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Start</div>
                <BlockVisual
                  value={safeNumberFromBigInt(proposal.vote_start)}
                  type="bitcoin"
                />
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">End</div>
                <BlockVisual
                  value={safeNumberFromBigInt(proposal.vote_end)}
                  type="bitcoin"
                />
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <FileText className="h-4 w-4" />
              <span>Contract</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Principal
                </div>
                <div className="font-mono text-sm break-all leading-relaxed">
                  {formatAction(safeString(proposal.contract_principal))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Action</div>
                <div className="font-mono text-sm break-all leading-relaxed">
                  {formatAction(proposal.action)}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Hash className="h-4 w-4" />
              <span>Transaction</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  Contribution ID
                </div>
                <div className="font-mono text-sm">#{proposal.proposal_id}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">
                  TX Hash
                </div>
                <a
                  href={getExplorerLink("tx", proposal.tx_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {truncateString(proposal.tx_id, 6, 6)}
                </a>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </div>
            <div className="space-y-3">
              <TimeStatus
                createdAt={proposal.created_at}
                status={proposal.status}
                concludedBy={proposal.concluded_by}
                vote_start={safeNumberFromBigInt(proposal.vote_start)}
                vote_end={safeNumberFromBigInt(proposal.vote_end)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
