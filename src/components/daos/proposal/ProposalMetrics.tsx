"use client";

import { CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";
import { TokenBalance } from "@/components/reusables/balance-display";
import { cn } from "@/lib/utils";
import type { Proposal } from "@/types/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics = ({ proposal }: ProposalMetricsProps) => {
  const { isActive, isEnded } = useVotingStatus(
    proposal.status,
    proposal.start_block,
    proposal.end_block
  );

  // Check if the proposal has failed
  const isFailed = isEnded && !proposal.passed;

  const isNotStartedYet = !isActive && !isEnded;

  // Improved metrics display with 3-column grid
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Liquid Tokens - First column */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-zinc-900/10 p-3 rounded-md cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase tracking-wide ">
                    Liquid Tokens
                  </span>
                  <Info className="h-3 w-3 " />
                </div>
                <span className="text-sm font-medium">
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
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Total liquid tokens available for voting</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Quorum/Threshold - Second column */}
      <div className="grid grid-cols-2 gap-2">
        {/* Quorum */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-md p-3 cursor-pointer",
                  isActive || isNotStartedYet
                    ? "bg-primary"
                    : proposal.met_quorum
                    ? "bg-primary"
                    : "bg-zinc-800/50"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wide ">
                      Quorum
                    </span>
                    <Info className="h-3 w-3 " />
                  </div>
                  {isActive || isNotStartedYet ? (
                    <span className="text-sm font-medium">Pending</span>
                  ) : proposal.met_quorum ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Met</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-400">
                        Missed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Minimum participation required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Threshold */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-md p-3 cursor-pointer",
                  isActive || isNotStartedYet
                    ? "bg-primary"
                    : proposal.met_threshold
                    ? "bg-primary"
                    : "bg-zinc-800/50"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wide ">
                      Threshold
                    </span>
                    <Info className="h-3 w-3 " />
                  </div>
                  {isActive || isNotStartedYet ? (
                    <span className="text-sm font-medium">Pending</span>
                  ) : proposal.met_threshold ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Met</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-400">
                        Missed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Minimum approval percentage required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Outcome/Execution - Third column */}
      <div className="grid grid-cols-2 gap-2">
        {/* Outcome */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-md p-3 cursor-pointer",
                  isActive || isNotStartedYet
                    ? "bg-primary"
                    : proposal.passed
                    ? "bg-primary"
                    : "bg-zinc-800/50"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wide ">
                      Outcome
                    </span>
                    <Info className="h-3 w-3 " />
                  </div>
                  {isActive || isNotStartedYet ? (
                    <span className="text-sm font-medium">Pending</span>
                  ) : proposal.passed ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-400">
                        Failed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Final result of the proposal vote</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Execution Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "rounded-md p-3 cursor-pointer",
                  isActive || isNotStartedYet
                    ? "bg-primary"
                    : isFailed
                    ? "bg-zinc-800/50"
                    : proposal.executed === true
                    ? "bg-primary"
                    : "bg-amber-500/5"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wide ">
                      Execution
                    </span>
                    <Info className="h-3 w-3 " />
                  </div>
                  {isActive || isNotStartedYet ? (
                    <span className="text-sm font-medium">Pending</span>
                  ) : isFailed ? (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-400">
                        Failed
                      </span>
                    </div>
                  ) : proposal.executed === true ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">Executed</span>
                    </div>
                  ) : proposal.executed === false ? (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-400">
                        Not Executed
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">
                        Pending
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Status of proposal execution</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ProposalMetrics;
