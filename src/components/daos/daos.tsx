"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAOTable } from "./daos-table";
import type { DAO, SortField } from "@/types/supabase";
import { createDaoAgent } from "../agents/dao-agent";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDAOs,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
} from "@/queries/daoQueries";

export default function DAOs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("price");
  const { toast } = useToast();
  const agentInitialized = useRef(false);

  // Initialize DAO agent
  const initializeAgent = useCallback(async () => {
    if (agentInitialized.current) return;

    try {
      const agent = await createDaoAgent();
      if (agent) {
        toast({
          title: "DAO Agent Initialized",
          description: "Your DAO agent has been set up successfully.",
          variant: "default",
        });
        agentInitialized.current = true;
      }
    } catch (error) {
      console.error("Error initializing DAO agent:", error);
    }
  }, [toast]);

  useEffect(() => {
    initializeAgent();
  }, [initializeAgent]);

  // Fetch DAOs with TanStack Query
  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
    staleTime: 600000, // 10 minutes
  });

  // Fetch tokens with TanStack Query
  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    staleTime: 600000, // 10 minutes
  });

  // Fetch token prices with TanStack Query
  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices", daos, tokens],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
    staleTime: 600000, // 10 minutes
    refetchInterval: 300000, // Refetch every 5 minutes for price updates
  });

  // Helper function to get dex principal and token contract
  const getTokenContract = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find(
      (ext) => ext.type === "dex" || ext.type === "TOKEN_DEX"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    return dexPrincipal ? dexPrincipal.replace(/-dex$/, "") : null;
  }, []);

  // Fetch token trades for all DAOs
  const tradeQueries = useQueries({
    queries: (daos || []).map((dao) => {
      const tokenContract = getTokenContract(dao);
      return {
        queryKey: ["tokenTrades", dao.id, tokenContract], // Add dao.id
        queryFn: async () => {
          if (!tokenContract) return [];
          return fetchTokenTrades(tokenContract).then((trades) =>
            trades
              .map((trade) => ({
                timestamp: trade.timestamp,
                price: trade.pricePerToken,
              }))
              .sort((a, b) => a.timestamp - b.timestamp)
          );
        },
        enabled: !!tokenContract && !!dao.id, // Add dao.id check
        staleTime: 300000,
        cacheTime: 600000,
      };
    }),
  });

  // Filter and sort DAOs
  const filteredAndSortedDAOs = (() => {
    const filtered =
      daos?.filter(
        (dao) =>
          dao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dao.mission.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

    return filtered.sort((a, b) => {
      if (sortField === "created_at" || sortField === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (sortField === "oldest") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      const valueA = tokenPrices?.[a.id]?.[sortField] ?? 0;
      const valueB = tokenPrices?.[b.id]?.[sortField] ?? 0;
      return valueB - valueA;
    });
  })();

  // Create a map of trades data for each DAO
  const tradesMap = Object.fromEntries(
    tradeQueries.map((query, index) => [
      daos?.[index]?.id,
      {
        data: query.data || [],
        isLoading: query.isLoading,
      },
    ])
  );

  return (
    <div className="w-full">
      <div className="px-4 sm:px-6 lg:px-0 mx-auto space-y-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-auto">
            {!isLoadingDAOs && (
              <Heading className="text-2xl font-bold sm:text-3xl mb-2 px-2">
                AI DAOs: {filteredAndSortedDAOs.length}
              </Heading>
            )}
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 px-2">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search DAOs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <Select
              value={sortField}
              onValueChange={(value) => setSortField(value as SortField)}
            >
              <SelectTrigger className="w-full sm:w-[180px] px-2">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="holders">Holders</SelectItem>
                <SelectItem value="price">Token Price</SelectItem>
                <SelectItem value="price24hChanges">24h Change</SelectItem>
                <SelectItem value="marketCap">Market Cap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingDAOs ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DAOTable
            daos={filteredAndSortedDAOs}
            tokens={tokens}
            tokenPrices={tokenPrices}
            isFetchingPrice={isFetchingTokenPrices}
            trades={tradesMap}
          />
        )}

        {filteredAndSortedDAOs.length === 0 && !isLoadingDAOs && (
          <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-center text-muted-foreground">
              No DAOs found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
