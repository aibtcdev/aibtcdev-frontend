"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import DAOHolders from "@/components/daos/dao-holders";
import { fetchToken, fetchHolders } from "@/queries/daoQueries";

export const runtime = "edge";

export default function HoldersPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id),
    staleTime: 1000000,
  });

  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", token?.contract_principal, token?.symbol],
    queryFn: () => fetchHolders(token!.contract_principal, token!.symbol),
    enabled: !!token?.contract_principal && !!token?.symbol,
  });

  const isLoading = isLoadingToken || isLoadingHolders;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <DAOHolders
        holders={holdersData?.holders || []}
        tokenSymbol={token?.symbol || ""}
      />
    </div>
  );
}
