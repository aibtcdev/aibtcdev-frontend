"use client";

import type React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchProposalById } from "@/services/dao.service";

export function ProposalDetailsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const proposalId = params.id as string;

  // Pre-fetch proposal data with React Query for caching
  useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: () => fetchProposalById(proposalId),
    staleTime: 300000, // 5 minutes
  });

  return (
    <main className="w-full min-h-screen">
      <div className="flex-1 w-full">{children}</div>
    </main>
  );
}
