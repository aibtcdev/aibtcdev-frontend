"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import VotingProgressChart from "../VotingProgressChart";
import type { Proposal, ProposalWithDAO } from "@/types";

interface VotingSectionProps {
  proposal: Proposal | ProposalWithDAO;
  tokenSymbol?: string;
  defaultOpen?: boolean;
}

export function VotingSection({
  proposal,
  tokenSymbol = "STX",
  defaultOpen = true,
}: VotingSectionProps) {
  return (
    <ProposalSection.Provider
      sectionId="voting-progress"
      defaultOpen={defaultOpen}
      onToggle={(isOpen) => {
        // Track analytics for progressive disclosure
        console.log("Section toggled:", { section: "voting_progress", isOpen });
      }}
    >
      <ProposalSection.Root collapsible={false}>
        <ProposalSection.Card variant="highlighted">
          <ProposalSection.Header
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Voting Progress"
            subtitle="Current vote tallies and participation"
            collapsible={false}
          />
          <ProposalSection.Content collapsible={false}>
            <VotingProgressChart
              proposal={proposal}
              tokenSymbol={tokenSymbol}
            />
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default VotingSection;
