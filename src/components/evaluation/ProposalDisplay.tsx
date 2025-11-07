"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { getProposalStatus } from "@/utils/proposal";
import type { ProposalWithDAO } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";

interface ProposalDisplayProps {
  proposal: ProposalWithDAO | null;
  selectedProposalId: string;
}

export default function ProposalDisplay({
  proposal,
  selectedProposalId,
}: ProposalDisplayProps) {
  const { data: latestChainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    refetchInterval: 30000,
  });

  const currentBlockHeight = latestChainState?.bitcoin_block_height
    ? Number(latestChainState.bitcoin_block_height)
    : null;

  if (proposal) {
    const status = getProposalStatus(proposal, currentBlockHeight);
    const isPassed = status === "PASSED";
    const isFailed = status === "FAILED";
    const isCompleted = isPassed || isFailed;

    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Proposal Details
        </h2>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-sm p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {proposal.proposal_id
                ? `#${proposal.proposal_id}: ${proposal.title}`
                : proposal.title}
            </h3>

            {/* Status Badge */}
            {isCompleted && (
              <div className="flex items-center gap-2 mb-2">
                {isPassed ? (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Passed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-500">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {proposal.summary && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Summary
              </h4>
              <p className="text-foreground text-sm leading-relaxed">
                {proposal.summary}
              </p>
            </div>
          )}

          {/* Content */}
          {proposal.content && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Content
              </h4>
              <div className="bg-muted/20 border border-muted/30 rounded-sm p-3">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {proposal.content}
                </pre>
              </div>
            </div>
          )}

          {/* DAO Info */}
          {proposal.daos?.name && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">DAO:</span> {proposal.daos.name}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedProposalId === "") {
    return (
      <div className="bg-muted/20 border border-muted/30 rounded-sm p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Please select a proposal to view its details
        </p>
      </div>
    );
  }

  return null;
}
