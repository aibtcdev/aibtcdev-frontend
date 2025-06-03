"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Loader } from "@/components/reusables/Loader";
import DAOProposals from "@/components/daos/proposal/DAOProposal";
import { fetchProposals, fetchDAOByName, fetchToken } from "@/queries/dao-queries";
// import { Button } from "@/components/ui/button";
// import { format } from "date-fns";

export const runtime = "edge";

export default function ProposalsPage() {
  const params = useParams();
  const encodedName = params.name as string;
  // console.log(encodedName);
  // console.log("DAO name from URL:", encodedName);

  // First, fetch the DAO by name to get its ID
  const {
    data: dao,
    isLoading: isLoadingDAO,
    error: daoError,
  } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
  });

  // Add error handling
  if (daoError) {
    console.error("Error fetching DAO:", daoError);
  }

  const daoId = dao?.id;

  // console.log("Found DAO:", dao);
  // console.log("DAO ID:", daoId);

  // Fetch token information for the DAO
  const {
    data: token,
    isLoading: isLoadingToken,
  } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : Promise.resolve(null)),
    enabled: !!daoId,
  });

  // Then use the ID to fetch proposals
  const {
    data: proposals,
    isLoading,
    // refetch,
    // isRefetching,
    // dataUpdatedAt,
    error: proposalsError,
  } = useQuery({
    queryKey: ["proposals", daoId],
    queryFn: () => (daoId ? fetchProposals(daoId) : Promise.resolve([])),
    staleTime: 1000000,
    enabled: !!daoId, // Only run this query when we have the daoId
  });

  // Add error handling
  if (proposalsError) {
    console.error("Error fetching proposals:", proposalsError);
  }

  // const lastUpdated = dataUpdatedAt
  //   ? format(dataUpdatedAt, "HH:mm:ss")
  //   : "never";

  // const handleRefetch = () => {
  //   refetch();
  // };

  // Note: Realtime updates are now handled globally by SupabaseRealtimeProvider

  if (isLoadingDAO || isLoading || isLoadingToken) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  // Add error state
  if (!dao) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">DAO Not Found</h2>
          <p className="text-zinc-400">
            Could not find a DAO with the name &apos;
            {decodeURIComponent(encodedName)}&apos;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-0">
      {/* DON'T NEED THIS */}
      {/* <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefetch}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div> */}
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[400px] w-full">
            <div className="text-center space-y-4">
              <Loader />
              <p className="text-zinc-400">Loading proposals...</p>
            </div>
          </div>
        }
      >
        <DAOProposals 
          proposals={proposals || []} 
          tokenSymbol={token?.symbol || ""} 
        />
      </Suspense>
    </div>
  );
}
