"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProposalStatus } from "@/hooks/useProposalStatus";
import { useProposalVote } from "@/hooks/useProposalVote";
import { useProposalHasVetos } from "@/hooks/useVetos";
import { safeNumberFromBigInt } from "@/utils/proposal";
import { fetchToken } from "@/services/dao.service";
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

  // Fetch token data for the DAO to get image_url
  const { data: tokenData } = useQuery({
    queryKey: ["token", proposal.dao_id],
    queryFn: () => fetchToken(proposal.dao_id),
    enabled: !!proposal.dao_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

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

  // Get DAO/token image - prioritize token image, fallback to DAO image if available
  const daoImage =
    tokenData?.image_url ||
    (proposal.daos && "image_url" in proposal.daos
      ? (proposal.daos.image_url as string)
      : undefined);

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

      {/* Enhanced Header Design - Mobile First */}
      <div className="relative overflow-hidden">
        {/* Gradient background with subtle pattern */}
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 border rounded-2xl shadow-lg backdrop-blur-sm relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full translate-y-12 -translate-x-12" />

          {/* Main content */}
          <div className="relative p-6 space-y-6">
            {/* Content - Mobile centered, desktop left-aligned */}
            <div className="flex-1 min-w-0 w-full text-center sm:text-left space-y-4">
              {/* Main heading: Contribution ID with DAO name */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Contribution #{proposal.proposal_id} ·{" "}
                  {proposal.daos?.name || "Unknown DAO"}
                </h1>
              </div>

              {/* Subheading: Agent Summary */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl text-muted-foreground leading-tight break-words font-semibold">
                  <span className="font-normal">Agent Summary:</span>{" "}
                  {proposal.title}
                </h2>
              </div>

              {/* DAO name and image - COMMENTED OUT */}
              {/* <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                {/* DAO/Token Image */}
              {/* <div className="relative group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-500 group-hover:scale-105 shadow-lg">
                    {daoImage ? (
                      <Image
                        src={daoImage}
                        alt={proposal.daos?.name || "DAO"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {proposal.daos?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Subtle glow effect */}
              {/* <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-sm" />
                </div>

                {/* DAO name */}
              {/* {proposal.daos?.name ? (
                  <Link
                    href={`/aidaos/${proposal.daos.name}`}
                    className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors duration-200 truncate"
                  >
                    {proposal.daos.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground truncate">
                    Unknown DAO
                  </span>
                )}
              </div> */}

              {/* Status and Metrics - Inline on same line */}
              <div className="space-y-4">
                {/* Mobile: Card-style metrics with status */}
                <div className="grid grid-cols-2 sm:hidden gap-3">
                  {/* Status Card */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group col-span-2">
                    <div className="flex items-center justify-center gap-2">
                      <statusConfig.icon className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
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
                  </div>

                  {/* Quorum Card */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Quorum
                      </span>
                      {enhancedCalculations ? (
                        <span
                          className={cn(
                            "text-sm font-bold",
                            enhancedCalculations.metQuorum
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {getStatusText(
                            enhancedCalculations.metQuorum,
                            enhancedCalculations.participationRate
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isLoadingVotes ? "..." : "Failed"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Threshold Card */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Threshold
                      </span>
                      {enhancedCalculations ? (
                        <span
                          className={cn(
                            "text-sm font-bold",
                            enhancedCalculations.metThreshold
                              ? "text-green-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {getStatusText(
                            enhancedCalculations.metThreshold,
                            enhancedCalculations.approvalRate
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {isLoadingVotes ? "..." : "Failed"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vetos Card */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group col-span-2">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Vetos:
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {vetoCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop: All inline on same line */}
                <div className="hidden sm:flex sm:items-center sm:gap-4 sm:flex-wrap text-sm">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <statusConfig.icon className="h-4 w-4 text-primary" />
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
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Quorum:</span>
                    {enhancedCalculations ? (
                      <span
                        className={cn(
                          "font-semibold",
                          enhancedCalculations.metQuorum
                            ? "text-green-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {getStatusText(
                          enhancedCalculations.metQuorum,
                          enhancedCalculations.participationRate
                        )}
                      </span>
                    ) : (
                      <span className="font-semibold text-muted-foreground">
                        {isLoadingVotes ? "Loading..." : "Failed"}
                      </span>
                    )}
                  </div>

                  {/* Threshold */}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Threshold:</span>
                    {enhancedCalculations ? (
                      <span
                        className={cn(
                          "font-semibold",
                          enhancedCalculations.metThreshold
                            ? "text-green-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {getStatusText(
                          enhancedCalculations.metThreshold,
                          enhancedCalculations.approvalRate
                        )}
                      </span>
                    ) : (
                      <span className="font-semibold text-muted-foreground">
                        {isLoadingVotes ? "Loading..." : "Failed"}
                      </span>
                    )}
                  </div>

                  {/* Vetos */}
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Vetos:</span>
                    <span className="font-semibold text-foreground">
                      {vetoCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
