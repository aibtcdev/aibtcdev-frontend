"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ThumbsUp,
  ThumbsDown,
  Vote,
  Search,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  XCircle,
  ExternalLink,
  Filter,
  X,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Vote as VoteType } from "@/types";
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  currentBitcoinHeight: number;
}

interface VoteAnalysisModalProps {
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

  return vote.answer ? "passed" : "failed";
};

function VoteAnalysisModal({
  vote,
  currentBitcoinHeight,
}: VoteAnalysisModalProps) {
  // Parse contribution content and reference
  const parseContributionContent = () => {
    if (!vote.proposal_content) return { content: "", reference: null };

    const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
    const match = vote.proposal_content.match(referenceRegex);
    const referenceLink = match?.[1];
    const cleanedContent = vote.proposal_content
      .replace(referenceRegex, "")
      .trim();

    return { content: cleanedContent, reference: referenceLink };
  };

  const { content, reference } = parseContributionContent();

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold pr-8">
          Vote Analysis
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Proposal Title & DAO */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {vote.proposal_title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {vote.dao_name} • {formatRelativeTime(vote.created_at)}
          </p>
        </div>

        {/* Contribution Message */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">
            Contribution Message
          </h4>
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {content || "No contribution message available."}
            </div>
          </div>

          {reference && (
            <div className="mt-3 bg-muted/50 rounded-lg p-3">
              <h5 className="text-xs font-medium text-muted-foreground mb-2">
                Reference
              </h5>
              <a
                href={reference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 transition-colors break-all flex items-start gap-2"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="break-all">{reference}</span>
              </a>
            </div>
          )}
        </div>

        {/* Agent Vote & Actions */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div>
            <h4 className="text-sm font-semibold mb-2 text-foreground">
              Agent Vote
            </h4>
            {vote.voted === false ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Awaiting Vote</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {vote.answer ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <ThumbsUp className="h-5 w-5" />
                    <span className="font-medium">Voted Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ThumbsDown className="h-5 w-5" />
                    <span className="font-medium">Voted No</span>
                  </div>
                )}
                {vote.confidence !== null && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({Math.round(vote.confidence * 100)}% confidence)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Veto Button */}
          {vote.dao_id &&
            vote.proposal_id &&
            isInVetoWindow(vote, currentBitcoinHeight) && (
              <DAOVetoProposal
                daoId={vote.dao_id}
                proposalId={vote.proposal_id}
                size="default"
                variant="destructive"
              />
            )}
        </div>

        {/* AI Reasoning */}
        {vote.reasoning && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              AI Reasoning
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm whitespace-pre-wrap break-words text-muted-foreground leading-relaxed">
                {vote.reasoning}
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">
            Technical Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">
                Proposal ID
              </div>
              <div className="text-sm font-mono">{vote.proposal_id}</div>
            </div>

            {vote.vote_start && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Vote Start Block
                </div>
                <div className="text-sm font-mono">
                  {safeNumberFromBigInt(vote.vote_start)}
                </div>
              </div>
            )}

            {vote.vote_end && (
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Vote End Block
                </div>
                <div className="text-sm font-mono">
                  {safeNumberFromBigInt(vote.vote_end)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Link href={`/proposals/${vote.proposal_id}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              View Full Proposal
            </Button>
          </Link>
        </div>
      </div>
    </DialogContent>
  );
}

function VoteCard({ vote, currentBitcoinHeight }: VoteCardProps) {
  // No agent display needed

  const getStatusBadge = () => {
    if (vote.voted === false) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
        >
          <Clock className="h-3 w-3 mr-1" />
          Awaiting Vote
        </Badge>
      );
    }

    if (isInVetoWindow(vote, currentBitcoinHeight)) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
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
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Passed
        </Badge>
      );
    } else if (outcome === "failed") {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      >
        <Clock className="h-3 w-3 mr-1" />
        Voting
      </Badge>
    );
  };

  const getVoteResult = () => {
    if (vote.voted === false) {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <Clock className="h-4 w-4" />
          <span className="font-medium text-sm">Awaiting Vote</span>
        </div>
      );
    }

    const confidenceText =
      vote.confidence !== null
        ? ` (${Math.round(vote.confidence * 100)}% confidence)`
        : "";

    return (
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-foreground font-medium">Your agent voted</span>
        {vote.answer ? (
          <>
            <ThumbsUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-green-600 dark:text-green-400 font-medium">
              Yes
            </span>
          </>
        ) : (
          <>
            <ThumbsDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400 font-medium">
              No
            </span>
          </>
        )}
        {confidenceText && (
          <span className="text-muted-foreground ml-1">{confidenceText}</span>
        )}
      </div>
    );
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2">
              {vote.proposal_title}
            </h3>

            {/* DAO, Vote, Status */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-medium text-foreground text-sm">
                {vote.dao_name}
              </span>
              {getVoteResult()}
              {getStatusBadge()}
            </div>

            {/* Time */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(vote.created_at)}
            </div>
          </div>

          {/* Action Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <Eye className="h-4 w-4" />
                See Analysis
              </Button>
            </DialogTrigger>
            <VoteAnalysisModal
              vote={vote}
              currentBitcoinHeight={currentBitcoinHeight}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedDao, setSelectedDao] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Determine default tab based on available votes
  const getDefaultTab = useCallback((): TabType => {
    if (getTabCount("veto") > 0) return "veto";
    if (getTabCount("voting") > 0) return "voting";
    if (getTabCount("evaluation") > 0) return "evaluation";
    if (getTabCount("passed") > 0) return "passed";
    if (votes.length > 0) return "all";
    return "evaluation";
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

  // Filter votes based on tab and DAO filter
  const filteredVotes = useMemo(() => {
    const byTab = (() => {
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
              currentBitcoinHeight >= voteStart &&
              currentBitcoinHeight <= voteEnd
            );
          });
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
          });
        case "passed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "passed"
          );
        case "failed":
          return votes.filter(
            (vote) => getVoteOutcome(vote, currentBitcoinHeight) === "failed"
          );
        case "all":
        default:
          return votes;
      }
    })();

    return selectedDao
      ? byTab.filter((vote) => vote.dao_name === selectedDao)
      : byTab;
  }, [votes, activeTab, currentBitcoinHeight, selectedDao]);

  const paginatedVotes = filteredVotes.slice(0, visibleCount);

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case "evaluation":
        return "Awaiting Vote";
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

  // Get unique DAO names
  const uniqueDaoNames = useMemo(() => {
    const daoNamesSet = new Set(votes.map((v) => v.dao_name));
    return Array.from(daoNamesSet);
  }, [votes]);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Status Filters */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Status</h3>
        <div className="space-y-1">
          {tabs.map((tab) => {
            const Icon = getTabIcon(tab);
            const isActive = activeTab === tab;
            const tabCount = getTabCount(tab);
            const hasActionableItems =
              (tab === "veto" || tab === "voting") && tabCount > 0;

            if (tab === "all" && votes.length === 0) return null;

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setIsFilterOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : `hover:bg-muted/50 ${hasActionableItems ? "text-foreground" : "text-muted-foreground"}`
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    tab === "veto" && tabCount > 0 && !isActive
                      ? "animate-pulse text-red-500"
                      : ""
                  }`}
                />
                <span className="flex-1">{getTabTitle(tab)}</span>
                {tabCount > 0 && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="h-5 text-xs"
                  >
                    {tabCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* DAO Filter */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-foreground">DAO</h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              setSelectedDao(null);
              setIsFilterOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
              selectedDao === null
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted/50 text-muted-foreground"
            }`}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <div
                className={`w-2 h-2 rounded-full ${selectedDao === null ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            </div>
            <span className="flex-1">All DAOs</span>
            <Badge
              variant={selectedDao === null ? "default" : "secondary"}
              className="h-5 text-xs"
            >
              {votes.length}
            </Badge>
          </button>

          {uniqueDaoNames.map((daoName) => {
            const daoVoteCount = votes.filter(
              (vote) => vote.dao_name === daoName
            ).length;
            const isSelected = selectedDao === daoName;

            return (
              <button
                key={daoName}
                onClick={() => {
                  setSelectedDao(daoName);
                  setIsFilterOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div
                    className={`w-2 h-2 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/30"}`}
                  />
                </div>
                <span className="flex-1 truncate" title={daoName}>
                  {daoName}
                </span>
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className="h-5 text-xs"
                >
                  {daoVoteCount}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] gap-8 py-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block sticky top-6 self-start">
            <div className="bg-card rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 text-foreground">
                Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            {/* Desktop heading (hidden on mobile) */}
            <h1 className="hidden lg:block text-2xl font-semibold mb-4 text-foreground">
              Your Agent&apos;s Votes Across All DAOs
            </h1>

            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {getTabTitle(activeTab)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredVotes.length}{" "}
                  {filteredVotes.length === 1 ? "proposal" : "proposals"}
                  {selectedDao && ` from ${selectedDao}`}
                </p>
              </div>

              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filters */}
            {(activeTab !== "all" || selectedDao) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Active filters:
                </span>
                {activeTab !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {getTabTitle(activeTab)}
                    <button
                      onClick={() => setActiveTab("all")}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedDao && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedDao}
                    <button
                      onClick={() => setSelectedDao(null)}
                      className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Content */}
            {filteredVotes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const Icon = getTabIcon(activeTab);
                      return <Icon className="h-8 w-8 text-muted-foreground" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No {getTabTitle(activeTab).toLowerCase()} found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {activeTab === "evaluation" &&
                      "Your agent has already voted on every proposal."}
                    {activeTab === "voting" &&
                      "No proposals are currently open for voting."}
                    {activeTab === "veto" &&
                      "No proposals are in the veto window."}
                    {activeTab === "passed" && "No proposals have passed yet."}
                    {activeTab === "failed" && "No proposals have failed yet."}
                    {activeTab === "all" &&
                      selectedDao &&
                      `No proposals found for ${selectedDao}.`}
                    {activeTab === "all" &&
                      !selectedDao &&
                      "No proposals available."}
                  </p>
                  <Link href="/proposals">
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <FileText className="h-4 w-4" />
                      Browse All Proposals
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedVotes.map((vote) => (
                    <VoteCard
                      key={vote.id}
                      vote={vote}
                      currentBitcoinHeight={currentBitcoinHeight}
                    />
                  ))}
                </div>

                {filteredVotes.length > visibleCount && (
                  <div className="text-center pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="gap-2"
                    >
                      Load More Proposals
                      <span className="text-xs text-muted-foreground">
                        ({visibleCount} of {filteredVotes.length})
                      </span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
