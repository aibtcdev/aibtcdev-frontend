"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useProposalVote } from "@/hooks/useProposalVote";
import { useProposalHasVetos } from "@/hooks/useVetos";
import { safeNumberFromBigInt } from "@/utils/proposal";
import type { ProposalWithDAO } from "@/types";

interface ProposalHeaderProps {
  proposal: ProposalWithDAO;
}

export function ProposalHeader({ proposal }: ProposalHeaderProps) {
  const router = useRouter();
  const { statusConfig } = useProposalStatus(proposal);

  // Get vote data for calculations
  const { calculations, isLoading: isLoadingVotes } = useProposalVote({
    proposal,
    contractPrincipal: proposal.contract_principal,
    fallbackVotesFor: proposal.votes_for,
    fallbackVotesAgainst: proposal.votes_against,
  });

  // Get vetos data
  const { vetoCount } = useProposalHasVetos(proposal.id);

  // Enhanced calculations with proposal-specific logic
  const enhancedCalculations = useMemo(() => {
    if (!calculations) return null;

    const quorumPercentage = safeNumberFromBigInt(proposal.voting_quorum);
    const thresholdPercentage = safeNumberFromBigInt(proposal.voting_threshold);

    // Calculate if requirements are met
    const metQuorum = calculations.participationRate >= quorumPercentage;
    const metThreshold =
      calculations.totalVotes > 0
        ? calculations.approvalRate >= thresholdPercentage
        : false;

    return {
      ...calculations,
      quorumPercentage,
      thresholdPercentage,
      metQuorum,
      metThreshold,
    };
  }, [calculations, proposal.voting_quorum, proposal.voting_threshold]);

  // Helper function to get status text
  const getStatusText = (isMet: boolean, percentage: number) => {
    if (isMet) return "Passed";
    return `${percentage.toFixed(1)}%`;
  };

  // Get DAO image - check if full DAO object is available
  const daoImage =
    proposal.daos && "image_url" in proposal.daos
      ? (proposal.daos.image_url as string)
      : undefined;

  return (
    <div className="mb-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header content matching the design */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        {/* Top row: DAO image, name, proposal info, and Agent Summary inline */}
        <div className="flex items-center gap-3">
          {/* DAO Image */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
            {daoImage ? (
              <Image
                src={daoImage}
                alt={proposal.daos?.name || "DAO"}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log("Image failed to load:", daoImage);
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {proposal.daos?.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>

          {/* DAO name, proposal info, and Agent Summary inline */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <span>{proposal.daos?.name || "Unknown DAO"}</span>
              <span className="text-muted-foreground">•</span>
              <span>Contribution #{proposal.proposal_id}</span>
            </div>

            {/* Agent Summary as big title */}
            <div className="text-xl font-bold text-foreground">
              <span className=" text-muted-foreground font-normal mr-2">
                Agent Summary:
              </span>
              {proposal.title}
            </div>
          </div>
        </div>

        {/* Status and metrics row */}
        <div className="flex items-center gap-6 text-sm">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge
              variant={statusConfig.variant}
              className={cn(
                "flex items-center gap-1",
                statusConfig.bg,
                statusConfig.border,
                statusConfig.color
              )}
            >
              <statusConfig.icon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Quorum */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Quorum:</span>
            {enhancedCalculations ? (
              <Badge
                variant={
                  enhancedCalculations.metQuorum ? "default" : "secondary"
                }
                className={cn(
                  enhancedCalculations.metQuorum
                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {getStatusText(
                  enhancedCalculations.metQuorum,
                  enhancedCalculations.participationRate
                )}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                {isLoadingVotes ? "Loading..." : "Failed"}
              </Badge>
            )}
          </div>

          {/* Vote Threshold */}
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vote Threshold:</span>
            {enhancedCalculations ? (
              <Badge
                variant={
                  enhancedCalculations.metThreshold ? "default" : "secondary"
                }
                className={cn(
                  enhancedCalculations.metThreshold
                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {getStatusText(
                  enhancedCalculations.metThreshold,
                  enhancedCalculations.approvalRate
                )}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                {isLoadingVotes ? "Loading..." : "Failed"}
              </Badge>
            )}
          </div>

          {/* Vetos */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Vetos:</span>
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              {vetoCount}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
