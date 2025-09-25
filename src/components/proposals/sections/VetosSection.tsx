"use client";

import React, { useMemo } from "react";
import { Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProposalSection } from "../layout/ProposalSection";
import { useProposalVetos, useProposalHasVetos } from "@/hooks/useVetos";
import { Skeleton } from "@/components/ui/skeleton";
import { DAOVetoProposal } from "../DAOVetoProposal";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { checkAgentVetoStatus } from "@/services/veto.service";
import { fetchAgents } from "@/services/agent.service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Proposal, ProposalWithDAO } from "@/types";

interface VetosSectionProps {
  proposalId: string;
  defaultOpen?: boolean;
  proposal: Proposal | ProposalWithDAO;
}

// Helper function to mask addresses
const maskAddress = (addr?: string | null) => {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
};

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

function VetosContent({
  proposalId,
  proposal,
}: {
  proposalId: string;
  proposal: Proposal | ProposalWithDAO;
}) {
  const { data: vetos, isLoading, error } = useProposalVetos(proposalId);
  const { hasVetos, vetoCount } = useProposalHasVetos(proposalId);

  // Get auth state and proposal status for veto functionality
  const { isAuthenticated, userId } = useAuth();
  const { status: proposalStatus } = useProposalStatus(proposal);

  // Fetch user's agents to get agent account address
  const { data: agents = [] } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: isAuthenticated && !!userId,
  });

  // Get agent account address for veto checking
  const agentAccountAddress = useMemo(() => {
    if (!agents.length) return null;
    const agent = agents[0];
    return agent.account_contract || null;
  }, [agents]);

  // Check if current user (agent) has already vetoed this proposal
  const { data: existingVeto } = useQuery({
    queryKey: ["agentVeto", proposalId, agentAccountAddress],
    queryFn: () => {
      if (!proposalId || !agentAccountAddress) return null;
      return checkAgentVetoStatus(proposalId, agentAccountAddress);
    },
    enabled: !!proposalId && !!agentAccountAddress && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get DAO ID and name from proposal
  const daoId = proposal.dao_id;
  const daoName = "daos" in proposal ? proposal.daos?.name : undefined;

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
    <div className="space-y-4">
      {/* Veto Button - Always show with tooltip */}
      {daoId && (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DAOVetoProposal
                    daoId={daoId}
                    proposalId={proposalId}
                    size="default"
                    variant="destructive"
                    disabled={
                      proposalStatus !== "VETO_PERIOD" || !!existingVeto
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {existingVeto
                    ? "You have already vetoed this proposal"
                    : proposalStatus !== "VETO_PERIOD"
                      ? "Can only be vetoed during veto period"
                      : "Click to veto this proposal"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Veto Status Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Veto Status</span>
        <Badge
          variant={hasVetos ? "destructive" : "secondary"}
          className="text-xs"
        >
          {hasVetos
            ? `${vetoCount} Veto${vetoCount !== 1 ? "s" : ""}`
            : "No Vetos"}
        </Badge>
      </div>

      {/* Veto List - Same format as VotesView.tsx */}
      <div className="space-y-2">
        {vetos?.map((veto) => (
          <div
            key={veto.id}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-destructive">
                Vetoed {formatBalance(veto.amount || "0")} {daoName || "tokens"}{" "}
                by {maskAddress(veto.address)}
              </span>
              {veto.tx_id && (
                <a
                  href={`https://explorer.hiro.so/txid/${veto.tx_id}?chain=${process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 ml-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Transaction
                </a>
              )}
            </div>
          </div>
        ))}
        {vetos && vetos.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{vetos.length - 3} more vetos
          </p>
        )}
      </div>
    </div>
  );
}

export function VetosSection({
  proposalId,
  defaultOpen = false,
  proposal,
}: VetosSectionProps) {
  const { hasVetos, vetoCount } = useProposalHasVetos(proposalId);

  // Get auth state and proposal status for veto functionality
  const { isAuthenticated, userId } = useAuth();
  const { status: proposalStatus } = useProposalStatus(proposal);

  // Fetch user's agents to get agent account address
  const { data: agents = [] } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: isAuthenticated && !!userId,
  });

  // Get agent account address for veto checking
  const agentAccountAddress = useMemo(() => {
    if (!agents.length) return null;
    const agent = agents[0];
    return agent.account_contract || null;
  }, [agents]);

  // Check if current user (agent) has already vetoed this proposal
  const { data: existingVeto } = useQuery({
    queryKey: ["agentVeto", proposalId, agentAccountAddress],
    queryFn: () => {
      if (!proposalId || !agentAccountAddress) return null;
      return checkAgentVetoStatus(proposalId, agentAccountAddress);
    },
    enabled: !!proposalId && !!agentAccountAddress && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get DAO ID from proposal
  const daoId = proposal.dao_id;

  const icon = hasVetos ? (
    <AlertTriangle className="h-5 w-5 text-destructive" />
  ) : (
    <Shield className="h-5 w-5 text-muted-foreground" />
  );

  const title = hasVetos ? `Vetos (${vetoCount})` : "Vetos";
  const variant = hasVetos ? "warning" : "muted";

  // Veto button as header action
  const vetoAction = daoId ? (
    <div onClick={(e) => e.stopPropagation()}>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DAOVetoProposal
                daoId={daoId}
                proposalId={proposalId}
                size="sm"
                variant="destructive"
                disabled={proposalStatus !== "VETO_PERIOD" || !!existingVeto}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {existingVeto
                ? "You have already vetoed this proposal"
                : proposalStatus !== "VETO_PERIOD"
                  ? "Can only be vetoed during veto period"
                  : "Click to veto this proposal"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ) : null;

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
            actions={vetoAction}
            collapsible={true}
          />
          <ProposalSection.Content collapsible={true} lazy={true}>
            <VetosContent proposalId={proposalId} proposal={proposal} />
          </ProposalSection.Content>
        </ProposalSection.Card>
      </ProposalSection.Root>
    </ProposalSection.Provider>
  );
}

export default VetosSection;
