"use client";
import { useCallback, useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Search, Users, Activity, Coins, BarChart3 } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";

import { DAOCard } from "@/components/daos/DaoCard";
import type { DAO, Holder } from "@/types";
import {
  fetchDAOsWithExtension,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
  fetchHolders,
} from "@/services/dao.service";

// Define TokenTrade interface locally since it's defined in queries but not exported
interface TokenTrade {
  txId: string;
  tokenContract: string;
  type: string;
  tokensAmount: number;
  ustxAmount: number;
  pricePerToken: number;
  maker: string;
  timestamp: number;
}

function CompactMetrics({
  totalDAOs,
  totalHolders,
  totalMarketCap,
}: {
  totalDAOs: number;
  totalHolders: number;
  totalMarketCap: number;
}) {
  const metrics = [
    { label: "AI DAOs", value: totalDAOs, icon: Activity },
    { label: "Holders", value: totalHolders.toLocaleString(), icon: Users },
    {
      label: "Market Cap",
      value: `$${totalMarketCap.toLocaleString()}`,
      icon: Coins,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 p-3 bg-muted/30 rounded-lg">
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex items-center gap-2 text-sm">
          <metric.icon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{metric.value}</span>
          <span className="text-muted-foreground">{metric.label}</span>
          {index < metrics.length - 1 && (
            <div className="w-px h-4 bg-border/50 ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AllDaos() {
  // Fetch DAOs with TanStack Query
  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOsWithExtension,
  });

  // Fetch tokens with TanStack Query
  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
  });

  // Fetch token prices with TanStack Query
  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices"],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
  });

  // Helper function to get dex principal and token contract
  const getTokenContract = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find(
      (ext) => ext.type === "dex" || ext.type === "TOKEN_DEX"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    return dexPrincipal ? dexPrincipal.replace(/-dex$/, "") : null;
  }, []);

  // Fetch token trades using useQueries for parallel fetching
  const tradeQueries = useQueries({
    queries:
      daos?.map((dao) => {
        const tokenContract = getTokenContract(dao);
        return {
          queryKey: ["tokenTrades", dao.id, tokenContract],
          queryFn: () => fetchTokenTrades(tokenContract!),
          enabled: !!tokenContract,
          staleTime: 5 * 60 * 1000, // 5 minutes
        };
      }) || [],
  });

  // Fetch holders for each DAO
  const holderQueries = useQueries({
    queries:
      daos?.map((dao) => {
        return {
          queryKey: ["holders", dao.id],
          queryFn: () => fetchHolders(dao.id),
          enabled: !!dao.id,
          staleTime: 10 * 60 * 1000, // 10 minutes
        };
      }) || [],
  });

  // Transform trades data for easy access
  const tradesMap = useMemo(() => {
    const map: Record<
      string,
      { data: Array<{ timestamp: number; price: number }>; isLoading: boolean }
    > = {};
    daos?.forEach((dao, index) => {
      const query = tradeQueries[index];
      // Transform TokenTrade data to the expected format
      const transformedData = (query?.data || []).map((trade: TokenTrade) => ({
        timestamp: trade.timestamp,
        price: trade.pricePerToken,
      }));

      map[dao.id] = {
        data: transformedData,
        isLoading: query?.isLoading || false,
      };
    });
    return map;
  }, [daos, tradeQueries]);

  // Transform holders data for easy access
  const holdersMap = useMemo(() => {
    const map: Record<
      string,
      {
        data: {
          holders: Holder[];
          totalSupply: number;
          holderCount: number;
        } | null;
        isLoading: boolean;
      }
    > = {};
    daos?.forEach((dao, index) => {
      const query = holderQueries[index];
      map[dao.id] = {
        data: query?.data || null,
        isLoading: query?.isLoading || false,
      };
    });
    return map;
  }, [daos, holderQueries]);

  // Calculate summary stats
  const totalDAOs = daos?.length || 0;

  const totalHolders =
    daos?.reduce((sum, dao) => {
      const holders =
        holdersMap[dao.id]?.data?.holderCount ||
        tokenPrices?.[dao.id]?.holders ||
        0;
      return sum + holders;
    }, 0) || 0;
  const totalMarketCap =
    daos?.reduce((sum, dao) => {
      return sum + (tokenPrices?.[dao.id]?.marketCap || 0);
    }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI DAOs</h1>
            <p className="text-sm text-muted-foreground">
              Discover autonomous organizations powered by artificial
              intelligence
            </p>
          </div>
        </div>

        {/* Compact Metrics */}
        <CompactMetrics
          totalDAOs={totalDAOs}
          totalHolders={totalHolders}
          totalMarketCap={totalMarketCap}
        />

        {/* Content */}
        <div className="space-y-4">
          {isLoadingDAOs ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <Loader />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    Loading AI DAOs
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Fetching autonomous organizations and their data...
                  </p>
                </div>
              </div>
            </div>
          ) : !daos || daos.length === 0 ? (
            <div className="border-dashed border rounded-lg py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    No DAOs Found
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    No AI DAOs are available at the moment. Check back later for
                    new autonomous organizations.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {daos.map((dao) => (
                  <DAOCard
                    key={dao.id}
                    dao={dao}
                    token={tokens?.find((t) => t.dao_id === dao.id)}
                    tokenPrice={tokenPrices?.[dao.id]}
                    isFetchingPrice={isFetchingTokenPrices}
                    trades={tradesMap[dao.id]}
                    holders={holdersMap[dao.id]}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
