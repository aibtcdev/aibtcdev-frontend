"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useVotingStatus } from "@/hooks/useVotingStatus";
import type { Proposal, ProposalWithDAO } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { safeNumberFromBigInt } from "@/utils/proposal";

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
  tokenSymbol = "",
}: ProposalDetailsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isActive } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end)
  );

  const refreshVotesData = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["votes", proposal.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["proposals"],
      });
    } catch (error) {
      console.error("Failed to refresh votes data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, proposal.id, refreshing]);

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

  // Auto-refresh for active proposals
  useEffect(() => {
    if (isActive) {
      // Start countdown
      const countdownInterval = setInterval(() => {
        refreshVotesData();
      }, 30000); // Refresh every 30 seconds

      countdownIntervalRef.current = countdownInterval;

      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isActive, refreshVotesData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* On-chain Message - Top Priority, Always Open */}
      <MessageSection proposal={proposal} defaultOpen={true} />

      {/* Voting Progress - Primary Content, Always Open */}
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
