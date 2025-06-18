import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { getProposalStatus } from "@/utils/proposal";
import type { ProposalWithDAO } from "@/types";

interface ProposalDisplayProps {
  proposal: ProposalWithDAO | null;
  selectedProposalId: string;
}

export default function ProposalDisplay({
  proposal,
  selectedProposalId,
}: ProposalDisplayProps) {
  if (proposal) {
    const status = getProposalStatus(proposal);
    const isPassed = status === "PASSED";
    const isFailed = status === "FAILED";
    const isCompleted = isPassed || isFailed;

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Proposal Details
        </h2>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6 space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {proposal.proposal_id
                ? `#${proposal.proposal_id}: ${proposal.title}`
                : proposal.title}
            </h3>

            {/* Status Badge */}
            {isCompleted && (
              <div className="flex items-center gap-2 mb-3">
                {isPassed ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-500/10 border border-green-500/20 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Passed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-500/10 border border-red-500/20 text-red-500">
                    <XCircle className="h-4 w-4" />
                    Failed
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {proposal.summary && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Summary
              </h4>
              <p className="text-foreground text-base leading-relaxed">
                {proposal.summary}
              </p>
            </div>
          )}

          {/* Content */}
          {proposal.content && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Content
              </h4>
              <div className="bg-muted/20 border border-muted/30 rounded-lg p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {proposal.content}
                </pre>
              </div>
            </div>
          )}

          {/* DAO Info */}
          {proposal.daos?.name && (
            <div className="pt-4 border-t border-border/30">
              <p className="text-sm text-muted-foreground">
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
      <div className="bg-muted/20 border border-muted/30 rounded-xl p-8 text-center">
        <p className="text-muted-foreground text-base">
          Please select a proposal to view its details
        </p>
      </div>
    );
  }

  return null;
}
