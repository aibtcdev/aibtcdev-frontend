"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalStatusBadge } from "@/components/proposals/ProposalBadge";
import { TimeRemainingMetric } from "./TimeRemainingMetric";
import { useProposalHasVetos } from "@/hooks/useVetos";
import type { ProposalWithDAO } from "@/types";
import { Hash, User, AlertTriangle, Shield, Vote, Share } from "lucide-react";
import { getExplorerLink } from "@/utils/format";
import { safeString } from "@/utils/proposal";
import { cn } from "@/lib/utils";

interface ProposalSidebarProps {
  proposal: ProposalWithDAO;
  className?: string;
  onVote?: () => void;
  onShare?: () => void;
}

function MetricCard({
  icon,
  label,
  value,
  link,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  link?: string;
  variant?: "default" | "warning" | "success";
}) {
  const variantClasses = {
    default: "border-border/20",
    warning: "border-destructive/20 bg-destructive/5",
    success: "border-primary/20 bg-primary/5",
  };

  const content = (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/30",
        variantClasses[variant]
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <div className="text-sm font-semibold text-foreground">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:scale-[1.02] transition-transform"
      >
        {content}
      </a>
    );
  }

  return content;
}

function VetosMetric({ proposalId }: { proposalId: string }) {
  const { hasVetos, vetoCount } = useProposalHasVetos(proposalId);

  if (!hasVetos) {
    return (
      <MetricCard
        icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        label="Vetos"
        value="None"
        variant="default"
      />
    );
  }

  return (
    <MetricCard
      icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      label="Vetos"
      value={vetoCount}
      variant="warning"
    />
  );
}

export function ProposalSidebar({
  proposal,
  className,
  onVote,
  onShare,
}: ProposalSidebarProps) {
  return (
    <div className={cn("lg:sticky lg:top-20 space-y-4", className)}>
      {/* Status Card - Primary metric */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalStatusBadge proposal={proposal} size="lg" />
        </CardContent>
      </Card>

      {/* Key Metrics - 4 core pieces of info */}
      <div className="space-y-3">
        {/* Proposal ID */}
        <MetricCard
          icon={<Hash className="h-4 w-4 text-primary" />}
          label="Proposal ID"
          value={`#${proposal.proposal_id}`}
        />

        {/* Creator */}
        <MetricCard
          icon={<User className="h-4 w-4 text-primary" />}
          label="Creator"
          value={
            <span className="font-mono">
              {`${safeString(proposal.creator).slice(0, 5)}...${safeString(proposal.creator).slice(-5)}`}
            </span>
          }
          link={getExplorerLink("address", proposal.creator)}
        />

        {/* Time Information - Updated to show multiple metrics */}
        <TimeRemainingMetric proposal={proposal} />

        {/* Vetos */}
        <VetosMetric proposalId={proposal.id} />
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 pt-2">
        {onVote && (
          <Button onClick={onVote} className="w-full" size="lg">
            <Vote className="h-4 w-4 mr-2" />
            Vote on Proposal
          </Button>
        )}
        {onShare && (
          <Button
            onClick={onShare}
            variant="outline"
            className="w-full bg-transparent"
            size="sm"
          >
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      {/* Quick Info */}
      <Card className="border-muted/20 bg-muted/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Created on{" "}
            <span className="font-medium">
              {new Date(proposal.created_at).toLocaleDateString()}
            </span>
            {proposal.daos?.name && (
              <>
                {" "}
                in <span className="font-medium">{proposal.daos.name}</span>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProposalSidebar;
