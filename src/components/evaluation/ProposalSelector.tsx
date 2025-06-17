import React from "react";
import { ChevronDown } from "lucide-react";
import type { ProposalWithDAO } from "@/types";

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

  return (
    <div className="space-y-3">
      <label
        htmlFor="proposal-select"
        className="block text-lg font-semibold text-foreground"
      >
        Select Proposal
      </label>
      <div className="relative">
        <select
          id="proposal-select"
          value={selectedProposalId}
          onChange={(e) => handleProposalSelect(e.target.value)}
          className="w-full p-3 pr-10 text-base bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none cursor-pointer hover:border-border/60 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          <option value="">Choose a proposal to evaluate...</option>
          {proposals.map((proposal) => (
            <option key={proposal.id} value={proposal.id}>
              {proposal.proposal_id ? `#${proposal.proposal_id}: ` : ""}
              {proposal.title || "Untitled Proposal"}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      </div>
      {proposals.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No proposals available for evaluation.
        </p>
      )}
    </div>
  );
}
