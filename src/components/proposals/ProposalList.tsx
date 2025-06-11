"use client";

import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal, ProposalWithDAO } from "@/types";
import { FileText } from "lucide-react";

interface ProposalListProps {
  proposals: Proposal[] | ProposalWithDAO[];
  tokenSymbol?: string;
  showDAOInfo?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

const ProposalList = ({
  proposals,
  tokenSymbol = "",
  showDAOInfo = false,
  emptyStateTitle = "No Proposals Found",
  emptyStateDescription = "No proposals have been created yet. Check back later for new governance proposals.",
  className = "",
}: ProposalListProps) => {
  if (proposals.length === 0) {
    return (
      <div className={`rounded-xl py-12 ${className}`}>
        <div className="text-center space-y-4 px-4">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {emptyStateTitle}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {emptyStateDescription}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          tokenSymbol={tokenSymbol}
          showDAOInfo={showDAOInfo}
        />
      ))}
    </div>
  );
};

export default ProposalList;
