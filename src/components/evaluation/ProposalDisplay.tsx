import React from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
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
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Proposal Details
        </h2>
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-1">
          <ProposalCard
            proposal={proposal}
            showDAOInfo={true}
            tokenSymbol={proposal.daos?.name || ""}
          />
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
