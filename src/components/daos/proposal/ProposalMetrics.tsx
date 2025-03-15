"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Proposal } from "@/types/supabase";

interface ProposalMetricsProps {
  proposal: Proposal;
}

const ProposalMetrics: React.FC<ProposalMetricsProps> = ({ proposal }) => {
  const liquidTokens =
    proposal.liquid_tokens !== null
      ? (proposal.liquid_tokens / 1e8).toFixed(2)
      : "No data available";
  return (
    <div className="p-4 rounded-lg my-4">
      {/* <h4 className="text-sm font-bold mb-2">Voting Metrics</h4> */}
      <div className="flex flex-wrap gap-2">
        <Badge className="text-sm">Liquid Tokens: {liquidTokens}</Badge>
        <Badge
          variant={proposal.met_quorum ? "default" : "destructive"}
          className="text-sm"
        >
          Quorum: {proposal.met_quorum ? "Met" : "Not Met"}
        </Badge>
        <Badge
          variant={proposal.met_threshold ? "default" : "destructive"}
          className="text-sm"
        >
          Threshold: {proposal.met_threshold ? "Met" : "Not Met"}
        </Badge>
        <Badge
          variant={proposal.passed ? "default" : "destructive"}
          className="text-sm"
        >
          Outcome: {proposal.passed ? "Passed" : "Failed"}
        </Badge>
      </div>
    </div>
  );
};

export default ProposalMetrics;
