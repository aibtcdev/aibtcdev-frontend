"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ThumbsUp,
  ThumbsDown,
  Vote,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Vote as VoteType } from "@/types";
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  currentBitcoinHeight: number;
}

type TabType = "evaluation" | "voting" | "veto" | "passed" | "failed" | "all";

// Helper function to format time in a compact way
const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return `${Math.floor(seconds)}s ago`;
};

// Helper function to safely convert bigint to number for comparison
const safeNumberFromBigInt = (value: bigint | null): number => {
  if (value === null) return 0;
  // Handle potential overflow for very large bigint values
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number(value);
};

// Helper function to check if a vote is in the veto window
const isInVetoWindow = (
  vote: VoteType,
  currentBitcoinHeight: number
): boolean => {
  if (vote.voted === false) return false;
  if (!vote.vote_end || !vote.exec_start) return false;

  const voteEnd = safeNumberFromBigInt(vote.vote_end);
  const execStart = safeNumberFromBigInt(vote.exec_start);

  return currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart;
};

// Helper function to check if a vote has passed or failed
const getVoteOutcome = (
  vote: VoteType,
  currentBitcoinHeight: number
): "passed" | "failed" | "pending" => {
  if (vote.voted !== true) return "pending";
  if (!vote.exec_end) return "pending";

  const execEnd = safeNumberFromBigInt(vote.exec_end);
  if (currentBitcoinHeight <= execEnd) return "pending";

  // Determine if vote passed based on the answer
  return vote.answer ? "passed" : "failed";
};

function VoteCard({ vote, currentBitcoinHeight }: VoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.75) return "bg-green-500";
    if (confidence > 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusBadge = () => {
    if (vote.voted === false) {
      return (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20"
        >
          <Search className="h-3 w-3 mr-1" />
          Evaluating
        </Badge>
      );
    }

    if (isInVetoWindow(vote, currentBitcoinHeight)) {
      return (
        <Badge
          variant="destructive"
          className="bg-secondary/10 text-secondary border-secondary/20"
        >
          <Ban className="h-3 w-3 mr-1" />
          Veto Period
        </Badge>
      );
    }

    const outcome = getVoteOutcome(vote, currentBitcoinHeight);
    if (outcome === "passed") {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    } else if (outcome === "failed") {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-primary/10 text-primary border-primary/20"
      >
        <Clock className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const getVoteResult = () => {
    if (vote.voted === false) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <span>AI Agent is evaluating...</span>
        </div>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="flex items-center gap-2 text-sm">
            {vote.answer ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-medium">Voted Yes</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-600">
                <ThumbsDown className="h-4 w-4" />
                <span className="font-medium">Voted No</span>
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent>
            Your AI agent votes on your behalf based on predefined preferences.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/60 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold text-foreground leading-snug mb-2"
              title={vote.proposal_title}
            >
              {vote.proposal_title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <p className="font-medium text-xs text-foreground truncate">
                {vote.dao_name}
              </p>
              {getStatusBadge()}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(vote.created_at)}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-7 w-7"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            {getVoteResult()}
            <div className="flex items-center gap-2">
              <Link
                href={`/proposals/${vote.proposal_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View
                </Button>
              </Link>
              {vote.dao_id &&
                vote.proposal_id &&
                isInVetoWindow(vote, currentBitcoinHeight) && (
                  <DAOVetoProposal
                    daoId={vote.dao_id}
                    proposalId={vote.proposal_id}
                    size="sm"
                    variant="destructive"
                  />
                )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="pt-3 mt-3 space-y-3 border-t border-border/30">
            {/* Key Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-2">
                <div className="text-xs text-muted-foreground mb-1">
                  Proposal ID
                </div>
                <div className="text-sm font-medium">{vote.proposal_id}</div>
              </div>

              {vote.vote_start && (
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Vote Start Block
                  </div>
                  <div className="text-sm font-medium">
                    {safeNumberFromBigInt(vote.vote_start)}
                  </div>
                </div>
              )}

              {vote.vote_end && (
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Vote End Block
                  </div>
                  <div className="text-sm font-medium">
                    {safeNumberFromBigInt(vote.vote_end)}
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning - Compact Preview */}
            {vote.reasoning && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">AI Agent Reasoning</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        Read Full
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Vote Reasoning</DialogTitle>
                      </DialogHeader>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{vote.reasoning}</ReactMarkdown>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {vote.reasoning}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {vote.confidence !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="w-full">
              <Progress
                value={vote.confidence * 100}
                className="h-1 rounded-none bg-muted/50"
                indicatorClassName={getConfidenceColor(vote.confidence)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {Math.round(vote.confidence * 100)}% confidence in this vote.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </Card>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch current Bitcoin block height
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const currentBitcoinHeight = chainState?.bitcoin_block_height
    ? Number.parseInt(chainState.bitcoin_block_height)
    : 0;

  const getTabCount = useCallback(
    (tab: TabType): number => {
      switch (tab) {
        case "evaluation":
          return votes.filter((vote) => vote.voted === false).length;
        case "voting":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_start || !vote.vote_end) return false;
            const voteStart = safeNumberFromBigInt(vote.vote_start);
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            return (
              currentBitcoinHeight >= voteStart &&
              currentBitcoinHeight <= voteEnd
            );
          }).length;
        case "veto":
          return votes.filter((vote) => {
            if (vote.voted !== true) return false;
            if (!vote.vote_end || !vote.exec_start) return false;
            const voteEnd = safeNumberFromBigInt(vote.vote_end);
            const execStart = safeNumberFromBigInt(vote.exec_start);
            return (
              currentBitcoinHeight > voteEnd &&
              currentBitcoinHeight <= execStart
            );
          }).length;
        case "passed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "passed"
          ).length;
        case "failed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "failed"
          ).length;
        case "all":
        default:
          return votes.length;
      }
    },
    [votes, currentBitcoinHeight]
  );

  // Determine default tab based on available votes using useCallback
  const getDefaultTab = useCallback((): TabType => {
    if (getTabCount("veto") > 0) return "veto";
    if (getTabCount("voting") > 0) return "voting";
    if (getTabCount("evaluation") > 0) return "evaluation";

    // If there are any passed votes, show them, otherwise show all.
    if (getTabCount("passed") > 0) return "passed";
    if (votes.length > 0) return "all";

    return "evaluation"; // Default if no votes at all
  }, [getTabCount, votes.length]);

  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab());

  // Update activeTab when votes or currentBitcoinHeight changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [getDefaultTab]);

  // Reset pagination when tab changes
  useEffect(() => {
    setVisibleCount(10);
  }, [activeTab]);

  // Filter votes based on tab with block height logic
  const filteredVotes = useMemo(() => {
    switch (activeTab) {
      case "evaluation":
        return votes.filter((vote) => vote.voted === false);

      case "voting":
        return votes.filter((vote) => {
          if (vote.voted !== true) return false;
          if (!vote.vote_start || !vote.vote_end) return false;

          const voteStart = safeNumberFromBigInt(vote.vote_start);
          const voteEnd = safeNumberFromBigInt(vote.vote_end);

          return (
            currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd
          );
        });

      case "veto":
        return votes.filter((vote) => {
          if (vote.voted !== true) return false;
          if (!vote.vote_end || !vote.exec_start) return false;

          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          const execStart = safeNumberFromBigInt(vote.exec_start);

          return (
            currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart
          );
        });

      case "passed":
        return votes.filter((vote) => {
          const outcome = getVoteOutcome(vote, currentBitcoinHeight);
          return outcome === "passed";
        });

      case "failed":
        return votes.filter((vote) => {
          const outcome = getVoteOutcome(vote, currentBitcoinHeight);
          return outcome === "failed";
        });

      case "all":
      default:
        return votes;
    }
  }, [votes, activeTab, currentBitcoinHeight]);

  const paginatedVotes = filteredVotes.slice(0, visibleCount);

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case "evaluation":
        return "Evaluation";
      case "voting":
        return "Active Voting";
      case "veto":
        return "Veto Period";
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      case "all":
      default:
        return "All Votes";
    }
  };

  const getTabTooltipContent = (tab: TabType): string => {
    switch (tab) {
      case "evaluation":
        return "Proposals being assessed by AI agents for feasibility and alignment.";
      case "voting":
        return "Proposals currently open for voting by DAO members.";
      case "veto":
        return "A time window to challenge and potentially overturn a passed vote.";
      case "passed":
        return "Proposals that have been approved by voters.";
      case "failed":
        return "Proposals that have been rejected by voters.";
      case "all":
        return "View all proposals regardless of their status.";
      default:
        return "";
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "evaluation":
        return Search;
      case "voting":
        return Clock;
      case "veto":
        return Ban;
      case "passed":
        return CheckCircle;
      case "failed":
        return XCircle;
      case "all":
      default:
        return Vote;
    }
  };

  const tabs: TabType[] = [
    "evaluation",
    "voting",
    "veto",
    "passed",
    "failed",
    "all",
  ];

  const renderSidebar = (isMobile = false) => {
    if (isMobile) {
      return (
        <div className="md:hidden mb-4">
          <Select
            onValueChange={(value: TabType) => setActiveTab(value)}
            defaultValue={activeTab}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => {
                const tabCount = getTabCount(tab);
                if (tab === "all" && votes.length === 0) return null;
                return (
                  <SelectItem key={tab} value={tab}>
                    {getTabTitle(tab)} ({tabCount})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <aside className="hidden md:block">
        <h2 className="text-lg font-semibold mb-4 pl-2">Navigation</h2>
        <TooltipProvider>
          <nav className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;
              const tabCount = getTabCount(tab);
              const hasActionableItems =
                (tab === "veto" || tab === "voting") && tabCount > 0;

              if (tab === "all" && votes.length === 0) return null;

              return (
                <Tooltip key={tab} delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : `hover:bg-muted/50 ${
                              hasActionableItems
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          tab === "veto" && tabCount > 0 && !isActive
                            ? "animate-pulse text-secondary"
                            : ""
                        }`}
                      />
                      <span className="flex-1 text-left">
                        {getTabTitle(tab)}
                      </span>
                      {tabCount > 0 && (
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className="h-5"
                        >
                          {tabCount}
                        </Badge>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{getTabTooltipContent(tab)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
      </aside>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[2400px] mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Vote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Voting Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your governance participation
              {chainState?.bitcoin_block_height && (
                <span className="ml-2 text-primary">
                  • Block {chainState.bitcoin_block_height}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="md:grid md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 mt-6">
          {renderSidebar()}
          <main>
            {renderSidebar(true)}

            {/* Content */}
            <div className="space-y-4">
              {filteredVotes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      {(() => {
                        const Icon = getTabIcon(activeTab);
                        return (
                          <Icon className="h-6 w-6 text-muted-foreground" />
                        );
                      })()}
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No {getTabTitle(activeTab).toLowerCase()} found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {activeTab === "evaluation" &&
                        "All proposals have moved beyond evaluation."}
                      {activeTab === "voting" &&
                        "No proposals are currently open for voting."}
                      {activeTab === "veto" &&
                        "No proposals are in the veto window."}
                      {activeTab === "passed" &&
                        "No proposals have passed yet."}
                      {activeTab === "failed" &&
                        "No proposals have failed yet."}
                    </p>
                    <Link href="/proposals">
                      <Button variant="outline" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Browse Proposals
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedVotes.map((vote) => (
                      <VoteCard
                        key={vote.id}
                        vote={vote}
                        currentBitcoinHeight={currentBitcoinHeight}
                      />
                    ))}
                  </div>

                  {filteredVotes.length > visibleCount && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount((prev) => prev + 10)}
                      >
                        Show More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
