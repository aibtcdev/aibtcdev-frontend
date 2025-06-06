"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProposalWithDAO } from "@/types/supabase";
import { fetchProposalById } from "@/queries/dao-queries";
import ProposalDetails from "@/components/proposals/ProposalDetails";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// import { useVotingStatus } from "@/components/proposals/TimeStatus";
import { useVotingStatus } from "@/hooks/use-voting-status";
import { safeNumberFromBigInt, safeString } from "@/helpers/proposal-utils";
import { format } from "date-fns";
import Link from "next/link";
import { getExplorerLink } from "@/helpers/helper";

export const runtime = "edge";

export default function ProposalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalWithDAO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isActive, isEnded } = useVotingStatus(
    proposal?.status || "",
    safeNumberFromBigInt(proposal?.vote_start || BigInt(0)),
    safeNumberFromBigInt(proposal?.vote_end || BigInt(0))
  );

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const proposalId = params.id as string;
        const data = await fetchProposalById(proposalId);
        setProposal(data);
      } catch (error) {
        console.error("Error fetching proposal:", error);
        setError("Failed to load proposal");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProposal();
    }
  }, [params.id]);

  const getStatusBadge = () => {
    if (!proposal) return null;

    if (isActive) {
      return (
        <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/50 transition-colors duration-150">
          Active
        </Badge>
      );
    } else if (isEnded && proposal.passed) {
      return (
        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50 transition-colors duration-150">
          Passed
        </Badge>
      );
    } else if (isEnded && !proposal.passed) {
      return (
        <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50 transition-colors duration-150">
          Failed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-muted/50 text-muted-foreground hover:bg-muted/70 border-muted transition-colors duration-150">
          Pending
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="h-full flex items-center justify-center text-base text-muted-foreground">
          Loading proposal...
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="h-full flex items-center justify-center text-base text-muted-foreground">
          {error || "Proposal not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
      {/* Header Section */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2 break-words">
                  {proposal.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {proposal.daos?.name && (
                    <>
                      <Link
                        href={`/daos/${encodeURIComponent(proposal.daos.name)}`}
                        className="hover:text-foreground transition-colors duration-150 flex items-center gap-1"
                      >
                        {proposal.daos.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <span className="text-muted">•</span>
                    </>
                  )}
                  <span>
                    Created{" "}
                    {format(new Date(proposal.created_at), "MMM dd, yyyy")}
                  </span>
                  <span className="text-muted">•</span>
                  <a
                    href={getExplorerLink("address", proposal.creator)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors duration-150"
                  >
                    By {safeString(proposal.creator).slice(0, 6)}...
                    {safeString(proposal.creator).slice(-4)}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge()}
          </div>
        </div>

        {/* Category badge if available */}
        {proposal.type && (
          <div className="mb-6">
            <Badge
              variant="outline"
              className="text-secondary border-secondary/50 bg-secondary/10 hover:bg-secondary/20 transition-colors duration-150"
            >
              {proposal.type}
            </Badge>
          </div>
        )}
      </div>

      {/* Proposal Details */}
      <ProposalDetails proposal={proposal} />
    </div>
  );
}
