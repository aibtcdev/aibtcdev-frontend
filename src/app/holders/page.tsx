"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import DAOHolders from "@/components/aidaos/DaoHolders";
import {
  fetchToken,
  fetchHolders,
  fetchDAOByName,
} from "@/services/dao.service";
import { singleDaoName } from "@/config/features";

export const runtime = "edge";

export default function HoldersPage() {
  const daoName = singleDaoName;

  // First, fetch by name to get its ID
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", daoName],
    queryFn: () => fetchDAOByName(daoName),
  });

  const daoId = dao?.id;

  // Then use the ID to fetch the token
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : null),
    staleTime: 600000, // 10 minutes
    enabled: !!daoId, // Only run this query when we have the daoId
  });

  // Finally fetch the holders using the DAO ID
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", daoId],
    queryFn: () => fetchHolders(daoId!),
    enabled: !!daoId,
  });

  const isLoading = isLoadingDAO || isLoadingToken || isLoadingHolders;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center  w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading holders...</p>
        </div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">Not Found</h2>
          <p className="text-zinc-400">Could not find {singleDaoName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-16">
      <DAOHolders
        holders={holdersData?.holders || []}
        tokenSymbol={token?.symbol || ""}
      />
    </div>
  );
}
