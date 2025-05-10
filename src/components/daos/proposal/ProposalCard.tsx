"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Info,
  ListFilter,
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

const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
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
  }, [isActive, refreshing, refreshVotesData]); // Added refreshVotesData to the dependency array

  // Get card opacity based on execution status
  const getCardOpacity = () => {
    if (isActive) return "opacity-100"; // Active proposals are fully visible
    if (isExecuted) return "opacity-100"; // Executed proposals are fully visible
    if (isPending) return "opacity-95"; // Pending execution proposals are slightly muted
    if (isFailed) return "opacity-90"; // Failed proposals are more muted
    return "opacity-100"; // Default
  };

  // Get execution status badge
  const getExecutionBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-blue-500 text-white border-blue-600 flex items-center gap-1.5">
          <Vote className="h-3.5 w-3.5" />
          <span>Voting Active</span>
        </Badge>
      );
    }

    if (isExecuted) {
      return (
        <Badge className="bg-green-500 text-white border-green-600 flex items-center gap-1.5">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Executed</span>
        </Badge>
      );
    }

    if (isPending) {
      return (
        <Badge className="bg-amber-500 text-white border-amber-600 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending Execution</span>
        </Badge>
      );
    }

    if (isFailed) {
      return (
        <Badge className="bg-red-500 text-white border-red-600 flex items-center gap-1.5">
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
        "overflow-hidden bg-zinc-900 border-zinc-800 mb-6 w-full transition-all duration-200 shadow-md hover:shadow-lg",
        getCardOpacity(),
        isExecuted
          ? "border-l-4 border-l-green-500"
          : isPending
          ? "border-l-4 border-l-amber-500"
          : isFailed
          ? "border-l-4 border-l-red-500"
          : isActive
          ? "border-l-4 border-l-blue-500"
          : ""
      )}
    >
      {/* Execution Status Badge - Always visible at the top */}
      <div className="bg-zinc-800/80 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Status:</span>
          {getExecutionBadge()}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4 text-zinc-400" />
                <span className="sr-only">Status Information</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">
                {isActive
                  ? "This proposal is currently being voted on."
                  : isExecuted
                  ? "This proposal has passed and has been executed on-chain."
                  : isPending
                  ? "This proposal has passed but has not been executed yet."
                  : isFailed
                  ? "This proposal has failed and will not be executed."
                  : "This proposal is waiting for the voting period to begin."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Header Section */}
      <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-4 sm:p-6 border-b border-zinc-800">
        <div className="flex flex-col gap-4">
          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xl font-bold">{proposal.title}</h3>

            <div className="flex flex-wrap gap-2">
              {isLoading ? (
                <Badge variant="outline" className="animate-pulse">
                  Loading...
                </Badge>
              ) : isActive ? (
                <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                  Active
                </Badge>
              ) : isEnded ? (
                <Badge
                  className={
                    proposal.passed
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
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

          {/* Creator and Date */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <a
                href={getExplorerLink("address", proposal.creator)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {truncateString(proposal.creator, 6, 4)}
              </a>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(proposal.created_at), "MMM d, yyyy")}
              </span>
            </div>

            {isActive && (
              <div className="flex items-center gap-1.5 ml-auto text-blue-400">
                <Timer className="h-4 w-4" />
                <span>Voting in progress</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Main Content */}
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <div className="border-b border-zinc-800 bg-zinc-800/30">
            <TabsList className="h-14 w-full rounded-none bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-2 h-full"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="votes"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-2 h-full"
              >
                <Vote className="h-4 w-4" />
                <span>Detailed Vote Record</span>
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none flex items-center gap-2 h-full"
              >
                <Blocks className="h-4 w-4" />
                <span>Blockchain Details</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 sm:p-6 space-y-6">
            {/* Proposal Metrics - Redesigned as horizontal pills */}
            <div className="mb-6">
              <ProposalMetrics proposal={proposal} />
            </div>

            {/* Proposal Message/Parameters */}
            {proposal.parameters && (
              <>
                <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-medium">Proposal Message</h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-0.5"
                          >
                            <Info className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-sm">
                            The on-chain message associated with this proposal.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <MessageDisplay message={proposal.parameters} />
                </div>
              </>
            )}

            {/* Voting Progress */}
            <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium">Voting Progress</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-0.5"
                        >
                          <Info className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-sm">
                          Current voting results for this proposal.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={refreshVotesData}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1.5 ${
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
            <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">Voting Timeline</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-0.5"
                      >
                        <Info className="h-4 w-4 text-zinc-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm">
                        The timeline for this proposal&apos;s voting period.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <TimeStatus
                createdAt={proposal.created_at}
                concludedBy={proposal.concluded_by}
                status={proposal.status}
                start_block={proposal.start_block}
                end_block={proposal.end_block}
              />
            </div>
          </TabsContent>

          {/* Votes Tab */}
          <TabsContent value="votes" className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-medium">Detailed Vote Record</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-0.5"
                      >
                        <Info className="h-4 w-4 text-zinc-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm">
                        Individual votes cast for this proposal.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                  Filter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshVotesData}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 mr-1.5 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-700 overflow-hidden">
              <VotesTable proposalId={proposal.id} />
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Block Information */}
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <h4 className="font-medium text-base mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-500" />
                  <span>Block Information</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-0.5"
                        >
                          <Info className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-sm">
                          Blockchain blocks associated with this proposal.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h4>

                <div className="space-y-4">
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
              <div className="rounded-lg border border-zinc-700 p-4 bg-zinc-800/30">
                <h4 className="font-medium text-base mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span>Blockchain Details</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-0.5"
                        >
                          <Info className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-sm">
                          Technical blockchain details for this proposal.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h4>

                <div className="space-y-4">
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
              <>
                <div
                  className={`rounded-lg border p-4 ${
                    proposal.passed
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <h4 className="font-medium text-base mb-3 flex items-center gap-2">
                    {proposal.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>Execution Details</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-0.5"
                          >
                            <Info className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-sm">
                            Details about the execution of this proposal.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>

                  <div className="space-y-2">
                    <p className="text-sm">
                      {proposal.passed
                        ? "This proposal has passed and " +
                          (proposal.executed === true
                            ? "has been executed."
                            : "is pending execution.")
                        : "This proposal has failed and will not be executed."}
                    </p>

                    {proposal.concluded_by && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Concluded by:
                        </span>
                        <a
                          href={getExplorerLink(
                            "address",
                            proposal.concluded_by
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {truncateString(proposal.concluded_by, 6, 4)}
                        </a>
                      </div>
                    )}

                    {proposal.executed === true && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <ChevronRight className="h-4 w-4 mr-1" />
                        View Execution Transaction
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
