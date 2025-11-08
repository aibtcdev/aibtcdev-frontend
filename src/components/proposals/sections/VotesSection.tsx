"use client";

import React, { useState } from "react";
import { Vote } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import VotesTable from "../VotesTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VotesSectionProps {
  proposalId: string;
}

export function VotesSection({ proposalId }: VotesSectionProps) {
  const [showFullModal, setShowFullModal] = useState(false);

  return (
    <>
      <ProposalSection.Provider
        sectionId="votes-details"
        defaultOpen={true}
        onToggle={(isOpen) => {
          // Track analytics for progressive disclosure
          console.log("Section toggled:", { section: "votes_details", isOpen });
        }}
      >
        <ProposalSection.Root collapsible={false}>
          <ProposalSection.Card>
            <ProposalSection.Content
              collapsible={false}
              lazy={false}
              className="px-0"
            >
              <VotesTable proposalId={proposalId} limit={10} />
              <div className="px-4 py-4 border-t border-border/50 bg-muted/20">
                <Button
                  onClick={() => setShowFullModal(true)}
                  // variant="outline"
                  className="w-full"
                >
                  View Full Vote Details
                </Button>
              </div>
            </ProposalSection.Content>
          </ProposalSection.Card>
        </ProposalSection.Root>
      </ProposalSection.Provider>

      {/* Full Votes Modal */}
      <Dialog open={showFullModal} onOpenChange={setShowFullModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              All Vote Details
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <VotesTable proposalId={proposalId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default VotesSection;
