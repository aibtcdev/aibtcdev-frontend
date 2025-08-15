"use client";

import React from "react";
import { FileText, ExternalLink } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import MessageDisplay from "../MessageDisplay";
import type { Proposal, ProposalWithDAO } from "@/types";

interface MessageSectionProps {
  proposal: Proposal | ProposalWithDAO;
  defaultOpen?: boolean;
}

export function MessageSection({
  proposal,
  defaultOpen = true,
}: MessageSectionProps) {
  if (!proposal.content) {
    return null;
  }

  // Extract reference link from content
  const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
  const airdropReferenceRegex = /Airdrop Reference:\s*(https?:\/\/\S+)/i;
  const match = proposal.content.match(referenceRegex);
  const airdropMatch = proposal.content.match(airdropReferenceRegex);
  const referenceLink = match?.[1];
  const airdropReferenceLink = airdropMatch?.[1];
  const cleanedContent = proposal.content
    .replace(referenceRegex, "")
    .replace(airdropReferenceRegex, "")
    .trim();

  return (
    <ProposalSection.Provider
      sectionId="on-chain-message"
      defaultOpen={defaultOpen}
    >
      <ProposalSection.Root collapsible={false}>
        <ProposalSection.Card
          variant="highlighted"
          className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm border-border/50 shadow-lg"
        >
          <ProposalSection.Header
            icon={<FileText className="h-5 w-5 text-primary" />}
            title="On-chain Message"
            subtitle="Contribution description and details"
            collapsible={false}
          />
          <ProposalSection.Content>
            <MessageDisplay message={cleanedContent} />
            {referenceLink && (
              <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border/50">
                <a
                  href={referenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 transition-colors break-all word-break-all overflow-wrap-anywhere flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  <span className="inline-block max-w-full break-all">
                    {referenceLink}
                  </span>
                </a>
              </div>
            )}
            {airdropReferenceLink && (
              <div className="mt-4 p-3 bg-background/50 rounded-lg border border-border/50">
                <a
                  href={airdropReferenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 transition-colors break-all word-break-all overflow-wrap-anywhere flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  <span className="inline-block max-w-full break-all">
                    {airdropReferenceLink}
                  </span>
                </a>
              </div>
            )}
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default MessageSection;
