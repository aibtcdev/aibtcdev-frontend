"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeNumberFromBigInt } from "@/utils/proposal";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useProposalVote } from "@/hooks/useProposalVote";
import { Button } from "@/components/ui/button";

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

  // Use the consolidated vote hook
  const {
    voteDisplayData,
    calculations,
    isLoading: isLoadingVotes,
    error: voteDataError,
    hasData,
    refreshVoteData,
  } = useProposalVote({
    proposal,
    contractPrincipal,
    fallbackVotesFor: proposal.votes_for,
    fallbackVotesAgainst: proposal.votes_against,
  });

  console.log("Proposal status:", {
    status,
    isActive,
    isEnded,
    isPassed,
    isFailed,
    hasData,
    voteDataError,
  });

  // Fetch current chain state to check execution deadline
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Enhanced calculations with proposal-specific logic
  const enhancedCalculations = useMemo(() => {
    if (!calculations) return null;

    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum);
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold);

    // Calculate if requirements are met
    const metQuorum = calculations.participationRate >= quorumPercentage;
    const metThreshold =
      calculations.totalVotes > 0
        ? calculations.approvalRate >= thresholdPercentage
        : false;

    // Check execution status
    const currentBitcoinHeight = chainState?.bitcoin_block_height
      ? parseInt(chainState.bitcoin_block_height)
      : 0;
    const execEnd = safeNumberFromBigInt(proposal.exec_end);
    const concludedBy = proposal.concluded_by;
    const failedToExecute = currentBitcoinHeight > execEnd && !concludedBy;

    return {
      ...calculations,
      quorumPercentage,
      thresholdPercentage,
      metQuorum,
      metThreshold,
      failedToExecute,
    };
  }, [calculations, proposal, chainState]);

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

  // Use the refresh function from the hook
  const handleManualRefresh = refreshVoteData;

  // Show loading state if data is loading and we don't have an error
  if (isLoadingVotes && !voteDataError) {
    return (
      <div className="space-y-6 overflow-x-auto">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading vote data...
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
  if (
    (voteDataError || (!voteDisplayData && !isLoadingVotes)) &&
    !enhancedCalculations
  ) {
    return (
      <div className="space-y-6 overflow-x-auto">
        <div className="text-sm text-destructive flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed to load vote data. Please try refreshing.
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoadingVotes}
            className="h-8 px-2"
          >
            <RefreshCw
              className={`h-3 w-3 mr-1 ${isLoadingVotes ? "animate-spin" : ""}`}
            />
            Retry
          </Button>
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
                <span className="text-sm font-medium">
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

  // At this point, we know enhancedCalculations is not null due to the error check above
  if (!enhancedCalculations) {
    return null; // This should never happen due to the check above, but satisfies TypeScript
  }

  return (
    <div className="space-y-6">
      {/* Loading indicator for vote data */}
      {isLoadingVotes && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Updating vote data...
        </div>
      )}

      {/* Participation Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium break-words">
              {getStatusText(
                enhancedCalculations.metQuorum,
                enhancedCalculations.participationRate
              )}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
                enhancedCalculations.votesForPercent > 0 ? "rounded-l-lg" : ""
              } ${
                enhancedCalculations.votesAgainstPercent === 0 &&
                enhancedCalculations.votesForPercent > 0
                  ? "rounded-r-lg"
                  : ""
              }`}
              style={{
                width: `${Math.min(enhancedCalculations.votesForPercent, 100)}%`,
              }}
            />
            {/* Votes against (red) */}
            <div
              className={`absolute top-0 h-full bg-red-500/80 transition-all duration-500 ease-out ${
                enhancedCalculations.votesAgainstPercent > 0 &&
                (enhancedCalculations.votesForPercent +
                  enhancedCalculations.votesAgainstPercent >=
                  100 ||
                  enhancedCalculations.votesForPercent === 0)
                  ? "rounded-r-lg"
                  : ""
              } ${
                enhancedCalculations.votesForPercent === 0 &&
                enhancedCalculations.votesAgainstPercent > 0
                  ? "rounded-l-lg"
                  : ""
              }`}
              style={{
                width: `${Math.min(enhancedCalculations.votesAgainstPercent, 100)}%`,
                left: `${Math.min(enhancedCalculations.votesForPercent, 100)}%`,
              }}
            />
          </div>

          {/* Quorum line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{
              left: `calc(${Math.min(enhancedCalculations.quorumPercentage, 100)}% - 1px)`,
            }}
          >
            <div
              className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
              style={{ left: "-5px" }}
            />
          </div>
        </div>

        {/* Vote breakdown */}
        {!voteDisplayData ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">Failed to fetch vote data</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isLoadingVotes}
              className="h-8 px-2 text-destructive hover:text-destructive self-start sm:self-auto"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${isLoadingVotes ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                {voteDisplayData ? (
                  <span className="break-all">
                    <TokenBalance
                      value={voteDisplayData.rawVotesFor}
                      decimals={8}
                      variant="abbreviated"
                    />{" "}
                    ({enhancedCalculations.votesForPercent.toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-destructive">Failed to fetch</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                {voteDisplayData ? (
                  <span className="break-all">
                    <TokenBalance
                      value={voteDisplayData.rawVotesAgainst}
                      decimals={8}
                      variant="abbreviated"
                    />{" "}
                    ({enhancedCalculations.votesAgainstPercent.toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-destructive">Failed to fetch</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
              <span>Total: </span>
              {voteDisplayData ? (
                <span className="break-all">
                  <TokenBalance
                    value={voteDisplayData.rawLiquidTokens}
                    decimals={8}
                    variant="abbreviated"
                  />
                </span>
              ) : (
                <span className="text-destructive">Failed to fetch</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approval Rate Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm font-medium break-words">
              {getStatusText(
                enhancedCalculations.metThreshold,
                enhancedCalculations.approvalRate
              )}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
                enhancedCalculations.approvalRate > 0 ? "rounded-l-lg" : ""
              } ${enhancedCalculations.approvalRate >= 95 ? "rounded-r-lg" : ""}`}
              style={{
                width: `${Math.min(enhancedCalculations.approvalRate, 100)}%`,
              }}
            />
          </div>

          {/* Threshold line indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
            style={{
              left: `calc(${Math.min(enhancedCalculations.thresholdPercentage, 100)}% - 1px)`,
            }}
          >
            <div
              className="absolute -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background"
              style={{ left: "-5px" }}
            />
          </div>
        </div>

        {/* Approval breakdown */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <span className="break-words">
              Approval: {enhancedCalculations.approvalRate.toFixed(1)}% of votes
              cast
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            <span className="break-words">
              Threshold: {enhancedCalculations.thresholdPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Status Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quorum Status */}
        <div
          className={cn(
            "p-4 rounded-lg border transition-colors",
            isActive
              ? enhancedCalculations.metQuorum
                ? "bg-green-500/10 border-green-500/30"
                : "bg-orange-500/10 border-orange-500/30"
              : !isEnded
                ? "bg-gray-500/10 border-gray-500/30"
                : enhancedCalculations.metQuorum
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
                    {getStatusIcon(enhancedCalculations.metQuorum)}
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
                  getStatusColor(enhancedCalculations.metQuorum)
                )}
              >
                {getStatusText(
                  enhancedCalculations.metQuorum,
                  enhancedCalculations.participationRate
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {enhancedCalculations.participationRate.toFixed(1)}% of{" "}
              {enhancedCalculations.quorumPercentage}% required
            </div>
          </div>
        </div>

        {/* Threshold Status */}
        <div
          className={cn(
            "p-4 rounded-lg border transition-colors",
            isActive
              ? enhancedCalculations.metThreshold
                ? "bg-green-500/10 border-green-500/30"
                : "bg-orange-500/10 border-orange-500/30"
              : !isEnded
                ? "bg-gray-500/10 border-gray-500/30"
                : enhancedCalculations.metThreshold
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
                    {getStatusIcon(enhancedCalculations.metThreshold)}
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
                  getStatusColor(enhancedCalculations.metThreshold)
                )}
              >
                {getStatusText(
                  enhancedCalculations.metThreshold,
                  enhancedCalculations.approvalRate
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {enhancedCalculations.approvalRate.toFixed(1)}% of{" "}
              {enhancedCalculations.thresholdPercentage}% required
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
              {enhancedCalculations && enhancedCalculations.totalVotes > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span>Total votes:</span>
                    <TokenBalance
                      value={enhancedCalculations.totalVotes.toString()}
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
                  {enhancedCalculations.failedToExecute && (
                    <div className="text-destructive">
                      ⚠️ Execution deadline passed
                    </div>
                  )}
                  {status === "FAILED" &&
                    enhancedCalculations.metQuorum &&
                    enhancedCalculations.metThreshold && (
                      <div className="text-destructive">
                        ⚠️ Failed despite meeting requirements
                      </div>
                    )}
                </div>
              ) : (
                <span>No vote data available</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressChart;
