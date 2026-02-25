"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import NewProposalCard from "@/components/proposals/NewProposalCard";
import type { Proposal } from "@/types";
import { FileText, Loader2, Search, X } from "lucide-react";
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";
import { enableSingleDaoMode, singleDaoName } from "@/config/features";
import { useBatchProposalVotes } from "@/hooks/useBatchProposalVotes";
import { useQuery } from "@tanstack/react-query";
import { fetchLatestChainState } from "@/services/chain-state.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Filter deployed proposals with search and status filter
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

    // Apply search filter (search by username in reference link)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((proposal) => {
        // Extract reference link from content
        const referenceMatch = proposal.content?.match(
          /Reference:\s*(https?:\/\/\S+)/i
        );
        const referenceLink = referenceMatch?.[1] || "";

        // Search in the reference link for username
        return referenceLink.toLowerCase().includes(query);
      });
    }

    return filtered;
  }, [proposals, daoName, searchQuery]);

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

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const hasActiveSearch = searchQuery.trim() !== "";

  return (
    <DAOTabLayout
      title="Submission History"
      description="Explore all the work that has been submitted to AIBTC."
      isEmpty={deployedProposals.length === 0 && !hasActiveSearch}
      emptyTitle="No Contributions Found"
      emptyIcon={FileText}
      toolbar={
        <div className="relative w-full">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search contributions by X username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-none py-7"
          />
          {hasActiveSearch && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Results count */}
        {hasActiveSearch && (
          <div className="text-sm text-muted-foreground px-4">
            Found {deployedProposals.length}{" "}
            {deployedProposals.length === 1 ? "contribution" : "contributions"}
          </div>
        )}
        {isLoadingData && visibleProposals.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : deployedProposals.length === 0 && hasActiveSearch ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No contributions found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search
            </p>
            <Button variant="outline" onClick={clearSearch}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {visibleProposals.map((proposal) => {
              const data = proposalDataMap[proposal.id];
              return (
                <NewProposalCard
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
