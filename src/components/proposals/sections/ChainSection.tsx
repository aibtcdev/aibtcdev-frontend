"use client";

import React from "react";
import { Layers, Hash, ExternalLink } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import { Badge } from "@/components/ui/badge";
import { getExplorerLink } from "@/utils/format";
import { safeString, safeNumberFromBigInt } from "@/utils/proposal";
import type { Proposal, ProposalWithDAO } from "@/types";

interface ChainSectionProps {
  proposal: Proposal | ProposalWithDAO;
  defaultOpen?: boolean;
}

export function ChainSection({
  proposal,
  defaultOpen = false,
}: ChainSectionProps) {
  return (
    <ProposalSection.Provider
      sectionId="blockchain-details"
      defaultOpen={defaultOpen}
      onToggle={(isOpen) => {
        // Track analytics for progressive disclosure
        console.log("Section toggled:", {
          section: "blockchain_details",
          isOpen,
        });
      }}
    >
      <ProposalSection.Root collapsible={true}>
        <ProposalSection.Card variant="muted">
          <ProposalSection.Header
            icon={<Layers className="h-5 w-5 text-muted-foreground" />}
            title="Blockchain Details"
            subtitle="Technical information and block data"
            collapsible={true}
          />
          <ProposalSection.Content collapsible={true} lazy={true}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Block Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Blocks</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Vote Start
                    </p>
                    <p className="text-sm font-mono">
                      #{safeNumberFromBigInt(proposal.vote_start)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Vote End
                    </p>
                    <p className="text-sm font-mono">
                      #{safeNumberFromBigInt(proposal.vote_end)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Execution Start
                    </p>
                    <p className="text-sm font-mono">
                      #{safeNumberFromBigInt(proposal.exec_start)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  <span>Contract</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Creator
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono truncate">
                        {safeString(proposal.creator)}
                      </p>
                      <a
                        href={getExplorerLink("address", proposal.creator)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Proposal ID
                    </p>
                    <Badge variant="outline" className="font-mono text-xs">
                      {proposal.proposal_id}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Transaction</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      Created
                    </p>
                    <p className="text-sm">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <a
                      href={getExplorerLink("tx", proposal.tx_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 flex items-center gap-2"
                    >
                      Tx id <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default ChainSection;
