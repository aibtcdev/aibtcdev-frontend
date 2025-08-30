"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
// import { getProposalVotes } from "@/services/vote.service";
import { getProposalVotes } from "@/lib/vote-utils";
import { fetchLatestChainState } from "@/services/chain-state.service";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  Users,
  Target,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeNumberFromBigInt } from "@/utils/proposal";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useProposalStatus } from "@/hooks/useProposalStatus";

interface VotingProgressChartProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
  contractPrincipal?: string;
}

const VotingProgressChart = ({
  proposal,
  tokenSymbol = "",
  contractPrincipal,
}: VotingProgressChartProps) => {
  console.log("VotingProgressChart props:", {
    proposal,
    tokenSymbol,
    contractPrincipal,
  });

  // Use the new useProposalStatus hook
  const { status, statusConfig, isActive, isEnded, isPassed, isFailed } =
    useProposalStatus(proposal);

  console.log("Proposal status:", {
    status,
    isActive,
    isEnded,
    isPassed,
    isFailed,
  });

  // State to store vote values from live data
  const [voteDisplayData, setVoteDisplayData] = useState<{
    votesFor: string;
    votesAgainst: string;
    liquidTokens: string;
    rawVotesFor: string;
    rawVotesAgainst: string;
    rawLiquidTokens: string;
  } | null>(null);
  console.log(proposal.votes_for, proposal.votes_against);
  console.log("voteDisplayData state:", voteDisplayData);

  // Fetch live vote data with real-time updates using getProposalVotes
  const proposalId = Number(proposal.proposal_id);

  const { data: proposalVoteData, isLoading: isLoadingVotes } = useQuery({
    queryKey: [
      "proposalVotes",
      contractPrincipal,
      proposalId,
      isActive ? "bustCache" : "cached", // Add cache busting key for active proposals
    ],
    queryFn: async () => {
      if (!proposalId || !contractPrincipal) {
        return null;
      }
      // Bust cache if proposal is in active voting to get real-time vote counts
      const shouldBustCache = isActive;
      const result = await getProposalVotes(
        contractPrincipal,
        proposalId,
        shouldBustCache
      );
      console.log("getProposalVotes result:", result);
      return result;
    },
    enabled: !!proposalId && !!contractPrincipal,
    staleTime: isActive ? 30 * 1000 : 5 * 60 * 1000, // 30 seconds for active, 5 minutes for others
    refetchInterval: isActive ? 30 * 1000 : undefined, // Auto-refetch every 30 seconds for active proposals
    retry: 3,
  });

  // Fetch current chain state to check execution deadline
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Extract and format vote data (matching VotesView.tsx pattern)
  useEffect(() => {
    console.log("proposalVoteData update:", proposalVoteData);
    if (proposalVoteData) {
      const rawFor =
        proposalVoteData.votesFor || proposalVoteData.data?.votesFor;
      const rawAgainst =
        proposalVoteData.votesAgainst || proposalVoteData.data?.votesAgainst;
      const rawLiquidTokens =
        proposalVoteData.liquidTokens ||
        proposalVoteData.data?.liquidTokens ||
        proposal.liquid_tokens;

      if (rawFor && rawAgainst && rawLiquidTokens) {
        setVoteDisplayData({
          votesFor: formatBalance(rawFor),
          votesAgainst: formatBalance(rawAgainst),
          liquidTokens: formatBalance(rawLiquidTokens),
          rawVotesFor: rawFor,
          rawVotesAgainst: rawAgainst,
          rawLiquidTokens: rawLiquidTokens,
        });
      } else {
        setVoteDisplayData(null);
      }
    } else {
      // No live data available
      setVoteDisplayData(null);
    }
  }, [proposalVoteData, proposal.liquid_tokens]);

  // Utility function to format vote balances (matching VotesView.tsx)
  const formatBalance = useCallback(
    (value: string | number, decimals: number = 8) => {
      let num = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(num)) return "";

      num = num / Math.pow(10, decimals);

      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
      } else if (num < 1) {
        return num.toFixed(decimals).replace(/\.?0+$/, "");
      } else {
        return num.toFixed(decimals).replace(/\.?0+$/, "");
      }
    },
    []
  );

  const calculations = useMemo(() => {
    // Return null if we don't have valid vote data
    if (!voteDisplayData) {
      return null;
    }

    const votesFor = Number(voteDisplayData.rawVotesFor || 0);
    const votesAgainst = Number(voteDisplayData.rawVotesAgainst || 0);
    const totalVotes = votesFor + votesAgainst;
    const liquidTokens = Number(voteDisplayData.rawLiquidTokens || 0);
    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum);
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold);

    // Calculate percentages based on liquid tokens
    const participationRate =
      liquidTokens > 0 ? (totalVotes / liquidTokens) * 100 : 0;
    const quorumRate = quorumPercentage;

    // Calculate approval rate from cast votes
    const approvalRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
    const thresholdRate = thresholdPercentage;

    // Calculate vote breakdown percentages
    const votesForPercent =
      liquidTokens > 0 ? (votesFor / liquidTokens) * 100 : 0;
    const votesAgainstPercent =
      liquidTokens > 0 ? (votesAgainst / liquidTokens) * 100 : 0;

    // Calculate required token amounts for display
    const quorumTokensRequired =
      liquidTokens > 0 ? (liquidTokens * quorumPercentage) / 100 : 0;

    // Calculate if requirements are actually met based on current data
    const actuallyMetQuorum = participationRate >= quorumPercentage;
    const actuallyMetThreshold =
      totalVotes > 0 ? approvalRate >= thresholdPercentage : false;

    // Check if proposal failed to be concluded within execution window
    const currentBitcoinHeight = chainState?.bitcoin_block_height
      ? parseInt(chainState.bitcoin_block_height)
      : 0;
    const execEnd = safeNumberFromBigInt(proposal.exec_end);
    const concludedBy = proposal.concluded_by;
    const failedToExecute = currentBitcoinHeight > execEnd && !concludedBy;

    console.log("calculations updated:", {
      votesFor,
      votesAgainst,
      totalVotes,
      liquidTokens,
      quorumPercentage,
      thresholdPercentage,
      quorumTokensRequired,
      thresholdRate,
      participationRate,
      quorumRate,
      approvalRate,
      votesForPercent,
      votesAgainstPercent,
      actuallyMetQuorum,
      actuallyMetThreshold,
      failedToExecute,
    });

    return {
      votesFor,
      votesAgainst,
      totalVotes,
      liquidTokens,
      quorumPercentage,
      thresholdPercentage,
      quorumTokensRequired,
      thresholdRate,
      participationRate,
      quorumRate,
      approvalRate,
      votesForPercent,
      votesAgainstPercent,
      metQuorum: actuallyMetQuorum,
      metThreshold: actuallyMetThreshold,
      failedToExecute,
    };
  }, [proposal, voteDisplayData, chainState]); // Updated dependency array

  // Helper functions using the new status system
  const getStatusText = (met: boolean, percentage?: number) => {
    // If voting hasn't started (PENDING, DRAFT), show "Pending"
    if (status === "PENDING" || status === "DRAFT") {
      return "Pending";
    }

    if (isActive) {
      if (met) {
        return "Met";
      }
      return percentage !== undefined
        ? `In Progress (${percentage.toFixed(1)}%)`
        : "In Progress";
    }

    if (!isEnded) {
      return "Not Started";
    }

    return met ? "Met" : "Missed";
  };

  const getStatusColor = (met: boolean) => {
    // If voting hasn't started, use consistent pending color
    if (status === "PENDING" || status === "DRAFT") {
      return "text-gray-400";
    }

    if (isActive) return met ? "text-green-400" : "text-orange-400";
    if (!isEnded) return "text-gray-400";
    return met ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = (met: boolean) => {
    // If voting hasn't started, use clock icon
    if (status === "PENDING" || status === "DRAFT") {
      return <Clock className="h-4 w-4" />;
    }

    if (isActive)
      return met ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      );
    if (!isEnded) return <Clock className="h-4 w-4" />;
    return met ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    );
  };

  // Enhanced result status logic using the new status system
  const getResultStatus = () => {
    const StatusIcon = statusConfig.icon;

    switch (status) {
      case "DRAFT":
        return {
          status: "Draft",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "PENDING":
        return {
          status: "Pending",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "ACTIVE":
        return {
          status: "Voting in Progress",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "VETO_PERIOD":
        return {
          status: "Veto Period",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "EXECUTION_WINDOW":
        return {
          status: "Execution Window",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "PASSED":
        return {
          status: "Passed",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      case "FAILED":
        return {
          status: "Failed",
          color: statusConfig.color,
          icon: <StatusIcon className="h-4 w-4" />,
          bgColor: `${statusConfig.bg} ${statusConfig.border}`,
        };
      default:
        return {
          status: "Unknown",
          color: "text-muted-foreground",
          icon: <AlertCircle className="h-4 w-4" />,
          bgColor: "bg-muted/10 border-muted/20",
        };
    }
  };

  const resultStatus = getResultStatus();
  console.log("resultStatus:", resultStatus);

  // Show loading state if data is loading or calculations are null
  if (isLoadingVotes || !calculations) {
    return (
      <div className="space-y-6 overflow-x-auto">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          {isLoadingVotes
            ? "Loading vote data..."
            : "Processing vote information..."}
        </div>

        {/* Loading skeleton */}
        <div className="space-y-3">
          <div className="h-6 bg-muted rounded-lg animate-pulse"></div>
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border bg-muted/10">
              <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if we couldn't load vote data
  if (!voteDisplayData && !isLoadingVotes) {
    return (
      <div className="space-y-6 overflow-x-auto">
        <div className="text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Unable to load vote data. Please refresh to try again.
        </div>

        {/* Show basic proposal status without vote counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Quorum
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Data unavailable
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-muted/10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Threshold
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Data unavailable
              </div>
            </div>
          </div>

          <div
            className={cn(
              "p-4 rounded-lg border transition-colors",
              resultStatus.bgColor
            )}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                  Result
                </span>
              </div>
              <div className="flex items-center gap-2">
                {resultStatus.icon}
                <span
                  className={cn("text-sm font-semibold", resultStatus.color)}
                >
                  {resultStatus.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Vote data unavailable
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-auto">
      {/* Loading indicator for vote data */}
      {isLoadingVotes && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Updating vote data...
        </div>
      )}

      {/* Participation Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Participation: {calculations.participationRate.toFixed(1)}%
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Total votes cast vs. total liquid tokens available
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Votes for (green) */}
            <div
              className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                calculations.votesForPercent > 0 ? "rounded-l-lg" : ""
              } ${
                calculations.votesAgainstPercent === 0 &&
                calculations.votesForPercent > 0
                  ? "rounded-r-lg"
                  : ""
              }`}
              style={{
                width: `${Math.min(calculations.votesForPercent, 100)}%`,
              }}
            />
            {/* Votes against (red) */}
            <div
              className={`absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out ${
                calculations.votesAgainstPercent > 0 &&
                (calculations.votesForPercent +
                  calculations.votesAgainstPercent >=
                  100 ||
                  calculations.votesForPercent === 0)
                  ? "rounded-r-lg"
                  : ""
              } ${
                calculations.votesForPercent === 0 &&
                calculations.votesAgainstPercent > 0
                  ? "rounded-l-lg"
                  : ""
              }`}
              style={{
                width: `${Math.min(calculations.votesAgainstPercent, 100)}%`,
                left: `${Math.min(calculations.votesForPercent, 100)}%`,
              }}
            />
          </div>

          {/* Quorum line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{
              left: `calc(${Math.min(calculations.quorumRate, 100)}% - 1px)`,
            }}
          >
            <div
              className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
              style={{ left: "-5px" }}
            />
          </div>
        </div>

        {/* Vote breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>For: {voteDisplayData?.votesFor || "0"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Against: {voteDisplayData?.votesAgainst || "0"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Total: {voteDisplayData?.liquidTokens || "0"}</span>
          </div>
        </div>
      </div>

      {/* Approval Rate Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Approval Rate: {calculations.approvalRate.toFixed(1)}%
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Percentage of votes in favor out of total votes cast
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative">
          {/* Background bar */}
          <div className="h-6 bg-muted rounded-lg overflow-hidden">
            {/* Approval rate (green) */}
            <div
              className={`absolute left-0 top-0 h-full bg-green-500/80 transition-all duration-500 ease-out ${
                calculations.approvalRate > 0 ? "rounded-l-lg" : ""
              } ${calculations.approvalRate >= 95 ? "rounded-r-lg" : ""}`}
              style={{ width: `${Math.min(calculations.approvalRate, 100)}%` }}
            />
          </div>

          {/* Threshold line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{
              left: `calc(${Math.min(calculations.thresholdPercentage, 100)}% - 1px)`,
            }}
          >
            <div
              className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
              style={{ left: "-5px" }}
            />
          </div>
        </div>

        {/* Approval breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>
              Approval: {calculations.approvalRate.toFixed(1)}% of votes cast
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>Threshold: {calculations.thresholdPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Quorum Status */}
        <div
          className={cn(
            "p-4 rounded-lg border transition-colors",
            isActive
              ? calculations.metQuorum
                ? "bg-green-500/10 border-green-500/30"
                : "bg-orange-500/10 border-orange-500/30"
              : !isEnded
                ? "bg-gray-500/10 border-gray-500/30"
                : calculations.metQuorum
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Quorum
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {getStatusIcon(calculations.metQuorum)}
                  </TooltipTrigger>
                  {isActive && (
                    <TooltipContent>
                      <p className="text-xs">
                        Live voting in progress. Status will finalize once the
                        vote ends.
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span
                className={cn(
                  "text-sm font-semibold",
                  getStatusColor(calculations.metQuorum)
                )}
              >
                {getStatusText(
                  calculations.metQuorum,
                  calculations.participationRate
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Participation: {calculations.participationRate.toFixed(1)}%{" "}
              {calculations.metQuorum ? "≥" : "<"} Quorum:{" "}
              {calculations.quorumPercentage}%
            </div>
          </div>
        </div>

        {/* Threshold Status */}
        <div
          className={cn(
            "p-4 rounded-lg border transition-colors",
            isActive
              ? calculations.metThreshold
                ? "bg-green-500/10 border-green-500/30"
                : "bg-orange-500/10 border-orange-500/30"
              : !isEnded
                ? "bg-gray-500/10 border-gray-500/30"
                : calculations.metThreshold
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Threshold
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {getStatusIcon(calculations.metThreshold)}
                  </TooltipTrigger>
                  {isActive && (
                    <TooltipContent>
                      <p className="text-xs">
                        Live voting in progress. Status will finalize once the
                        vote ends.
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span
                className={cn(
                  "text-sm font-semibold",
                  getStatusColor(calculations.metThreshold)
                )}
              >
                {getStatusText(
                  calculations.metThreshold,
                  calculations.approvalRate
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Approval: {calculations.approvalRate.toFixed(1)}%{" "}
              {calculations.metThreshold ? "≥" : "<"} Threshold:{" "}
              {calculations.thresholdPercentage}%
            </div>
          </div>
        </div>

        {/* Overall Result */}
        <div
          className={cn(
            "p-4 rounded-lg border transition-colors",
            resultStatus.bgColor
          )}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Result
              </span>
            </div>
            <div className="flex items-center gap-2">
              {resultStatus.icon}
              <span className={cn("text-sm font-semibold", resultStatus.color)}>
                {resultStatus.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {calculations.totalVotes > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span>Total votes:</span>
                    <TokenBalance
                      value={calculations.totalVotes.toString()}
                      decimals={8}
                      variant="abbreviated"
                      symbol={tokenSymbol}
                    />
                  </div>

                  {/* Additional status-specific information */}
                  {status === "EXECUTION_WINDOW" && (
                    <div className="text-accent-foreground">
                      ⏳ Awaiting execution
                    </div>
                  )}
                  {status === "VETO_PERIOD" && (
                    <div className="text-accent-foreground">
                      ⏳ Veto period active
                    </div>
                  )}
                  {calculations.failedToExecute && (
                    <div className="text-destructive">
                      ⚠️ Execution deadline passed
                    </div>
                  )}
                  {status === "FAILED" &&
                    calculations.metQuorum &&
                    calculations.metThreshold && (
                      <div className="text-destructive">
                        ⚠️ Failed despite meeting requirements
                      </div>
                    )}
                </div>
              ) : (
                <span>No votes cast</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressChart;
