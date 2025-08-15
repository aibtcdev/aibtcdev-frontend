"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ProposalWithDAO } from "@/types";
import { fetchProposalById } from "@/services/dao.service";
import ProposalDetails from "@/components/proposals/ProposalDetails";
import ProposalSidebar from "@/components/proposals/layout/ProposalSidebar";
import FixedActionBar, {
  FixedActionBarSpacer,
} from "@/components/proposals/layout/FixedActionBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Flag, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { safeString } from "@/utils/proposal";
import { format } from "date-fns";
import Link from "next/link";
import { getExplorerLink } from "@/utils/format";
import { Loader } from "@/components/reusables/Loader";
import { ProposalStatusBadge } from "@/components/proposals/ProposalBadge";

export const runtime = "edge";

function ProposalHeader({ proposal }: { proposal: ProposalWithDAO }) {
  const router = useRouter();

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 text-muted-foreground hover:text-foreground transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">
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

        {/* Mobile status badge - hidden on desktop since it's in sidebar */}
        <div className="flex items-center gap-3 flex-wrap lg:hidden">
          <ProposalStatusBadge proposal={proposal} size="lg" />
        </div>
      </div>

      {/* Category badge if available */}
      {proposal.type && (
        <div className="mb-4">
          <Badge
            variant="outline"
            className="text-secondary border-secondary/50 bg-secondary/10 hover:bg-secondary/20 transition-colors duration-150"
          >
            {proposal.type}
          </Badge>
        </div>
      )}
    </div>
  );
}

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

      {/* Desktop Layout: Sidebar + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:col-span-3">
          <ProposalSidebar
            proposal={proposal}
            // onVote={handleVote}
            // onShare={handleShare}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
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
