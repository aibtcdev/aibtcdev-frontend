"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/daos/DaoExtensions";
import { fetchDAOByName, fetchDAOExtensions } from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";

export const runtime = "edge";

export default function ExtensionsPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // Fetch DAO to get its ID
  const { data: dao, isLoading: loadingDao } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
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
        <p className="text-zinc-400">No extensions found for this DAO.</p>
      </div>
    );
  }

  return <DAOExtensions extensions={extensions} />;
}
