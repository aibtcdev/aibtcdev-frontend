"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import AllProposals from "@/components/proposals/AllProposals";
import { fetchAllProposals } from "@/services/dao.service";

export const runtime = "edge";

export default function AllProposalsPage() {
  // Fetch all proposals across all DAOs
  const {
    data: proposals,
    isLoading,
    error: proposalsError,
  } = useQuery({
    queryKey: ["allProposals"],
    queryFn: () => fetchAllProposals(),
    staleTime: 1000000,
  });

  // Add error handling
  if (proposalsError) {
    console.error("Error fetching all proposals:", proposalsError);
  }

  // Note: Realtime updates are now handled globally by SupabaseRealtimeProvider

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <Loader />
      </div>
    );
  }

  // Add error state
  if (proposalsError) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Contributions
          </h2>
          <p className="text-muted-foreground">
            Failed to load contributions. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return <AllProposals proposals={proposals || []} />;
}
