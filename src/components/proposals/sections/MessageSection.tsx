"use client";

import React from "react";
import { FileText, ExternalLink } from "lucide-react";
import { ProposalSection } from "../layout/ProposalSection";
import MessageDisplay from "../MessageDisplay";
import { XCard } from "@/components/ui/XCard";
import type { Proposal, ProposalWithDAO } from "@/types";

interface MessageSectionProps {
  proposal: Proposal | ProposalWithDAO;
  defaultOpen?: boolean;
}

// Helper function to check if URL is X/Twitter
function isXUrl(url: string): boolean {
  return /(?:twitter\.com|x\.com)/i.test(url);
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
  const airdropReferenceRegex = /Airdrop Transaction ID:\s*(0x[a-fA-F0-9]+)/i;
  const match = proposal.content.match(referenceRegex);
  const airdropMatch = proposal.content.match(airdropReferenceRegex);
  const referenceLink = match?.[1];
  const airdropReferenceLink = airdropMatch?.[1];
  const cleanedContent = proposal.content
    .replace(referenceRegex, "")
    .replace(airdropReferenceRegex, "")
    .trim();

  // Check if reference link is X/Twitter
  const isXReference = referenceLink && isXUrl(referenceLink);

  return (
    <div
      className={`${isXReference ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}`}
    >
      {/* On-chain Message Section */}
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
              <div className="space-y-4">
                <MessageDisplay message={cleanedContent} />

                {/* Non-X reference link */}
                {referenceLink && !isXReference && (
                  <div className="p-3 bg-background/50 rounded-lg border border-border/50">
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

                {/* Airdrop reference */}
                {airdropReferenceLink && (
                  <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">
                      Airdrop Transaction ID
                    </div>
                    <a
                      href={`https://explorer.hiro.so/txid/${airdropReferenceLink}?chain=${process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet"}`}
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
              </div>
            </ProposalSection.Content>
          </ProposalSection.Card>
        </ProposalSection.Root>
      </ProposalSection.Provider>

      {/* X Post Preview Section - Separate section on the right */}
      {isXReference && (
        <ProposalSection.Provider
          sectionId="x-post-preview"
          defaultOpen={defaultOpen}
        >
          <ProposalSection.Root collapsible={false}>
            <ProposalSection.Card className="border-border/50">
              <ProposalSection.Header
                icon={<ExternalLink className="h-5 w-5 text-primary" />}
                title="Preview"
                subtitle="Referenced X post"
                collapsible={false}
              />
              <ProposalSection.Content>
                <XCard url={referenceLink} />
              </ProposalSection.Content>
            </ProposalSection.Card>
          </ProposalSection.Root>
        </ProposalSection.Provider>
      )}
    </div>
  );
}

export default MessageSection;
