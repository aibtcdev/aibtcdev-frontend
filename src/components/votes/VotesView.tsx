"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Vote,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle,
  Clock,
  Ban,
  Activity,
  TrendingUp,
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
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useClipboard } from "@/hooks/useClipboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Vote as VoteType } from "@/types";
import { DAOVetoProposal } from "@/components/proposals/DAOVetoProposal";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import Link from "next/link";

interface VotesViewProps {
  votes: VoteType[];
}

interface VoteCardProps {
  vote: VoteType;
  copiedText: string | null;
  copyToClipboard: (text: string) => void;
  currentBitcoinHeight: number;
}

type TabType = "evaluation" | "voting" | "veto" | "passed" | "failed";

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

// Helper function to get explorer URL for transaction
const getExplorerUrl = (txId: string) => {
  const baseUrl = "https://explorer.hiro.so/txid";
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  return `${baseUrl}/${txId}${isTestnet ? "?chain=testnet" : ""}`;
};

function VoteCard({
  vote,
  copiedText,
  copyToClipboard,
  currentBitcoinHeight,
}: VoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          variant="outline"
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
    if (vote.voted === false) return null;

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
          vote.answer
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}
      >
        {vote.answer ? (
          <>
            <ThumbsUp className="h-3 w-3" />
            Voted Yes
          </>
        ) : (
          <>
            <ThumbsDown className="h-3 w-3" />
            Voted No
          </>
        )}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header Row - Compact and Functional */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Vote className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-foreground truncate">
                    {vote.dao_name}
                  </p>
                  {getStatusBadge()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(vote.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getVoteResult()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Proposal Title - Prominent but Concise */}
          <div className="py-2">
            <h3
              className="text-base font-medium text-foreground leading-snug line-clamp-2"
              title={vote.proposal_title}
            >
              {vote.proposal_title}
            </h3>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Link
                href={`/proposals/${vote.proposal_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary h-7 px-2 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View Proposal
                  <ExternalLink className="h-2 w-2 ml-1" />
                </Button>
              </Link>

              {vote.tx_id && (
                <Link
                  href={getExplorerUrl(vote.tx_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary h-7 px-2 text-xs"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Explorer
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {vote.confidence !== null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(vote.confidence * 100)}% confidence
                </span>
              )}

              {vote.dao_id &&
                vote.proposal_id &&
                isInVetoWindow(vote, currentBitcoinHeight) && (
                  <DAOVetoProposal
                    daoId={vote.dao_id}
                    proposalId={vote.proposal_id}
                    size="sm"
                    variant="outline"
                  />
                )}
            </div>
          </div>

          {/* Expanded Details - Clean and Organized */}
          {isExpanded && (
            <div className="pt-3 space-y-3 border-t border-border/30">
              {/* Key Information Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {vote.amount !== null && vote.amount !== "0" && (
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      Vote Amount
                    </div>
                    <div className="text-sm font-medium">{vote.amount}</div>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Proposal ID
                  </div>
                  <div className="text-sm font-medium">{vote.proposal_id}</div>
                </div>

                {vote.vote_start && (
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      Vote Start
                    </div>
                    <div className="text-sm font-medium">
                      {safeNumberFromBigInt(vote.vote_start)}
                    </div>
                  </div>
                )}

                {vote.vote_end && (
                  <div className="bg-muted/50 rounded-lg p-2">
                    <div className="text-xs text-muted-foreground mb-1">
                      Vote End
                    </div>
                    <div className="text-sm font-medium">
                      {safeNumberFromBigInt(vote.vote_end)}
                    </div>
                  </div>
                )}
              </div>

              {/* Proposal Context */}
              {vote.prompt && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Proposal Context</h4>
                    <div className="flex items-center gap-1">
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
                            <DialogTitle>Proposal Context</DialogTitle>
                          </DialogHeader>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{vote.prompt}</ReactMarkdown>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vote.prompt || "")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedText === vote.prompt ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {(vote.prompt || "").substring(0, 200)}
                    {(vote.prompt || "").length > 200 && "..."}
                  </div>
                </div>
              )}

              {/* Reasoning - Compact Preview */}
              {vote.reasoning && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Reasoning</h4>
                    <div className="flex items-center gap-1">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vote.reasoning || "")}
                        className="h-6 w-6 p-0"
                      >
                        {copiedText === vote.reasoning ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {(vote.reasoning || "").substring(0, 200)}
                    {(vote.reasoning || "").length > 200 && "..."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompactMetrics({ votes }: { votes: VoteType[] }) {
  const totalVotes = votes.length;
  const yesVotes = votes.filter((vote) => vote.answer === true).length;
  const noVotes = votes.filter((vote) => vote.answer === false).length;
  const uniqueDAOs = new Set(votes.map((vote) => vote.dao_name)).size;
  const uniqueProposals = new Set(votes.map((vote) => vote.proposal_id)).size;

  const metrics = [
    { label: "Total", value: totalVotes, icon: Activity },
    { label: "Yes", value: yesVotes, icon: ThumbsUp },
    { label: "No", value: noVotes, icon: ThumbsDown },
    { label: "DAOs", value: uniqueDAOs, icon: Vote },
    { label: "Proposals", value: uniqueProposals, icon: TrendingUp },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-3 bg-muted/30 rounded-lg">
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex items-center gap-2 text-sm">
          <metric.icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{metric.value}</span>
          <span className="text-muted-foreground">{metric.label}</span>
          {index < metrics.length - 1 && (
            <div className="w-px h-4 bg-border/50 ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export function VotesView({ votes }: VotesViewProps) {
  const { copyToClipboard, copiedText } = useClipboard();

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

  // Determine default tab based on available votes using useCallback
  const getDefaultTab = useCallback((): TabType => {
    const evaluationCount = votes.filter((vote) => vote.voted === false).length;
    if (evaluationCount > 0) return "evaluation";

    const votingCount = votes.filter((vote) => {
      if (vote.voted !== true) return false;
      if (!vote.vote_start || !vote.vote_end) return false;
      const voteStart = safeNumberFromBigInt(vote.vote_start);
      const voteEnd = safeNumberFromBigInt(vote.vote_end);
      return (
        currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd
      );
    }).length;
    if (votingCount > 0) return "voting";

    return "passed";
  }, [votes, currentBitcoinHeight]);

  const [activeTab, setActiveTab] = useState<TabType>(getDefaultTab());

  // Update activeTab when votes or currentBitcoinHeight changes
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [getDefaultTab]);

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

      default:
        return votes;
    }
  }, [votes, activeTab, currentBitcoinHeight]);

  const getTabCount = (tab: TabType): number => {
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
            currentBitcoinHeight >= voteStart && currentBitcoinHeight <= voteEnd
          );
        }).length;
      case "veto":
        return votes.filter((vote) => {
          if (vote.voted !== true) return false;
          if (!vote.vote_end || !vote.exec_start) return false;
          const voteEnd = safeNumberFromBigInt(vote.vote_end);
          const execStart = safeNumberFromBigInt(vote.exec_start);
          return (
            currentBitcoinHeight > voteEnd && currentBitcoinHeight <= execStart
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
      default:
        return votes.length;
    }
  };

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
      default:
        return Vote;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
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

        {/* Compact Metrics */}
        <CompactMetrics votes={filteredVotes} />

        {/* Tab Navigation */}
        <div className="flex items-center justify-center">
          <div className="flex items-center p-1 bg-muted/50 rounded-lg">
            {(
              ["evaluation", "voting", "veto", "passed", "failed"] as TabType[]
            ).map((tab) => {
              const Icon = getTabIcon(tab);
              const isActive = activeTab === tab;
              const tabCount = getTabCount(tab);

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{getTabTitle(tab)}</span>
                  <span className="text-xs opacity-70">({tabCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {filteredVotes.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  {(() => {
                    const Icon = getTabIcon(activeTab);
                    return <Icon className="h-6 w-6 text-muted-foreground" />;
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
                  {activeTab === "passed" && "No proposals have passed yet."}
                  {activeTab === "failed" && "No proposals have failed yet."}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-foreground">
                    {getTabTitle(activeTab)} ({filteredVotes.length})
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {filteredVotes.length === 1
                    ? "1 proposal"
                    : `${filteredVotes.length} proposals`}{" "}
                  in this stage
                </p>
              </div>

              <div className="space-y-3">
                {filteredVotes.map((vote) => (
                  <VoteCard
                    key={vote.id}
                    vote={vote}
                    copiedText={copiedText}
                    copyToClipboard={copyToClipboard}
                    currentBitcoinHeight={currentBitcoinHeight}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
