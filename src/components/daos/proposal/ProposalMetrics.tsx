"use client";

import type React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";
import { TokenBalance } from "@/components/reusables/balance-display";
import { cn } from "@/lib/utils";
// Update the import for the Proposal type
import type { Proposal } from "@/types/supabase";

// Replace the "any" type with the proper Proposal type
interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics: React.FC<ProposalMetricsProps> = ({ proposal }) => {
  const { isActive, isEnded, startBlockTime } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Check if voting has not started yet (start block not found)
  const votingNotStarted = startBlockTime === null;

  // Check if the proposal has failed
  const isFailed = isEnded && !proposal.passed;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {/* Liquid Tokens */}
      <div className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700/50">
        <div className="text-sm text-muted-foreground mb-1">Liquid Tokens</div>
        <div className="font-medium">
          {proposal.liquid_tokens !== null ? (
            <TokenBalance
              value={proposal.liquid_tokens.toString()}
              symbol={proposal.token_symbol || ""}
              decimals={8}
              variant="abbreviated"
            />
          ) : (
            "No data available"
          )}
        </div>
      </div>

      {/* Quorum */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 border",
          votingNotStarted || isActive
            ? "bg-blue-500/10 border-blue-500/30"
            : proposal.met_quorum
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        )}
      >
        <div className="text-sm text-muted-foreground mb-1">Quorum</div>
        <div className="flex items-center">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.met_quorum ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 border",
          votingNotStarted || isActive
            ? "bg-blue-500/10 border-blue-500/30"
            : proposal.met_threshold
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        )}
      >
        <div className="text-sm text-muted-foreground mb-1">Threshold</div>
        <div className="flex items-center">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.met_threshold ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 border",
          votingNotStarted || isActive
            ? "bg-blue-500/10 border-blue-500/30"
            : proposal.passed
            ? "bg-green-500/10 border-green-500/30"
            : "bg-red-500/10 border-red-500/30"
        )}
      >
        <div className="text-sm text-muted-foreground mb-1">Outcome</div>
        <div className="flex items-center">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : proposal.passed ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">Passed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Status */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 border",
          votingNotStarted || isActive
            ? "bg-blue-500/10 border-blue-500/30"
            : isFailed
            ? "bg-red-500/10 border-red-500/30"
            : proposal.executed === true
            ? "bg-green-500/10 border-green-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}
      >
        <div className="text-sm text-muted-foreground mb-1">Execution</div>
        <div className="flex items-center">
          {votingNotStarted || isActive ? (
            <span className="font-medium text-blue-500">Pending</span>
          ) : isFailed ? (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">Failed</span>
            </div>
          ) : proposal.executed === true ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-500">Executed</span>
            </div>
          ) : proposal.executed === false ? (
            <div className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-500">Not Executed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-amber-500">Pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
