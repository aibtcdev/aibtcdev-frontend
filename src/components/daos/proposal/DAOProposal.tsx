"use client";

import { useRef } from "react";
import { Card, CardDescription } from "@/components/ui/card";
import ProposalCard from "./ProposalCard";
import type { Proposal } from "@/types/supabase";

interface DAOProposalsProps {
  proposals: Proposal[];
}

const DAOProposals = ({ proposals }: DAOProposalsProps) => {
  const proposalsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full py-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Total Proposals: {proposals.length}
        </h3>
        <div ref={proposalsRef}>
          {proposals.length === 0 ? (
            <Card className="p-6 text-center">
              <CardDescription>No proposals found.</CardDescription>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proposals.map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DAOProposals;
