"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Loader } from "@/components/reusables/Loader";
import DAOProposals from "@/components/proposals/DAOProposal";
import {
  fetchProposals,
  fetchDAOByName,
  fetchToken,
} from "@/services/dao.service";

export const runtime = "edge";

export default function ProposalsPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID
  const {
    data: dao,
    isLoading: isLoadingDAO,
    error: daoError,
  } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000, // 10 minutes
  });

  // Add error handling
  if (daoError) {
    console.error("Error fetching DAO:", daoError);
  }

  const daoId = dao?.id;

  // Fetch token information for the DAO
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : Promise.resolve(null)),
    enabled: !!daoId,
    staleTime: 600000, // 10 minutes
  });

  // Then use the ID to fetch proposals
  const {
    data: proposals,
    isLoading,
    error: proposalsError,
  } = useQuery({
    queryKey: ["proposals", daoId],
    queryFn: () => (daoId ? fetchProposals(daoId) : Promise.resolve([])),
    staleTime: 600000, // 10 minutes - increased cache time
    enabled: !!daoId, // Only run this query when we have the daoId
  });

  // Add error handling
  if (proposalsError) {
    console.error("Error fetching proposals:", proposalsError);
  }

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
          key={`${dao.id}-${proposals?.length || 0}`}
          proposals={proposals || []}
          tokenSymbol={token?.symbol || ""}
        />
      </Suspense>
    </div>
  );
}
