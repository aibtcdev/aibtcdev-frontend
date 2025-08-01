"use client";

import React from "react";
import { Vote } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import VotesTable from "../VotesTable";

interface VotesSectionProps {
  proposalId: string;
  defaultOpen?: boolean;
}

export function VotesSection({
  proposalId,
  defaultOpen = false,
}: VotesSectionProps) {
  return (
    <ProposalSection.Provider
      sectionId="votes-details"
      defaultOpen={defaultOpen}
      onToggle={(isOpen) => {
        // Track analytics for progressive disclosure
        console.log("Section toggled:", { section: "votes_details", isOpen });
      }}
    >
      <ProposalSection.Root collapsible={true}>
        <ProposalSection.Card>
          <ProposalSection.Header
            icon={<Vote className="h-5 w-5 text-primary" />}
            title="Vote Details"
            subtitle="Individual voter breakdown"
            collapsible={true}
          />
          <ProposalSection.Content
            collapsible={true}
            lazy={true}
            className="px-0"
          >
            <VotesTable proposalId={proposalId} />
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default VotesSection;
