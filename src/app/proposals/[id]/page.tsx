"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { fetchProposalById } from "@/services/dao.service";
import ProposalDetails from "@/components/proposals/ProposalDetails";
import { FixedActionBarSpacer } from "@/components/proposals/layout/FixedActionBar";
import { ProposalHeader } from "@/components/proposals/ProposalHeader";
import { User, Clock } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { getExplorerLink, truncateString } from "@/utils/format";

export const runtime = "edge";

export default function ProposalDetailsPage() {
  const params = useParams();
  const proposalId = params.id as string;

  // Fetch proposal data with React Query
  const {
    data: proposal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: () => fetchProposalById(proposalId),
    staleTime: 300000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-center items-center min-h-[400px] w-full">
          <div className="text-center space-y-4">
            <Loader />
            <p className="text-muted-foreground">Loading proposal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex justify-center items-center min-h-[400px] w-full">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Proposal Not Found
            </h2>
            <p className="text-muted-foreground">
              {error
                ? "Failed to load proposal"
                : "Could not find the requested proposal"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // const handleVote = () => {
  //   // TODO: Implement voting functionality
  //   console.log("Vote clicked");
  // };

  // const handleShare = () => {
  //   // TODO: Implement share functionality
  //   if (navigator.share) {
  //     navigator.share({
  //       title: proposal.title,
  //       url: window.location.href,
  //     });
  //   } else {
  //     navigator.clipboard.writeText(window.location.href);
  //     // TODO: Show toast notification
  //   }
  // };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <ProposalHeader proposal={proposal} />

      {/* Creator and Timestamp Section */}
      <div className="mb-6  rounded-lg p-4">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          {/* Creator */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Created by:</span>
            <a
              href={getExplorerLink("tx", `${proposal.creator}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:text-primary/80 transition-colors underline"
            >
              {truncateString(proposal.creator, 5, 5)}
            </a>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Timestamp:</span>
            <span className="text-foreground">
              {new Date(proposal.created_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Full Width Main Content */}
      <div className="w-full">
        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[200px] w-full">
              <div className="text-center space-y-4">
                <Loader />
                <p className="text-muted-foreground">
                  Loading proposal details...
                </p>
              </div>
            </div>
          }
        >
          <ProposalDetails proposal={proposal} />
        </Suspense>

        {/* Spacer to prevent content from being hidden behind fixed action bar */}
        <FixedActionBarSpacer />
      </div>
    </div>
  );
}
