"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import TimeStatus, { useVotingStatus } from "./TimeStatus";
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
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Vote,
  Blocks,
  ChevronRight,
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import type { Proposal } from "@/types/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LabeledField from "./LabeledField";
import { cn } from "@/lib/utils";
import ProposalMetrics from "./ProposalMetrics";

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [nextRefreshIn, setNextRefreshIn] = useState(60);
  const queryClient = useQueryClient();

  // Get voting status
  const { isActive, isEnded, isLoading } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Determine execution status
  const isExecuted = proposal.executed === true;
  const isPending = proposal.passed && proposal.executed !== true;
  const isFailed = isEnded && !proposal.passed;

  // Refresh votes data
  const refreshVotesData = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({
        queryKey: [
          "proposalVotes",
          proposal.contract_principal,
          proposal.proposal_id,
        ],
        refetchType: "all",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setRefreshing(false);
      setNextRefreshIn(60);
    }
  }, [queryClient, proposal.contract_principal, proposal.proposal_id]);

  // Implement countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !refreshing) {
      interval = setInterval(() => {
        setNextRefreshIn((prev) => {
          if (prev <= 1) {
            // When countdown reaches 0, trigger refresh
            refreshVotesData();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, refreshing, refreshVotesData]);

  // Get card border color based on status
  const getCardBorderColor = () => {
    if (isActive) return "border-l-primary";
    if (isExecuted) return "border-l-primary";
    if (isPending) return "border-l-amber-500";
    if (isFailed) return "border-l-zinc-500";
    return "";
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1.5">
          <Vote className="h-3.5 w-3.5" />
          <span>Voting Active</span>
        </Badge>
      );
    }

    if (isExecuted) {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Executed</span>
        </Badge>
      );
    }

    if (isPending) {
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending Execution</span>
        </Badge>
      );
    }

    if (isFailed) {
      return (
        <Badge className="bg-zinc-800/50 text-zinc-400 flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5" />
          <span>Not Executed</span>
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5" />
        <span>Pending</span>
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm hover:shadow-md bg-zinc-900 border-none",
        getCardBorderColor()
      )}
    >
      {/* Status Header - Simplified */}
      <div className="px-3 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">{getStatusBadge()}</div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <a
              href={getExplorerLink("address", proposal.creator)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {truncateString(proposal.creator, 6, 4)}
            </a>
          </div>

          {proposal.concluded_by && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Concluded:</span>
              <a
                href={getExplorerLink("address", proposal.concluded_by)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {truncateString(proposal.concluded_by, 6, 4)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Header Section - Simplified */}
      <CardHeader className="p-3 pb-0">
        <div className="flex flex-col gap-2">
          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-lg font-bold">{proposal.title}</h3>

            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <Badge variant="outline" className="animate-pulse">
                  Loading...
                </Badge>
              ) : isActive ? (
                <Badge
                  variant="outline"
                  className="text-primary border-primary/30"
                >
                  Active
                </Badge>
              ) : isEnded ? (
                <Badge
                  variant="outline"
                  className={
                    proposal.passed
                      ? "text-primary border-primary/30"
                      : "text-zinc-400 border-zinc-500/30"
                  }
                >
                  {proposal.passed ? "Passed" : "Failed"}
                </Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}

              {proposal.status === "FAILED" && (
                <Badge variant="destructive">Execution Failed</Badge>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(proposal.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {isActive && (
              <div className="flex items-center gap-1.5 ml-auto text-primary">
                <Timer className="h-3.5 w-3.5" />
                <span>Voting in progress</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Proposal Message - Simplified */}
      {proposal.parameters && (
        <div className="px-3 pt-3">
          <div className="rounded-md">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Message</span>
            </h4>
            <MessageDisplay message={proposal.parameters} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <CardContent className="p-0 pt-3">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full rounded-none bg-transparent px-3">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="votes"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <Vote className="h-3.5 w-3.5" />
              <span>Votes</span>
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1.5 h-9"
            >
              <Blocks className="h-3.5 w-3.5" />
              <span>Details</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Simplified */}
          <TabsContent value="overview" className="p-3 space-y-4">
            {/* Proposal Metrics */}
            <ProposalMetrics proposal={proposal} />

            {/* Voting Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium">Voting Progress</h4>
                </div>

                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="text-xs text-muted-foreground">
                      {refreshing ? (
                        <span className="text-primary flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        <span>{nextRefreshIn}s</span>
                      )}
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={refreshVotesData}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              <VoteProgress
                contractAddress={proposal.contract_principal}
                proposalId={proposal.proposal_id}
                votesFor={proposal.votes_for}
                votesAgainst={proposal.votes_against}
                refreshing={refreshing}
                tokenSymbol={proposal.token_symbol || ""}
                liquidTokens={
                  proposal.liquid_tokens !== null
                    ? proposal.liquid_tokens.toString()
                    : "0"
                }
              />
            </div>

            {/* Time Status */}
            <div className="space-y-2">
              <TimeStatus
                createdAt={proposal.created_at}
                concludedBy={proposal.concluded_by}
                status={proposal.status}
                start_block={proposal.start_block}
                end_block={proposal.end_block}
              />
            </div>
          </TabsContent>

          {/* Votes Tab - Simplified */}
          <TabsContent value="votes" className="p-3 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Vote className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Detailed Vote Record</h4>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={refreshVotesData}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <VotesTable proposalId={proposal.id} />
          </TabsContent>

          {/* Details Tab - Simplified */}
          <TabsContent value="details" className="p-3 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Block Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Block Information</span>
                </h4>

                <div className="space-y-2 text-sm">
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

              {/* Blockchain Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Blockchain Details</span>
                </h4>

                <div className="space-y-2 text-sm">
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

            {/* Execution Details */}
            {isEnded && (
              <div className="space-y-2 mt-2">
                <h4 className="text-sm font-medium flex items-center gap-1.5">
                  {proposal.passed ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>Execution Details</span>
                </h4>

                <div className="space-y-2 text-sm">
                  <p>
                    {proposal.passed
                      ? "This proposal has passed and " +
                        (proposal.executed === true
                          ? "has been executed."
                          : "is pending execution.")
                      : "This proposal has failed and will not be executed."}
                  </p>

                  {proposal.concluded_by && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Concluded by:
                      </span>
                      <a
                        href={getExplorerLink("address", proposal.concluded_by)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {truncateString(proposal.concluded_by, 6, 4)}
                      </a>
                    </div>
                  )}

                  {proposal.executed === true && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                    >
                      <ChevronRight className="h-3.5 w-3.5 mr-1" />
                      View Execution Transaction
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
