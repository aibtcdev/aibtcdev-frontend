"use client";

import { useMemo } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";
import { FileText } from "lucide-react";
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
  daoName?: string;
}

const DAOProposals = ({
  proposals,
  tokenSymbol = "",
  daoName = "",
}: DAOProposalsProps) => {
  // Filter out draft proposals to prevent ProposalCard from returning null
  const deployedProposals = useMemo(() => {
    return proposals.filter((proposal) => proposal.status === "DEPLOYED");
  }, [proposals]);

  return (
    <DAOTabLayout
      title={`${daoName}  Contribution History`}
      description={`Explore all work submitted in pursuit of the ${daoName} mission`}
      icon={FileText}
      isEmpty={deployedProposals.length === 0}
      emptyTitle="No Contributions Found"
      emptyDescription="This DAO has no active or concluded contributions."
      emptyIcon={FileText}
    >
      <div className="space-y-4">
        <div className="divide-y">
          {deployedProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              tokenSymbol={tokenSymbol}
            />
          ))}
        </div>
      </div>
    </DAOTabLayout>
  );
};

export default DAOProposals;
