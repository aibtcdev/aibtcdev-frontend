"use client";

import { Suspense } from "react";
import { Loader } from "@/components/reusables/Loader";
import DAOProposals from "@/components/proposals/DAOProposals";
// import { ProposalSubmission } from "@/components/proposals/ProposalSubmission";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDAOByName,
  fetchToken,
  fetchProposals,
} from "@/services/dao.service";

export const runtime = "edge";

function PageContent() {
  const params = useParams();
  const encodedName = params.name as string;

  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
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
          <p className="text-zinc-400">
            Could not find &apos;{decodeURIComponent(encodedName)}&apos;
          </p>
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

export default function ProposalsPage() {
  return (
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
  );
}
