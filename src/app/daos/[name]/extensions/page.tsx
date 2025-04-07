"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/daos/dao-extensions";
import { fetchDAOExtensions, fetchDAOByName } from "@/queries/dao-queries";
import { Loader } from "@/components/reusables/loader";
import { queryKeys } from "@/lib/react-query";
import { useMemo } from "react";

export const runtime = "edge";

/**
 * ExtensionsPage component for displaying DAO extensions
 * - Uses React Query for data fetching with proper caching
 * - Implements dependent queries pattern
 * - Uses memoization to prevent unnecessary re-renders
 */
export default function ExtensionsPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: queryKeys.dao(encodedName),
    queryFn: () => fetchDAOByName(encodedName),
  });

  // Memoize the DAO ID to prevent unnecessary re-renders
  const daoId = useMemo(() => dao?.id, [dao]);

  // Memoize the extensions query options to prevent unnecessary re-renders
  const extensionsQueryOptions = useMemo(
    () => ({
      queryKey: queryKeys.extensions(daoId || ""),
      queryFn: () => (daoId ? fetchDAOExtensions(daoId) : []),
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!daoId, // Only run this query when we have the daoId
    }),
    [daoId]
  );

  // Then use the ID to fetch the extensions
  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery(
    extensionsQueryOptions
  );

  // Determine overall loading state
  const isLoading = isLoadingDAO || isLoadingExtensions;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {daoExtensions && daoExtensions.length > 0 && (
        <DAOExtensions extensions={daoExtensions} />
      )}
    </div>
  );
}
