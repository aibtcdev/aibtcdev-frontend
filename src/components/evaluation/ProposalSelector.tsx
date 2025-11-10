import React from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { ProposalWithDAO } from "@/types";
import { enableSingleDaoMode, singleDaoName } from "@/config/features";

interface ProposalSelectorProps {
  proposals: ProposalWithDAO[];
  selectedProposalId: string;
  onProposalSelect: (proposalId: string) => void;
  disabled?: boolean;
}

export default function ProposalSelector({
  proposals,
  selectedProposalId,
  onProposalSelect,
  disabled = false,
}: ProposalSelectorProps) {
  const handleProposalSelect = (proposalId: string) => {
    onProposalSelect(proposalId);
  };

  const filteredProposals = enableSingleDaoMode
    ? proposals.filter(
        (proposal) =>
          proposal.daos?.name?.toUpperCase() === singleDaoName.toUpperCase()
      )
    : proposals;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1 text-muted-foreground"
        title="Select Proposal"
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="relative flex-1">
        <select
          id="proposal-select"
          value={selectedProposalId}
          onChange={(e) => handleProposalSelect(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-background/50 border border-border/50 rounded-sm focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none cursor-pointer hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
          title="Choose a proposal to evaluate"
        >
          <option value="">Choose proposal...</option>
          {filteredProposals.map((proposal) => (
            <option key={proposal.id} value={proposal.id}>
              {proposal.proposal_id ? `#${proposal.proposal_id}: ` : ""}
              {proposal.title || "Untitled Proposal"}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {filteredProposals.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No proposals available for evaluation.
        </p>
      )}
    </div>
  );
}
