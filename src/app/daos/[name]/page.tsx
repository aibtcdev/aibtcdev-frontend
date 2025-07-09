"use client";

import { Suspense } from "react";
import { Loader } from "@/components/reusables/Loader";
import DAOProposals from "@/components/proposals/DAOProposals";
import { ProposalSubmission } from "@/components/proposals/ProposalSubmission";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDAOByName,
  fetchToken,
  fetchProposals,
  fetchDAOExtensions,
} from "@/services/dao.service";
import { fetchAgents } from "@/services/agent.service";
import { useAuth } from "@/hooks/useAuth";
import { ApproveAssetButton } from "@/components/account/ApproveAsset";

export const runtime = "edge";

function PageContent() {
  const params = useParams();
  const encodedName = params.name as string;
  const { accessToken, userId } = useAuth();

  const { data: dao, isLoading: isLoadingDAO } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000,
  });

  const daoId = dao?.id;

  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => (daoId ? fetchToken(daoId) : Promise.resolve(null)),
    enabled: !!daoId,
    staleTime: 600000,
  });

  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", daoId],
    queryFn: () => (daoId ? fetchProposals(daoId) : Promise.resolve([])),
    enabled: !!daoId,
    staleTime: 600000,
  });

  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId!),
    enabled: !!daoId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000,
  });

  // Check if proposal submission is enabled
  const isProposalSubmissionEnabled = () => {
    if (!accessToken || !daoExtensions || !agents || !userId) return false;

    const userAgent = agents.find((agent) => agent.profile_id === userId);
    const votingExt = daoExtensions.find(
      (ext) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    return !!(userAgent?.account_contract && votingExt?.contract_principal);
  };

  const getEnableProposalButton = () => {
    if (!accessToken || !daoExtensions || !agents || !userId) return null;

    const userAgent = agents.find((agent) => agent.profile_id === userId);
    const votingExt = daoExtensions.find(
      (ext) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );

    if (!userAgent?.account_contract || !votingExt?.contract_principal)
      return null;

    return (
      <ApproveAssetButton
        contractToApprove={votingExt.contract_principal}
        agentAccountContract={userAgent.account_contract}
        onSuccess={() => {
          console.log("Proposal contract approved");
        }}
      />
    );
  };

  if (
    isLoadingDAO ||
    isLoadingToken ||
    isLoadingProposals ||
    isLoadingExtensions ||
    isLoadingAgents
  ) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center space-y-4">
          <Loader />
          <p className="text-zinc-400">Loading proposals...</p>
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
    <div className="w-full space-y-6">
      {accessToken && !isProposalSubmissionEnabled() ? (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Enable Proposal Submission
              </h2>
              <p className="text-muted-foreground">
                Before you can submit contributions, you need to enable proposal
                submission for this DAO.
              </p>
            </div>
            <div className="flex-shrink-0">{getEnableProposalButton()}</div>
          </div>
        </div>
      ) : (
        <ProposalSubmission daoId={dao.id} />
      )}
      <DAOProposals
        key={`${dao.id}-${proposals?.length || 0}`}
        proposals={proposals || []}
        tokenSymbol={token?.symbol || ""}
      />
    </div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px] w-full">
          <div className="text-center space-y-4">
            <Loader />
            <p className="text-zinc-400">Loading content...</p>
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
