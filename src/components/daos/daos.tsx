"use client";
import { useCallback, useState } from "react";
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
import {
  fetchDAOs,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
  fetchHolders,
} from "@/queries/dao-queries";

export default function DAOs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("newest");

  // Fetch DAOs with TanStack Query
  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
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

  // Fetch token trades for all DAOs
  const tradeQueries = useQueries({
    queries: (daos || []).map((dao) => {
      const tokenContract = getTokenContract(dao);
      return {
        queryKey: ["tokenTrades", dao.id],
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
        enabled: !!tokenContract && !!dao.id,
        // Global settings from QueryClient will apply here
      };
    }),
  });

  // Fetch detailed holders data for all DAOs
  const holdersQueries = useQueries({
    queries: (daos || []).map((dao) => {
      const token = tokens?.find((t) => t.dao_id === dao.id);
      return {
        queryKey: ["holders", dao.id],
        queryFn: async () => {
          if (!token?.contract_principal || !token?.symbol) return null;
          try {
            const holdersData = await fetchHolders(
              token.contract_principal,
              token.symbol
            );
            return holdersData;
          } catch (error) {
            console.error(`Error fetching holders for DAO ${dao.id}:`, error);
            return null;
          }
        },
        enabled: !!token?.contract_principal && !!token?.symbol,
      };
    }),
  });

  // Create a map of holders data for each DAO
  const holdersMap = Object.fromEntries(
    holdersQueries.map((query, index) => [
      daos?.[index]?.id,
      {
        data: query.data,
        isLoading: query.isLoading,
      },
    ])
  );

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

      if (sortField === "holders") {
        const holdersA =
          holdersMap[a.id]?.data?.holderCount ||
          tokenPrices?.[a.id]?.holders ||
          0;
        const holdersB =
          holdersMap[b.id]?.data?.holderCount ||
          tokenPrices?.[b.id]?.holders ||
          0;
        return holdersB - holdersA;
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
              <Heading className="text-2xl font-bold sm:text-3xl px-2">
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
            holders={holdersMap}
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
