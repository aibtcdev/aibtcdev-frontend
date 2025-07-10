"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProposalVotes } from "@/services/vote.service";
import { fetchLatestChainState } from "@/services/chain-state.service";
import {
  // BalanceDisplay,
  TokenBalance,
} from "@/components/reusables/BalanceDisplay";
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { safeNumberFromBigInt } from "@/utils/proposal";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useVotingStatus } from "@/hooks/useVotingStatus";

interface VotingProgressChartProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
  contractPrincipal?: string; // Added this prop for the contract principal
}

const VotingProgressChart = ({
  proposal,
  tokenSymbol = "",
  contractPrincipal, // New prop
}: VotingProgressChartProps) => {
  console.log("VotingProgressChart props:", {
    proposal,
    tokenSymbol,
    contractPrincipal,
  });
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end)
  );
  console.log("isActive, isEnded:", isActive, isEnded);

  // State to store parsed vote values from live data
  const [parsedVotes, setParsedVotes] = useState({
    votesFor: proposal.votes_for ? proposal.votes_for.replace(/n$/, "") : "0",
    votesAgainst: proposal.votes_against
      ? proposal.votes_against.replace(/n$/, "")
      : "0",
  });
  console.log("parsedVotes state:", parsedVotes);

  // Fetch live vote data with real-time updates using getProposalVotes
  const proposalId = proposal.id;

  const { data: proposalVoteData } = useQuery({
    queryKey: ["proposalVotes", proposalId, contractPrincipal],
    queryFn: async () => {
      if (proposalId && contractPrincipal) {
        return getProposalVotes(contractPrincipal, proposalId);
      }
      return null;
    },
    enabled: !!proposalId && !!contractPrincipal,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fresh data for real-time updates
    refetchInterval: false, // Disable polling since we have real-time updates
  });

  // Fetch current chain state to check execution deadline
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Update vote totals from the getProposalVotes response
  useEffect(() => {
    console.log("proposalVoteData:", proposalVoteData);
    if (proposalVoteData) {
      // Use the parsed vote data from getProposalVotes
      setParsedVotes({
        votesFor: proposalVoteData.votesFor || "0",
        votesAgainst: proposalVoteData.votesAgainst || "0",
      });
    } else {
      // If no vote data, fall back to proposal data
      setParsedVotes({
        votesFor: proposal.votes_for
          ? proposal.votes_for.replace(/n$/, "")
          : "0",
        votesAgainst: proposal.votes_against
          ? proposal.votes_against.replace(/n$/, "")
          : "0",
      });
    }
  }, [proposalVoteData, proposal.votes_for, proposal.votes_against]);

  const calculations = useMemo(() => {
    const votesFor = Number(parsedVotes.votesFor || 0);
    const votesAgainst = Number(parsedVotes.votesAgainst || 0);
    const totalVotes = votesFor + votesAgainst;
    const liquidTokens = Number(proposal.liquid_tokens || 0);
    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum); // Already a percentage (e.g., 20 = 20%)
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold); // Already a percentage (e.g., 60 = 60%)

    // Calculate percentages based on liquid tokens
    const participationRate =
      liquidTokens > 0 ? (totalVotes / liquidTokens) * 100 : 0;
    const quorumRate = quorumPercentage; // Already a percentage

    // Calculate approval rate from cast votes
    const approvalRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
    const thresholdRate = thresholdPercentage; // Already a percentage

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

    console.log("calculations:", {
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
  }, [proposal, parsedVotes, chainState]);

  // Rest of the component remains the same...
  const getStatusText = (
    met: boolean,
    isActive: boolean,
    isEnded: boolean,
    percentage?: number
  ) => {
    if (isActive) {
      return percentage !== undefined
        ? `Pending (${percentage.toFixed(1)}%)`
        : "Pending";
    }

    if (!isEnded) {
      return "Not Started";
    }

    return met ? "Met" : "Missed";
  };

  const getStatusColor = (
    met: boolean,
    isActive: boolean,
    isEnded: boolean
  ) => {
    if (isActive) return "text-orange-400";
    if (!isEnded) return "text-gray-400"; // Not started
    return met ? "text-green-400" : "text-red-400";
  };

  const getStatusIcon = (met: boolean, isActive: boolean, isEnded: boolean) => {
    if (isActive) return <Clock className="h-4 w-4" />;
    if (!isEnded) return <Clock className="h-4 w-4" />; // Not started
    return met ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : (
      <XCircle className="h-4 w-4" />
    );
  };

  // Enhanced result status logic
  const getResultStatus = () => {
    if (isActive) {
      return {
        status: "Voting in progress",
        color: "text-orange-400",
        icon: <Clock className="h-4 w-4" />,
        bgColor: "bg-orange-500/10 border-orange-500/30",
      };
    }

    if (!isEnded) {
      return {
        status: "Voting not started",
        color: "text-gray-400",
        icon: <Clock className="h-4 w-4" />,
        bgColor: "bg-gray-500/10 border-gray-500/30",
      };
    }

    if (calculations.failedToExecute) {
      return {
        status: "Failed to Execute",
        color: "text-red-400",
        icon: <AlertTriangle className="h-4 w-4" />,
        bgColor: "bg-red-500/10 border-red-500/30",
      };
    }

    if (proposal.passed) {
      return {
        status: "Passed",
        color: "text-green-400",
        icon: <CheckCircle2 className="h-4 w-4" />,
        bgColor: "bg-green-500/10 border-green-500/30",
      };
    }

    return {
      status: "Failed",
      color: "text-red-400",
      icon: <XCircle className="h-4 w-4" />,
      bgColor: "bg-red-500/10 border-red-500/30",
    };
  };

  const resultStatus = getResultStatus();
  console.log("resultStatus:", resultStatus);

  return (
    <div className="space-y-6 overflow-x-auto">
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
              <span>
                For:{" "}
                <TokenBalance
                  value={calculations.votesFor.toString()}
                  decimals={8}
                  variant="abbreviated"
                  symbol={tokenSymbol}
                />
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>
                Against:{" "}
                <TokenBalance
                  value={calculations.votesAgainst.toString()}
                  decimals={8}
                  variant="abbreviated"
                  symbol={tokenSymbol}
                />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span>
              Quorum:{" "}
              <TokenBalance
                value={calculations.quorumTokensRequired.toString()}
                decimals={8}
                variant="abbreviated"
                symbol={tokenSymbol}
              />{" "}
              ({calculations.quorumPercentage}%)
            </span>
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
              ? "bg-orange-500/10 border-orange-500/30"
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
                    {getStatusIcon(calculations.metQuorum, isActive, isEnded)}
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
                  getStatusColor(calculations.metQuorum, isActive, isEnded)
                )}
              >
                {getStatusText(
                  calculations.metQuorum,
                  isActive,
                  isEnded,
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
              ? "bg-orange-500/10 border-orange-500/30"
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
                    {getStatusIcon(
                      calculations.metThreshold,
                      isActive,
                      isEnded
                    )}
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
                  getStatusColor(calculations.metThreshold, isActive, isEnded)
                )}
              >
                {getStatusText(
                  calculations.metThreshold,
                  isActive,
                  isEnded,
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
                  <TokenBalance
                    value={calculations.totalVotes.toString()}
                    decimals={8}
                    variant="abbreviated"
                    symbol={tokenSymbol}
                  />

                  {/* <div></div> */}
                  {calculations.failedToExecute && (
                    <div className="text-orange-400">
                      ⚠️ Execution deadline passed without conclusion
                    </div>
                  )}
                  {!isActive &&
                    isEnded &&
                    !proposal.passed &&
                    !calculations.failedToExecute &&
                    calculations.metQuorum &&
                    calculations.metThreshold && (
                      <div className="text-orange-400">
                        ⚠️ Failed despite meeting quorum & threshold
                      </div>
                    )}
                </div>
              ) : (
                "No votes yet"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingProgressChart;
