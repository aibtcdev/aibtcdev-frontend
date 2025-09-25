"use client";

import { useEffect, useRef } from "react";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useProposalVote } from "@/hooks/useProposalVote";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Check vote data status for overall error handling
  const {
    error: hasVoteDataError,
    voteDisplayData,
    refreshVoteData,
    isLoading: isLoadingVotes,
  } = useProposalVote({
    proposal,
    contractPrincipal: proposal.contract_principal,
  });

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

      {/* Global Vote Data Error - Only show if VotingProgressChart doesn't handle it */}
      {hasVoteDataError && !voteDisplayData && (
        <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <div className="font-medium">Vote Data Unavailable</div>
              <div className="text-sm opacity-90">
                Failed to load voting information for this proposal
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshVoteData}
            disabled={isLoadingVotes}
            className="text-destructive hover:text-destructive"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoadingVotes ? "animate-spin" : ""}`}
            />
            Refresh Vote Data
          </Button>
        </div>
      )}

      {/* Voting Progress - Primary Content, Always Open */}
      <VotingProgressChart
        proposal={proposal}
        tokenSymbol={tokenSymbol}
        contractPrincipal={proposal.contract_principal}
      />

      {/* Secondary Content - Progressive Disclosure */}
      <VotesSection proposalId={proposal.id} defaultOpen={false} />

      <VetosSection
        proposalId={proposal.id}
        proposal={proposal}
        defaultOpen={false}
      />

      {/* Tertiary Content - Advanced Details, Collapsed by Default */}
      <ChainSection proposal={proposal} defaultOpen={false} />
    </div>
  );
};

export default ProposalDetails;
