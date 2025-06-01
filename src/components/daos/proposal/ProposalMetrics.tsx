"use client";

import { CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { useVotingStatus } from "./TimeStatus";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
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
    proposal.vote_start,
    proposal.vote_end,
  );

  // Check if the proposal has failed
  const isFailed = isEnded && !proposal.passed;

  const isNotStartedYet = !isActive && !isEnded;

  // Improved metrics display with better spacing and layout
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Liquid Tokens - Spans 2 columns */}
      <div className="lg:col-span-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors p-4 rounded-lg cursor-pointer border border-zinc-700/50">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
                      Liquid Tokens
                    </span>
                    <Info className="h-3 w-3 text-zinc-500" />
                  </div>
                  <div className="text-lg font-semibold text-white">
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
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                Total liquid tokens available for voting
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Quorum - Single column */}
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "p-4 rounded-lg cursor-pointer border transition-colors",
                  isActive || isNotStartedYet
                    ? "bg-orange-500/10 border-orange-500/30"
                    : proposal.met_quorum
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30",
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
                      Quorum
                    </span>
                    <Info className="h-3 w-3 text-zinc-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive || isNotStartedYet ? (
                      <>
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">
                          Pending
                        </span>
                      </>
                    ) : proposal.met_quorum ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">
                          Met
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">
                          Missed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Minimum participation required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Threshold - Single column */}
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "p-4 rounded-lg cursor-pointer border transition-colors",
                  isActive || isNotStartedYet
                    ? "bg-orange-500/10 border-orange-500/30"
                    : proposal.met_threshold
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30",
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
                      Threshold
                    </span>
                    <Info className="h-3 w-3 text-zinc-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive || isNotStartedYet ? (
                      <>
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">
                          Pending
                        </span>
                      </>
                    ) : proposal.met_threshold ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">
                          Met
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">
                          Missed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Minimum approval percentage required</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Execution Status - Single column */}
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "p-4 rounded-lg cursor-pointer border transition-colors",
                  isActive || isNotStartedYet
                    ? "bg-orange-500/10 border-orange-500/30"
                    : isFailed
                      ? "bg-red-500/10 border-red-500/30"
                      : proposal.executed === true
                        ? "bg-green-500/10 border-green-500/30"
                        : proposal.executed === false
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-amber-500/10 border-amber-500/30",
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
                      Execution
                    </span>
                    <Info className="h-3 w-3 text-zinc-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive || isNotStartedYet ? (
                      <>
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">
                          Pending
                        </span>
                      </>
                    ) : isFailed ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">
                          Failed
                        </span>
                      </>
                    ) : proposal.executed === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">
                          Executed
                        </span>
                      </>
                    ) : proposal.executed === false ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-sm font-semibold text-red-400">
                          Not Executed
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-400">
                          Pending
                        </span>
                      </>
                    )}
                  </div>
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
