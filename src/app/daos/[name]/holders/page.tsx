"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/reusables/Loader";
import DAOHolders from "@/components/daos/DaoHolders";
import {
  fetchToken,
  fetchHolders,
  fetchDAOByName,
} from "@/services/dao.service";

export const runtime = "edge";

export default function HoldersPage() {
  const params = useParams();
  const encodedName = params.name as string;
  const decodedName = decodeURIComponent(encodedName);
  // console.log(decodedName);

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", decodedName],
    queryFn: () => fetchDAOByName(decodedName),
  });

  const daoId = dao?.id;
  console.log(daoId);

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

  // console.log(token?.id);
  // console.log(token?.symbol);
  // console.log(token?.contract_principal);

  const isLoading = isLoadingDAO || isLoadingToken || isLoadingHolders;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
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
    <DAOHolders
      holders={holdersData?.holders || []}
      tokenSymbol={token?.symbol || ""}
    />
  );
}
