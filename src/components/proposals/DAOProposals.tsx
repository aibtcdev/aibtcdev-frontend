"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import ProposalCard from "@/components/proposals/ProposalCard";
import type { Proposal } from "@/types";
import { FileText, Loader2 } from "lucide-react";
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";
import { enableSingleDaoMode, singleDaoName } from "@/config/features";
import { useBatchProposalVotes } from "@/hooks/useBatchProposalVotes";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";

const ITEMS_PER_BATCH = 5;

interface DAOProposalsProps {
  proposals: Proposal[];
  tokenSymbol?: string;
  daoName?: string;
}

const DAOProposals = ({
  proposals,
  tokenSymbol = "",
  daoName = "",
}: DAOProposalsProps) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Filter deployed proposals
  const deployedProposals = useMemo(() => {
    let filtered = proposals.filter(
      (proposal) => proposal.status === "DEPLOYED"
    );
    if (
      enableSingleDaoMode &&
      daoName.toUpperCase() !== singleDaoName.toUpperCase()
    ) {
      filtered = [];
    }
    return filtered;
  }, [proposals, daoName]);

  // Fetch chain state once for all proposals
  const { data: chainState } = useQuery({
    queryKey: ["latestChainState"],
    queryFn: fetchLatestChainState,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const currentBlockHeight = chainState?.bitcoin_block_height
    ? Number(chainState.bitcoin_block_height)
    : null;

  // Batch fetch all vote and veto data at once
  const { proposalDataMap, isLoading: isLoadingData } = useBatchProposalVotes({
    proposals: deployedProposals,
    enabled: deployedProposals.length > 0,
  });

  const visibleProposals = useMemo(
    () => deployedProposals.slice(0, visibleCount),
    [deployedProposals, visibleCount]
  );

  const hasMore = visibleCount < deployedProposals.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_BATCH, deployedProposals.length)
      );
      setIsLoading(false);
    }, 150);
  }, [isLoading, hasMore, deployedProposals.length]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset visible count when proposals change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [proposals]);

  return (
    <DAOTabLayout
      title="Submission History"
      description="Explore all the work that has been submitted to AIBTC."
      isEmpty={deployedProposals.length === 0}
      emptyTitle="No Contributions Found"
      emptyIcon={FileText}
    >
      <div className="space-y-4">
        {isLoadingData && visibleProposals.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="divide-y">
            {visibleProposals.map((proposal) => {
              const data = proposalDataMap[proposal.id];
              return (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  tokenSymbol={tokenSymbol}
                  voteData={data?.voteData}
                  vetoData={data?.vetoData}
                  currentBlockHeight={currentBlockHeight}
                />
              );
            })}
          </div>
        )}

        {hasMore && (
          <div ref={loaderRef} className="flex justify-center py-6">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-sm text-muted-foreground">
                Scroll for more
              </span>
            )}
          </div>
        )}
      </div>
    </DAOTabLayout>
  );
};

export default DAOProposals;
