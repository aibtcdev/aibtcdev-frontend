"use client";

import { useMemo } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
}

const DAOProposals = ({ proposals, tokenSymbol = "" }: DAOProposalsProps) => {
  // Filter out draft proposals to prevent ProposalCard from returning null
  const deployedProposals = useMemo(() => {
    return proposals.filter((proposal) => proposal.status === "DEPLOYED");
  }, [proposals]);

  if (deployedProposals.length === 0) {
    return (
      <div className="border-dashed border rounded-lg py-12">
        <div className="text-center space-y-4 px-4">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              No Proposals Found
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This DAO has no active or concluded proposals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Recent Proposals
        </h2>
        <Badge variant="outline" className="text-muted-foreground">
          {deployedProposals.length} Active
        </Badge>
      </div>
      <div className="divide-y divide-border/50 rounded-lg border border-border overflow-hidden">
        {deployedProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            tokenSymbol={tokenSymbol}
          />
        ))}
      </div>
    </div>
  );
};

export default DAOProposals;
