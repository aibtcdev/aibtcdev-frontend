"use client";

import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/aidaos/DaoExtensions";
import { fetchDAOByName, fetchDAOExtensions } from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";
import { singleDaoName } from "@/config/features";

export const runtime = "edge";

export default function ExtensionsPage() {
  const daoName = singleDaoName;

  // Fetch DAO to get its ID
  const { data: dao, isLoading: loadingDao } = useQuery({
    queryKey: ["dao", daoName],
    queryFn: () => fetchDAOByName(daoName),
  });
  const daoId = dao?.id;

  // Fetch extensions
  const { data: extensions, isLoading: loadingExt } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => (daoId ? fetchDAOExtensions(daoId) : []),
    enabled: !!daoId,
    staleTime: 600000,
  });

  const isLoading = loadingDao || loadingExt;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading extensions...</p>
        </div>
      </div>
    );
  }

  if (!extensions || extensions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No extensions found.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-16">
      <DAOExtensions extensions={extensions} />
    </div>
  );
}
