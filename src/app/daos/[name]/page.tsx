"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useCallback, useMemo } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import DAOProposals from "@/components/daos/proposal/DAOProposal";
import { fetchProposals, fetchDAOByName } from "@/queries/dao-queries";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { queryKeys } from "@/lib/react-query";

export const runtime = "edge";

/**
 * DAONotFound component to display when a DAO is not found
 */
const DAONotFound = ({ name }: { name: string }) => (
  <div className="flex justify-center items-center min-h-[200px] w-full">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2">DAO Not Found</h2>
      <p className="text-muted-foreground">
        Could not find a DAO with the name &apos;{name}&apos;
      </p>
    </div>
  </div>
);

/**
 * LoadingState component for displaying loading state
 */
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-[200px] w-full">
    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function ProposalsPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // Fetch DAO by name - this is the primary data we need
  const {
    data: dao,
    isLoading: isLoadingDAO,
    error: daoError,
  } = useQuery({
    queryKey: queryKeys.dao(encodedName),
    queryFn: () => fetchDAOByName(encodedName),
  });

  // Only fetch proposals if we have the DAO ID
  const daoId = dao?.id;

  // Memoize the query options to prevent unnecessary re-renders
  const proposalsQueryOptions = useMemo(
    () => ({
      queryKey: queryKeys.proposals(daoId || ""),
      queryFn: () => (daoId ? fetchProposals(daoId) : Promise.resolve([])),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!daoId, // Only run this query when we have the daoId
    }),
    [daoId]
  );

  const {
    data: proposals,
    isLoading: isLoadingProposals,
    refetch,
    isRefetching,
    dataUpdatedAt,
    error: proposalsError,
  } = useQuery(proposalsQueryOptions);

  // Memoize the last updated time to prevent unnecessary re-renders
  const lastUpdated = useMemo(
    () => (dataUpdatedAt ? format(dataUpdatedAt, "HH:mm:ss") : "never"),
    [dataUpdatedAt]
  );

  // Memoize the refetch handler to prevent unnecessary re-renders
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle loading state
  if (isLoadingDAO) {
    return <LoadingState />;
  }

  // Handle error state
  if (daoError || !dao) {
    return <DAONotFound name={decodeURIComponent(encodedName)} />;
  }

  return (
    <div className="w-full px-4 sm:px-0">
      <div className="flex justify-between items-center mb-4">
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
      </div>
      <Suspense fallback={<LoadingState />}>
        <DAOProposals proposals={proposals || []} />
      </Suspense>
    </div>
  );
}
