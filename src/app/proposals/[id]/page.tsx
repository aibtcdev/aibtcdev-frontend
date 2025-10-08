"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ProposalWithDAO } from "@/types";
import { fetchProposalById } from "@/services/dao.service";
import ProposalDetails from "@/components/proposals/ProposalDetails";
import FixedActionBar, {
  FixedActionBarSpacer,
} from "@/components/proposals/layout/FixedActionBar";
import { ProposalHeader } from "@/components/proposals/ProposalHeader";
import { Flag, MessageSquare } from "lucide-react";
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

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log("Report clicked");
  };

  const handleDiscuss = () => {
    // TODO: Implement discussion functionality
    console.log("Discuss clicked");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
      <ProposalHeader proposal={proposal} />

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

      {/* Mobile Fixed Action Bar - One Primary Action */}
      <FixedActionBar
        // onPrimaryAction={handleVote}
        // onSecondaryAction={handleShare}
        primaryActionLabel="Vote"
        secondaryActions={[
          {
            label: "Discuss",
            icon: <MessageSquare className="h-4 w-4" />,
            onClick: handleDiscuss,
          },
          {
            label: "Report",
            icon: <Flag className="h-4 w-4" />,
            onClick: handleReport,
            variant: "destructive",
          },
        ]}
      />
    </div>
  );
}
