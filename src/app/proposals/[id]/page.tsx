"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { fetchProposalById } from "@/services/dao.service";
import ProposalDetails from "@/components/proposals/ProposalDetails";
import { FixedActionBarSpacer } from "@/components/proposals/layout/FixedActionBar";
import { ProposalHeader } from "@/components/proposals/ProposalHeader";
import { TimeRemainingMetric } from "@/components/proposals/layout/TimeRemainingMetric";
import { Loader } from "@/components/reusables/Loader";

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
    <div className="px-4 sm:px-6 lg:px-16 mx-auto w-full py-4 sm:py-6">
      <ProposalHeader proposal={proposal} />

      {/* Time Remaining Metric Section */}
      <div className="mb-4 sm:mb-6 rounded-sm p-3 sm:p-4 bg-card/50 border border-border/30">
        <TimeRemainingMetric proposal={proposal} />
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
