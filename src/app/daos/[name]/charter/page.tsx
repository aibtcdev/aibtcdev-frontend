"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MissionContent } from "@/components/daos/MissionContent";
import { fetchDAOByName } from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";

export const runtime = "edge";

export default function CharterDAOPage() {
  const params = useParams();
  const encodedName = params.name as string;

  const { data: dao, isLoading } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
  });

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
            Could not find a DAO with the name '
            {decodeURIComponent(encodedName)}'
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/30 p-4 sm:p-8">
        <MissionContent description={dao.description} />
      </div>
    </div>
  );
}
