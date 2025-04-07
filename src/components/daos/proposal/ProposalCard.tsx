"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import LabeledField from "./LabeledField";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
import ProposalMetrics from "./ProposalMetrics";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import {
  ArrowRight,
  Timer,
  Layers,
  Wallet,
  User,
  Activity,
  Hash,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import type { Proposal } from "@/types/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";

/**
 * ProposalCard component
 * - Optimized to reduce re-renders
 * - Uses React Query for data fetching with proper caching
 * - Uses memoization for expensive calculations
 */
const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const queryClient = useQueryClient();

  // Memoize voting status to prevent unnecessary recalculations
  const { isActive, isEnded, isLoading } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Memoize refresh function to prevent unnecessary re-creation
  const refreshVotesData = useCallback(async () => {
    setRefreshing(true);
    setNextRefreshIn(60);

    try {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.proposalVotes(
          proposal.contract_principal,
          proposal.proposal_id
        ),
        refetchType: "all",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, proposal.contract_principal, proposal.proposal_id]);

  // Memoize badge rendering to prevent unnecessary re-renders
  const renderBadges = useMemo(() => {
    if (isLoading) return null;

    return (
      <>
        {isActive && (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            Active
          </Badge>
        )}
        {isEnded && (
          <>
            <Badge variant="destructive" className="text-xs">
              Voting Period has Ended
            </Badge>
            <Badge
              className={`text-xs ${
                proposal.passed
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}
            >
              {proposal.passed ? "Passed" : "Failed"}
            </Badge>
          </>
        )}
      </>
    );
  }, [isLoading, isActive, isEnded, proposal.passed]);

  // Auto-refresh votes every 60 seconds if voting is in progress
  useEffect(() => {
    if (isActive) {
      setNextRefreshIn(60);

      const countdownInterval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev <= 1) {
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      const refreshInterval = setInterval(() => {
        refreshVotesData();
      }, 60000);

      return () => {
        clearInterval(countdownInterval);
        clearInterval(refreshInterval);
      };
    }
  }, [isActive, refreshVotesData]);

  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden bg-zinc-900 border-zinc-800 mb-6 w-full max-w-full">
      <CardHeader className="space-y-3 pb-3 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 w-full justify-between">
            <h3 className="text-lg sm:text-xl font-bold">{proposal.title}</h3>

            <div className="flex flex-col items-start sm:items-end sm:flex-row gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Created by:</span>
                <a
                  href={getExplorerLink("address", proposal.creator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-foreground"
                >
                  {truncateString(proposal.creator, 4, 4)}
                </a>
              </div>

              <span className="hidden sm:inline mx-1">•</span>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(proposal.created_at), "MMM d, yyyy")}
                </span>
              </div>

              {proposal.concluded_by && (
                <>
                  <span className="hidden sm:inline mx-1">•</span>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Concluded by:</span>
                    <a
                      href={getExplorerLink("address", proposal.concluded_by)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground"
                    >
                      {truncateString(proposal.concluded_by, 4, 4)}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              {renderBadges}

              {isActive && (
                <span className="flex items-center gap-1 text-xs">
                  <Timer className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-blue-500 font-medium">
                    Voting in progress
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-1">
        {proposal.parameters && (
          <div className="rounded-lg border-2 border-blue-500/30 p-3 sm:p-4 bg-blue-500/5">
            <MessageDisplay message={proposal.parameters} />
          </div>
        )}

        <div className="rounded-lg border-2 border-green-500/30 p-3 sm:p-4 bg-green-500/5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <h4 className="font-medium text-base">Voting Progress</h4>
            </div>

            <div className="flex items-center gap-2">
              {isActive && (
                <span className="text-xs text-muted-foreground">
                  {refreshing ? (
                    <span className="text-blue-400 flex items-center">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <span>Updating in {nextRefreshIn}s</span>
                  )}
                </span>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={refreshVotesData}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <VoteProgress
            contractAddress={proposal.contract_principal}
            proposalId={proposal.proposal_id}
            votesFor={proposal.votes_for}
            votesAgainst={proposal.votes_against}
            refreshing={refreshing}
          />
        </div>

        {/* Votes Table */}
        <div className="rounded-lg border-2 border-purple-500/30 p-3 sm:p-4 bg-purple-500/5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium text-base">Votes</h4>
            </div>
          </div>

          <VotesTable proposalId={proposal.id} refreshing={refreshing} />
        </div>

        <TimeStatus
          createdAt={proposal.created_at}
          concludedBy={proposal.concluded_by}
          status={proposal.status}
          start_block={proposal.start_block}
          end_block={proposal.end_block}
        />

        {expanded && (
          <>
            <ProposalMetrics proposal={proposal} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1 rounded-lg border border-zinc-800 p-3 sm:p-4 bg-zinc-900/50">
                <h4 className="font-medium text-sm mb-2 sm:mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>Block Information</span>
                </h4>

                <div className="space-y-3">
                  <LabeledField
                    icon={Layers}
                    label="Snapshot block"
                    value={
                      <BlockVisual
                        value={proposal.created_at_block}
                        type="stacks"
                      />
                    }
                  />
                  <LabeledField
                    icon={ArrowRight}
                    label="Start block"
                    value={
                      <BlockVisual
                        value={proposal.start_block}
                        type="bitcoin"
                      />
                    }
                  />
                  <LabeledField
                    icon={Timer}
                    label="End block"
                    value={
                      <BlockVisual value={proposal.end_block} type="bitcoin" />
                    }
                  />
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-zinc-800 p-3 sm:p-4 bg-zinc-900/50">
                <h4 className="font-medium text-sm mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Blockchain Details</span>
                </h4>

                <div className="space-y-3">
                  <LabeledField
                    icon={Wallet}
                    label="Principal"
                    value={formatAction(proposal.contract_principal)}
                    link={getExplorerLink(
                      "contract",
                      proposal.contract_principal
                    )}
                  />
                  <LabeledField
                    icon={Activity}
                    label="Action"
                    value={formatAction(proposal.action)}
                    link={
                      proposal.action
                        ? getExplorerLink("contract", proposal.action)
                        : undefined
                    }
                  />
                  <LabeledField
                    icon={Hash}
                    label="Proposal ID"
                    value={`#${proposal.proposal_id}`}
                  />
                  <LabeledField
                    icon={Hash}
                    label="Transaction ID"
                    value={truncateString(proposal.tx_id, 8, 8)}
                    link={getExplorerLink("tx", proposal.tx_id)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Button onClick={() => setExpanded(!expanded)} className="w-full">
          {expanded ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              See less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2 h-4 w-4" />
              See more
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
