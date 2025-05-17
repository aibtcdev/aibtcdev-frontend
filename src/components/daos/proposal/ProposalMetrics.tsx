"use client";

import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";
import { TokenBalance } from "@/components/reusables/balance-display";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/types/supabase";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics = ({ proposal }: ProposalMetricsProps) => {
  const { isActive, isEnded, startBlockTime } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Check if voting has not started yet (start block not found)
  const votingNotStarted = startBlockTime === null;

  // Check if the proposal has failed
  const isFailed = isEnded && !proposal.passed;

  // Simplified metrics display without borders
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
      {/* Liquid Tokens */}
      <div className="bg-zinc-800/30 rounded-md px-3 py-2">
        <div className="text-xs text-muted-foreground mb-1">Liquid Tokens</div>
        <div className="font-medium text-sm">
          {proposal.liquid_tokens !== null ? (
            <TokenBalance
              value={proposal.liquid_tokens.toString()}
              symbol={proposal.token_symbol || ""}
              decimals={8}
              variant="abbreviated"
            />
          ) : (
            "No data"
          )}
        </div>
      </div>

      {/* Quorum */}
      <div
        className={cn(
          "rounded-md px-3 py-2",
          votingNotStarted || isActive
            ? "bg-primary"
            : proposal.met_quorum
            ? "bg-primary"
            : "bg-zinc-800/50"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Quorum</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium ">Pending</span>
          ) : proposal.met_quorum ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 " />
              <span className="font-medium ">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold */}
      <div
        className={cn(
          "rounded-md px-3 py-2",
          votingNotStarted || isActive
            ? "bg-primary"
            : proposal.met_threshold
            ? "bg-primary"
            : "bg-zinc-800/50"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Threshold</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium ">Pending</span>
          ) : proposal.met_threshold ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 " />
              <span className="font-medium ">Met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Not Met</span>
            </div>
          )}
        </div>
      </div>

      {/* Outcome */}
      <div
        className={cn(
          "rounded-md px-3 py-2",
          votingNotStarted || isActive
            ? "bg-primary"
            : proposal.passed
            ? "bg-primary"
            : "bg-zinc-800/50"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Outcome</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium ">Pending</span>
          ) : proposal.passed ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 " />
              <span className="font-medium ">Passed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Status */}
      <div
        className={cn(
          "rounded-md px-3 py-2",
          votingNotStarted || isActive
            ? "bg-primary"
            : isFailed
            ? "bg-zinc-800/50"
            : proposal.executed === true
            ? "bg-primary"
            : "bg-amber-500/5"
        )}
      >
        <div className="text-xs text-muted-foreground mb-1">Execution</div>
        <div className="flex items-center text-sm">
          {votingNotStarted || isActive ? (
            <span className="font-medium ">Pending</span>
          ) : isFailed ? (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Failed</span>
            </div>
          ) : proposal.executed === true ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 " />
              <span className="font-medium ">Executed</span>
            </div>
          ) : proposal.executed === false ? (
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-400">Not Executed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-medium text-amber-500">Pending</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProposalMetrics;
