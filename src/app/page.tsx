"use client";

// Root page now shows the aibtc-brw page directly
// The landing page has been replaced with the main view
import { Suspense } from "react";
import { Loader } from "@/components/reusables/Loader";
import DAOProposals from "@/components/proposals/DAOProposals";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDAOByName,
  fetchToken,
  fetchProposals,
} from "@/services/dao.service";
import { RootDAOPage } from "@/components/aidaos/RootDAOPage";
import { singleDaoName } from "@/config/features";

export const runtime = "edge";

function PageContent() {
  const daoName = singleDaoName;

  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", daoName],
    queryFn: () => fetchDAOByName(daoName),
    staleTime: 600000,
  });

  const daoId = dao?.id;

  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : Promise.resolve(null)),
    enabled: !!daoId,
    staleTime: 600000,
  });

  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", daoId],
    queryFn: () => (daoId ? fetchProposals(daoId) : Promise.resolve([])),
    enabled: !!daoId,
    staleTime: 600000,
  });

  if (isLoadingDAO || isLoadingToken || isLoadingProposals) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading proposals...</p>
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
    <DAOProposals
      key={`${dao.id}-${proposals?.length || 0}`}
      proposals={proposals || []}
      tokenSymbol={token?.symbol || ""}
      daoName={dao.name}
    />
  );
}

export default function RootPage() {
  return (
    <RootDAOPage daoName={singleDaoName}>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[400px] w-full">
            <div className="text-center space-y-4">
              <Loader />
              <p className="text-zinc-400">Loading content...</p>
            </div>
          </div>
        }
      >
        <PageContent />
      </Suspense>
    </RootDAOPage>
  );
}
