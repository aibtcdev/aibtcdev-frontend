"use client";

import { useMemo } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
}

const DAOProposals = ({ proposals, tokenSymbol = "" }: DAOProposalsProps) => {
  // Filter out draft proposals to prevent ProposalCard from returning null
  const deployedProposals = useMemo(() => {
    return proposals.filter((proposal) => proposal.status === "DEPLOYED");
  }, [proposals]);

  return (
    <div className="space-y-8">
      {deployedProposals.map((proposal) => (
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
