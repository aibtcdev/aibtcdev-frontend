"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DAOExtensions from "@/components/daos/dao-extensions";
import { fetchDAOExtensions, fetchDAOByName } from "@/queries/dao-queries";
import { Loader } from "@/components/reusables/loader";

export const runtime = "edge";

export default function ExtensionsPage() {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID
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
