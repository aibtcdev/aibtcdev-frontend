"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/client";
import { Loader2, Search } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { fetchTokenPrice } from "@/queries/daoQueries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAOCard } from "./daos-card";
import type { DAO, Token, SortField } from "@/types/supabase";
import { createDaoAgent } from "../agents/dao-agent";
import { useToast } from "@/hooks/use-toast";

const fetchDAOs = async (): Promise<DAO[]> => {
  const { data: daosData, error: daosError } = await supabase
    .from("daos")
    .select("*")
    .order("created_at", { ascending: false })
    .eq("is_broadcasted", true);

  if (daosError) throw daosError;
  if (!daosData) return [];

  const { data: xUsersData, error: xUsersError } = await supabase
    .from("x_users")
    .select("id, user_id");

  if (xUsersError) throw xUsersError;

  const { data: extensionsData, error: extensionsError } = await supabase
    .from("extensions")
    .select("*");

  if (extensionsError) throw extensionsError;

  return daosData.map((dao) => {
    const xUser = xUsersData?.find((user) => user.id === dao.author_id);
    return {
      ...dao,
      user_id: xUser?.user_id,
      extensions: extensionsData?.filter((cap) => cap.dao_id === dao.id) || [],
    };
  });
};

const fetchTokens = async (): Promise<Token[]> => {
  const { data: tokensData, error: tokensError } = await supabase
    .from("tokens")
    .select("*");
  if (tokensError) throw tokensError;
  return tokensData || [];
};

const fetchTokenPrices = async (
  daos: DAO[],
  tokens: Token[]
): Promise<
  Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  >
> => {
  const prices: Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  > = {};

  for (const dao of daos) {
    const extension = dao.extensions?.find((ext) => ext.type === "dex");
    const token = tokens?.find((t) => t.dao_id === dao.id);
    if (extension && token) {
      try {
        const priceUsd = await fetchTokenPrice(extension.contract_principal!);
        prices[dao.id] = priceUsd;
      } catch (error) {
        console.error(`Error fetching price for DAO ${dao.id}:`, error);
        prices[dao.id] = {
          price: 0,
          marketCap: 0,
          holders: 0,
          price24hChanges: null,
        };
      }
    }
  }
  return prices;
};

export default function DAOs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const { toast } = useToast();
  const agentInitialized = useRef(false);

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

  const { data: daos, isLoading: isLoadingDAOs } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
    staleTime: 1000000,
  });

  const { data: tokens } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    staleTime: 100000,
  });

  const { data: tokenPrices, isFetching: isFetchingTokenPrices } = useQuery({
    queryKey: ["tokenPrices", daos, tokens],
    queryFn: () => fetchTokenPrices(daos || [], tokens || []),
    enabled: !!daos && !!tokens,
    staleTime: 1000000,
  });

  const filteredAndSortedDAOs = (() => {
    const filtered =
      daos?.filter(
        (dao) =>
          dao.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dao.mission.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

    return filtered.sort((a, b) => {
      if (sortField === "created_at") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }

      const valueA = tokenPrices?.[a.id]?.[sortField] ?? 0;
      const valueB = tokenPrices?.[b.id]?.[sortField] ?? 0;
      return valueB - valueA;
    });
  })();

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Heading className="text-3xl font-bold sm:text-4xl">DAOs</Heading>
          <p className="text-lg text-muted-foreground">
            Explore and discover AI DAOs
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search DAOs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Sort by:</p>
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Added</SelectItem>
              <SelectItem value="price">Token Price</SelectItem>
              <SelectItem value="price24hChanges">24h Change</SelectItem>
              <SelectItem value="marketCap">Market Cap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isLoadingDAOs && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedDAOs.length} DAOs
          </p>
        )}
      </div>

      {isLoadingDAOs ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDAOs.map((dao) => {
            const token = tokens?.find((token) => token.dao_id === dao.id);
            const tokenPrice = tokenPrices?.[dao.id];

            return (
              <DAOCard
                key={dao.id}
                dao={dao}
                token={token}
                tokenPrice={tokenPrice}
                isFetchingPrice={isFetchingTokenPrices}
              />
            );
          })}
        </div>
      )}

      {filteredAndSortedDAOs.length === 0 && !isLoadingDAOs && (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-center text-muted-foreground">
            No DAOs found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
