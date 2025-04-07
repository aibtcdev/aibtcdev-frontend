"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DAOHolders from "@/components/daos/dao-holders";
import {
  fetchToken,
  fetchHolders,
  fetchDAOByName,
} from "@/queries/dao-queries";
import { queryKeys } from "@/lib/react-query";
import { useMemo } from "react";

export const runtime = "edge";

/**
 * HoldersPage component for displaying DAO token holders
 * - Uses React Query for data fetching with proper caching
 * - Implements dependent queries pattern
 * - Uses memoization to prevent unnecessary re-renders
 */
export default function HoldersPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: queryKeys.dao(encodedName),
    queryFn: () => fetchDAOByName(encodedName),
  });

  // Memoize the DAO ID to prevent unnecessary re-renders
  const daoId = useMemo(() => dao?.id, [dao]);

  // Memoize the token query options to prevent unnecessary re-renders
  const tokenQueryOptions = useMemo(
    () => ({
      queryKey: queryKeys.token(daoId || ""),
      queryFn: () => (daoId ? fetchToken(daoId) : null),
      staleTime: 10 * 60 * 1000, // 10 minutes
      enabled: !!daoId, // Only run this query when we have the daoId
    }),
    [daoId]
  );

  // Then use the ID to fetch the token
  const { data: token, isLoading: isLoadingToken } =
    useQuery(tokenQueryOptions);

  // Memoize the holders query options to prevent unnecessary re-renders
  const holdersQueryOptions = useMemo(
    () => ({
      queryKey: queryKeys.holders(
        token?.contract_principal || "",
        token?.symbol || ""
      ),
      queryFn: () => fetchHolders(token!.contract_principal, token!.symbol),
      staleTime: 5 * 60 * 1000, // 5 minutes
      enabled: !!token?.contract_principal && !!token?.symbol,
    }),
    [token]
  );

  // Finally fetch the holders using the token data
  const { data: holdersData, isLoading: isLoadingHolders } =
    useQuery(holdersQueryOptions);

  // Determine overall loading state
  const isLoading = isLoadingDAO || isLoadingToken || isLoadingHolders;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <DAOHolders
        holders={holdersData?.holders || []}
        tokenSymbol={token?.symbol || ""}
      />
    </div>
  );
}
