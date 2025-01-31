"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DAOExtensions from "@/components/daos/dao-extensions";
import { fetchDAOExtensions } from "@/queries/daoQueries";

export const runtime = "edge";

export default function ExtensionsPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: daoExtensions, isLoading } = useQuery({
    queryKey: ["daoExtensions", id],
    queryFn: () => fetchDAOExtensions(id),
    staleTime: 1000000,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {daoExtensions && daoExtensions.length > 0 && (
        <DAOExtensions extensions={daoExtensions} />
      )}
    </div>
  );
}
