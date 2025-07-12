"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import { VotesView } from "@/components/votes/VotesView";
import { fetchVotes } from "@/services/vote.service";

export const runtime = "edge";

export default function VotesPage() {
  // Fetch all votes
  const {
    data: votes,
    isLoading,
    error: votesError,
  } = useQuery({
    queryKey: ["votes"],
    queryFn: () => fetchVotes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Add error handling
  if (votesError) {
    console.error("Error fetching votes:", votesError);
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
  if (votesError) {
    return (
      <div className="flex justify-center items-center min-h-[200px] w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Votes</h2>
          <p className="text-muted-foreground">
            Failed to load votes. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return <VotesView votes={votes || []} />;
}
