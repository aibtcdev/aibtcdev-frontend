"use client";

import { useQuery } from "@tanstack/react-query";
import { MissionContent } from "@/components/aidaos/MissionContent";
import { fetchDAOByName } from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";
import { singleDaoName } from "@/config/features";

export const runtime = "edge";

export default function AIBTCCharterPage() {
  const { data: dao, isLoading } = useQuery({
    queryKey: ["dao", singleDaoName],
    queryFn: () => fetchDAOByName(singleDaoName),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading charter...</p>
        </div>
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold text-white">
            Charter Not Found
          </h2>
          <p className="text-zinc-400">
            Could not find the {singleDaoName} charter information.
          </p>
        </div>
      </div>
    );
  }

  return <MissionContent description={dao.description} />;
}
