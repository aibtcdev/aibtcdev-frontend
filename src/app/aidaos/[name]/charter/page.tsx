"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MissionContent } from "@/components/aidaos/MissionContent";
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
          <p className="text-zinc-400">Loading information...</p>
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
            Could not find '{decodeURIComponent(encodedName)}'
          </p>
        </div>
      </div>
    );
  }

  return <MissionContent description={dao.description} />;
}
