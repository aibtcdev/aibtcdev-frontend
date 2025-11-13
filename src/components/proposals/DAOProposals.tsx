"use client";

import { useMemo } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";
import { FileText } from "lucide-react";
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";
import { enableSingleDaoMode, singleDaoName } from "@/config/features";

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
    let filtered = proposals.filter(
      (proposal) => proposal.status === "DEPLOYED"
    );
    if (
      enableSingleDaoMode &&
      daoName.toUpperCase() !== singleDaoName.toUpperCase()
    ) {
      filtered = [];
    }
    return filtered;
  }, [proposals, daoName]);

  return (
    <DAOTabLayout
      // title={`${daoName}  Contribution History`}
      title="Submission History"
      // description={`Explore all work submitted in pursuit of the ${daoName} mission`}
      description="Explore all the work that has been submitted to AIBTC."
      // icon={FileText}
      isEmpty={deployedProposals.length === 0}
      emptyTitle="No Contributions Found"
      // emptyDescription="No active or concluded contributions."
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
