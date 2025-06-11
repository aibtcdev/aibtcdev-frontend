"use client";

import type React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchToken,
  fetchDAOExtensions,
  fetchMarketStats,
  fetchTreasuryTokens,
  fetchTokenPrice,
  fetchHolders,
  fetchProposals,
  fetchDAOByName,
} from "@/services/dao.service";
import { DAOLayout } from "@/layouts";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const encodedName = params.name as string;

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAOByName } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000, // 10 minutes
  });

  const id = dao?.id;

  // Fetch token data - only if we have the DAO ID
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id!),
    enabled: !!id,
    staleTime: 600000, // 10 minutes
  });

  // Fetch extensions data - only if we have the DAO ID
  const { data: extensions } = useQuery({
    queryKey: ["extensions", id],
    queryFn: () => fetchDAOExtensions(id!),
    enabled: !!id,
    staleTime: 600000, // 10 minutes
  });

  const dex = extensions?.find((ext) => ext.type === "dex")?.contract_principal;
  const treasuryAddress = extensions?.find(
    (ext) => ext.type === "aibtc-treasury"
  )?.contract_principal;

  // Fetch token price
  const { data: tokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
  });

  // Fetch holders data
  const { data: holdersData } = useQuery({
    queryKey: ["holders", id],
    queryFn: () => fetchHolders(id!),
    enabled: !!id,
    staleTime: 600000, // 10 minutes
  });

  // Fetch proposals
  const { data: proposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id!),
    enabled: !!id,
    staleTime: 600000, // 10 minutes
  });

  // Fetch market stats
  const { data: marketStats } = useQuery({
    queryKey: ["marketStats", id, dex, token?.max_supply],
    queryFn: () => fetchMarketStats(dex!, id!, token!.max_supply || 0),
    enabled: !!dex && !!id && !!token,
  });

  // Fetch treasury tokens
  useQuery({
    queryKey: ["treasuryTokens", treasuryAddress, tokenPrice?.price],
    queryFn: () => fetchTreasuryTokens(treasuryAddress!, tokenPrice!.price),
    enabled: !!treasuryAddress && !!tokenPrice,
  });

  // Check if we're loading basic DAO info
  const isBasicLoading = isLoadingDAOByName || isLoadingToken;

  // Note: Overview loading state was used in the old monolithic layout
  // but is now handled individually by the extracted components

  // Create enhanced market stats - memoized to prevent infinite re-renders
  const enhancedMarketStats = useMemo(() => {
    if (marketStats) {
      return {
        ...marketStats,
        holderCount: holdersData?.holderCount || marketStats.holderCount,
      };
    }

    return {
      price: tokenPrice?.price || 0,
      marketCap: tokenPrice?.marketCap || 0,
      treasuryBalance: token?.max_supply
        ? token.max_supply * 0.8 * (tokenPrice?.price || 0)
        : 0,
      holderCount: holdersData?.holderCount || 0,
    };
  }, [
    marketStats,
    holdersData?.holderCount,
    tokenPrice?.price,
    tokenPrice?.marketCap,
    token?.max_supply,
  ]);

  // Calculate total proposals - memoized to prevent infinite re-renders
  const totalProposals = useMemo(() => {
    return proposals ? proposals.length : 0;
  }, [proposals]);

  return (
    <DAOLayout
      dao={dao || undefined}
      token={token}
      marketStats={enhancedMarketStats}
      proposalCount={totalProposals}
      isLoading={isBasicLoading}
      daoName={encodedName}
    >
      {children}
    </DAOLayout>
  );
}
