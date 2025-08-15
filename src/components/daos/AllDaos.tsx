"use client";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useViewMode } from "@/hooks/useView";

import { useQuery, useQueries } from "@tanstack/react-query";
import { Search, Grid3X3, List, Filter } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/reusables/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DAOCard, DAOListItem } from "@/components/daos/DaoCard";
import type { DAO, Holder } from "@/types";
import {
  fetchDAOsWithExtension,
  fetchTokens,
  fetchTokenPrices,
  fetchTokenTrades,
  fetchHolders,
  fetchProposalCounts,
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

type SortOption =
  | "name"
  | "created"
  | "market_cap"
  | "holders"
  | "price_change";
type ViewMode = "grid" | "list";

function SearchAndFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalResults,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md group">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
        <Input
          placeholder="Search DAOs by name, description, or mission..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 text-sm bg-background border-border text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-border/80 transition-all duration-300"
          aria-label="Search DAOs"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Results count */}
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {totalResults} result{totalResults !== 1 ? "s" : ""}
        </span>

        {/* Sort */}
        <Select
          value={sortBy}
          onValueChange={(value: SortOption) => onSortChange(value)}
        >
          <SelectTrigger className="w-[140px] h-10 bg-background border-border">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="name" className="text-foreground hover:bg-muted">
              Name
            </SelectItem>
            <SelectItem
              value="created"
              className="text-foreground hover:bg-muted"
            >
              Newest
            </SelectItem>
            <SelectItem
              value="market_cap"
              className="text-foreground hover:bg-muted"
            >
              Market Cap
            </SelectItem>
            <SelectItem
              value="holders"
              className="text-foreground hover:bg-muted"
            >
              Holders
            </SelectItem>
            <SelectItem
              value="price_change"
              className="text-foreground hover:bg-muted"
            >
              Price Change
            </SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted/30 rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className="h-8 w-8 p-0"
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className="h-8 w-8 p-0"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListHeader() {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,3fr)_repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,3fr)_repeat(3,minmax(0,1fr))] xl:grid-cols-[minmax(0,3fr)_repeat(4,minmax(0,1fr))] items-center gap-x-4 h-10">
        <div className="px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          DAO
        </div>
        <div className="px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Price
        </div>
        <div className="hidden md:block px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Market Cap
        </div>
        <div className="hidden lg:block px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Holders
        </div>
        <div className="hidden xl:block px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contributions
        </div>
      </div>
      <div className="border-b border-border/50 -mt-px" />
    </div>
  );
}

export default function AllDaos() {
  // State for search, filtering, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("market_cap");
  const [viewMode, setViewMode] = useViewMode();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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

  const { data: proposalCounts } = useQuery({
    queryKey: ["proposalCounts"],
    queryFn: fetchProposalCounts,
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
      (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    return dexPrincipal;
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

  // Filter and sort DAOs
  const filteredAndSortedDAOs = useMemo(() => {
    if (!daos) return [];

    const filtered = daos.filter((dao) => {
      const query = searchQuery.toLowerCase();
      try {
        return (
          dao.name.toLowerCase().includes(query) ||
          dao.description?.toLowerCase().includes(query) ||
          dao.mission?.toLowerCase().includes(query)
        );
      } catch (e) {
        console.error("Error filtering DAOs:", e);
        return false;
      }
    });

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "created":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "market_cap":
        filtered.sort((a, b) => {
          const marketCapA = tokenPrices?.[a.id]?.marketCap || 0;
          const marketCapB = tokenPrices?.[b.id]?.marketCap || 0;
          return marketCapB - marketCapA;
        });
        break;
      case "holders":
        filtered.sort((a, b) => {
          const holdersA = holdersMap[a.id]?.data?.holderCount || 0;
          const holdersB = holdersMap[b.id]?.data?.holderCount || 0;
          return holdersB - holdersA;
        });
        break;
      case "price_change":
        filtered.sort((a, b) => {
          const changeA = tokenPrices?.[a.id]?.price24hChanges || 0;
          const changeB = tokenPrices?.[b.id]?.price24hChanges || 0;
          return changeB - changeA;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [daos, searchQuery, sortBy, tokenPrices, holdersMap]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedDAOs.length / itemsPerPage);
  const paginatedDAOs = filteredAndSortedDAOs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Reset pagination when search or sort changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  // Keyboard shortcuts for better navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "/":
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector(
            'input[aria-label="Search DAOs"]'
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
        case "g":
          if (e.shiftKey) {
            e.preventDefault();
            setViewMode(viewMode === "grid" ? "list" : "grid");
          }
          break;
        case "ArrowLeft":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (currentPage > 1) {
              handlePageChange(currentPage - 1);
            }
          }
          break;
        case "ArrowRight":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            if (currentPage < totalPages) {
              handlePageChange(currentPage + 1);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentPage, totalPages, handlePageChange, viewMode, setViewMode]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-[2400px]">
        {/* Search and Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResults={filteredAndSortedDAOs.length}
        />

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
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
          ) : filteredAndSortedDAOs.length === 0 ? (
            <div className="border-dashed border rounded-lg py-12">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">
                    {searchQuery ? "No DAOs Found" : "No DAOs Available"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {searchQuery
                      ? `No AI DAOs match "${searchQuery}". Try a different search term.`
                      : "No AI DAOs are available at the moment. Check back later for new autonomous organizations."}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery("")}
                      className="mt-4"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  {paginatedDAOs.map((dao) => (
                    <DAOCard
                      key={dao.id}
                      dao={dao}
                      token={tokens?.find((t) => t.dao_id === dao.id)}
                      tokenPrice={tokenPrices?.[dao.id]}
                      isFetchingPrice={isFetchingTokenPrices}
                      trades={tradesMap[dao.id]}
                      holders={holdersMap[dao.id]}
                      proposalCount={proposalCounts?.[dao.id]}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <ListHeader />
                  <div className="divide-y divide-border/50">
                    {paginatedDAOs.map((dao) => (
                      <div
                        key={dao.id}
                        className="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,3fr)_repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,3fr)_repeat(3,minmax(0,1fr))] xl:grid-cols-[minmax(0,3fr)_repeat(4,minmax(0,1fr))_min-content] items-center gap-x-4 h-16 hover:bg-muted/50 transition-colors"
                      >
                        <DAOListItem
                          dao={dao}
                          token={tokens?.find((t) => t.dao_id === dao.id)}
                          tokenPrice={tokenPrices?.[dao.id]}
                          isFetchingPrice={isFetchingTokenPrices}
                          holders={holdersMap[dao.id]}
                          proposalCount={proposalCounts?.[dao.id]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {filteredAndSortedDAOs.length > itemsPerPage && (
                <div className="mt-6 sm:mt-8">
                  <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 p-2 sm:p-4 overflow-x-auto">
                    <div className="min-w-[320px]">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAndSortedDAOs.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
