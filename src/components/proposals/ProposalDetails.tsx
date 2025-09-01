"use client";

import { useEffect, useRef } from "react";
import type { Proposal, ProposalWithDAO } from "@/types";

// Import section components
import MessageSection from "./sections/MessageSection";
// import VotingSection from "./sections/VotingSection";
import VotesSection from "./sections/VotesSection";
import VetosSection from "./sections/VetosSection";
import ChainSection from "./sections/ChainSection";
import VotingProgressChart from "./VotingProgressChart";

interface ProposalDetailsProps {
  proposal: Proposal | ProposalWithDAO;
  className?: string;
  tokenSymbol?: string;
}

const ProposalDetails = ({
  proposal,
  className = "",
  tokenSymbol,
}: ProposalDetailsProps) => {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    const refreshInterval = refreshIntervalRef.current;
    const countdownInterval = countdownIntervalRef.current;

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* On-chain Message - Top Priority, Always Open */}
      <MessageSection proposal={proposal} defaultOpen={true} />

      {/* Voting Progress - Primary Content, Always Open */}
      {/* <VotingSection
        proposal={proposal}
        tokenSymbol={tokenSymbol}
        defaultOpen={true}
      /> */}
      <VotingProgressChart
        proposal={proposal}
        tokenSymbol={tokenSymbol}
        contractPrincipal={proposal.contract_principal}
      />
      {/* Secondary Content - Progressive Disclosure */}
      <VotesSection proposalId={proposal.id} defaultOpen={false} />

      <VetosSection proposalId={proposal.id} defaultOpen={false} />

      {/* Tertiary Content - Advanced Details, Collapsed by Default */}
      <ChainSection proposal={proposal} defaultOpen={false} />
    </div>
  );
};

export default ProposalDetails;
