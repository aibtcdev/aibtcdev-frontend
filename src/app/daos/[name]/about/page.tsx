"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/daos/DaoExtensions";
import { MissionContent } from "@/components/daos/MissionContent";
import { fetchDAOExtensions, fetchDAOByName } from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";

export const runtime = "edge";

export default function AboutDAOPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID and description
  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
  });

  const daoId = dao?.id;

  // Then use the ID to fetch the extensions
  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => (daoId ? fetchDAOExtensions(daoId) : []),
    staleTime: 600000, // 10 minutes
    enabled: !!daoId, // Only run this query when we have the daoId
  });

  const isLoading = isLoadingDAO || isLoadingExtensions;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading DAO information...</p>
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
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Mission Section */}
      <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 p-4 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Mission</h2>
          <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
        </div>
        <MissionContent description={dao.description} />
      </div>

      {/* Extensions Section */}
      <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 p-4 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Extensions
          </h2>
          <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent"></div>
        </div>
        {daoExtensions && daoExtensions.length > 0 ? (
          <DAOExtensions extensions={daoExtensions} />
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400">No extensions found for this DAO.</p>
          </div>
        )}
      </div>
    </div>
  );
}
