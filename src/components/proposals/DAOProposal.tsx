"use client";

import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
}

const DAOProposals = ({ proposals, tokenSymbol = "" }: DAOProposalsProps) => {
  return (
    <div className="space-y-8">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          tokenSymbol={tokenSymbol}
        />
      ))}
    </div>
  );
};

export default DAOProposals;
