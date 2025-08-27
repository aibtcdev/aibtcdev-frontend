"use client";

import React from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProposalSection } from "../layout/ProposalSection";
import { useProposalVetos, useProposalHasVetos } from "@/hooks/useVetos";
import { Skeleton } from "@/components/ui/skeleton";

interface VetosSectionProps {
  proposalId: string;
  defaultOpen?: boolean;
}

function formatBalance(value: string | number, decimals: number = 8) {
  let num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  num = num / Math.pow(10, decimals);

  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  } else if (num < 1) {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  } else {
    return num.toFixed(decimals).replace(/\.?0+$/, "");
  }
}

function VetosContent({ proposalId }: { proposalId: string }) {
  const { data: vetos, isLoading, error } = useProposalVetos(proposalId);
  const { hasVetos } = useProposalHasVetos(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Unable to load vetos at this time
        </p>
      </div>
    );
  }

  if (!hasVetos) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No vetos have been submitted for this proposal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vetos?.map((veto, index) => {
        return (
          <div
            key={veto.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-destructive">
                  {index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-mono truncate block">
                  {veto.address?.slice(0, 5)}...{veto.address?.slice(-5)}
                </span>
                {veto.reasoning && (
                  <p className="text-xs text-muted-foreground truncate">
                    {veto.reasoning}
                  </p>
                )}
              </div>
            </div>
            {veto.amount && (
              <Badge variant="destructive" className="text-xs">
                {formatBalance(veto.amount)}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function VetosSection({
  proposalId,
  defaultOpen = false,
}: VetosSectionProps) {
  const { hasVetos, vetoCount } = useProposalHasVetos(proposalId);

  const icon = hasVetos ? (
    <AlertTriangle className="h-5 w-5 text-destructive" />
  ) : (
    <Shield className="h-5 w-5 text-muted-foreground" />
  );

  const title = hasVetos ? `Vetos (${vetoCount})` : "Vetos";
  const variant = hasVetos ? "warning" : "muted";

  return (
    <ProposalSection.Provider
      sectionId="vetos-details"
      defaultOpen={defaultOpen}
      onToggle={(isOpen) => {
        // Track analytics for progressive disclosure
        console.log("Section toggled:", {
          section: "vetos_details",
          isOpen,
          hasVetos,
        });
      }}
    >
      <ProposalSection.Root collapsible={true}>
        <ProposalSection.Card variant={variant}>
          <ProposalSection.Header
            icon={icon}
            title={title}
            subtitle={
              hasVetos
                ? "Community objections to this proposal"
                : "No objections submitted"
            }
            collapsible={true}
          />
          <ProposalSection.Content collapsible={true} lazy={true}>
            <VetosContent proposalId={proposalId} />
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default VetosSection;
