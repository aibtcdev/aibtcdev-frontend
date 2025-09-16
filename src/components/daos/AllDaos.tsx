"use client";
import { useCallback, useMemo, useState, useEffect } from "react";

import { useQuery, useQueries } from "@tanstack/react-query";
import { Search, TrendingUp, Users, Calendar, Activity } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DAOListItem } from "@/components/daos/DaoCard";
import type { DAO, Holder } from "@/types";
import {
  fetchDAOsWithExtension,
  fetchTokens,
  fetchTokenPrices,
  // fetchTokenTrades,
  fetchHolders,
  fetchProposalCounts,
} from "@/services/dao.service";

type SortOption =
  | "name"
  | "created"
  | "market_cap"
  | "holders"
  | "price_change";

function SearchAndFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
}) {
  return (
    <div className="space-y-4">
      {/* Main Toolbar - Filters Left, Search & Controls Right */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Left Side - Filter Chips */}
        <div className="flex flex-col sm:flex-row gap-3">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap self-start sm:self-center">
            Sort by:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSortChange("market_cap")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${
                sortBy === "market_cap"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20"
                  : "bg-gradient-to-r from-card to-card/80 text-foreground hover:from-primary/10 hover:to-primary/5 hover:text-primary border border-border/50 hover:border-primary/30"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Top Market Cap
            </button>
            <button
              onClick={() => onSortChange("created")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${
                sortBy === "created"
                  ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/25 ring-2 ring-secondary/20"
                  : "bg-gradient-to-r from-card to-card/80 text-foreground hover:from-secondary/10 hover:to-secondary/5 hover:text-secondary border border-border/50 hover:border-secondary/30"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Newest
            </button>
            <button
              onClick={() => onSortChange("holders")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${
                sortBy === "holders"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20"
                  : "bg-gradient-to-r from-card to-card/80 text-foreground hover:from-primary/10 hover:to-primary/5 hover:text-primary border border-border/50 hover:border-primary/30"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Most Holders
            </button>
            <button
              onClick={() => onSortChange("price_change")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 transform hover:scale-105 ${
                sortBy === "price_change"
                  ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/25 ring-2 ring-secondary/20"
                  : "bg-gradient-to-r from-card to-card/80 text-foreground hover:from-secondary/10 hover:to-secondary/5 hover:text-secondary border border-border/50 hover:border-secondary/30"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Most Active
            </button>
          </div>
        </div>

        {/* Right Side - Search & View Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
            <Input
              placeholder="Search AI DAOs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 w-64 bg-muted/10 border-none"
              aria-label="Search AI DAOs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListHeader() {
  return (
    <div className="sticky border-b top-0 z-10 bg-gradient-to-r from-background via-background/95 to-background backdrop-blur-md shadow-sm">
      <div className="grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_80px_100px] md:grid-cols-[2fr_100px_120px_100px] lg:grid-cols-[2fr_120px_140px_120px_120px] items-center gap-x-2 sm:gap-x-4 h-14 px-4">
        <div className="text-left text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent  tracking-wider">
          AI DAOs
        </div>
        <div className="text-right text-sm font-bold text-foreground/90 uppercase tracking-wider">
          Price
        </div>
        <div className="hidden sm:block text-right text-sm font-bold text-foreground/90 uppercase tracking-wider">
          Market Cap
        </div>
        <div className="hidden md:block text-right text-sm font-bold text-foreground/90 uppercase tracking-wider">
          Holders
        </div>
        <div className="hidden lg:block text-right text-sm font-bold text-foreground/90 uppercase tracking-wider">
          Contributions
        </div>
      </div>
    </div>
  );
}

// Mock DAO data for "Coming Soon" display
const createMockDAOs = (count: number): DAO[] => {
  const mockNames = [
    "AI Trading Bot DAO",
    "Neural Network DAO",
    "Quantum Computing DAO",
    "Machine Learning DAO",
    "Blockchain AI DAO",
    "Smart Contract DAO",
    "DeFi Analytics DAO",
    "Predictive AI DAO",
    "Autonomous Agent DAO",
    "Deep Learning DAO",
  ];

  const mockDescriptions = [
    "Advanced AI trading algorithms for optimal portfolio management",
    "Decentralized neural network training and deployment",
    "Quantum-enhanced blockchain solutions",
    "Community-driven machine learning model development",
    "AI-powered blockchain infrastructure",
    "Automated smart contract optimization",
    "DeFi market analysis and insights",
    "Predictive analytics for crypto markets",
    "Autonomous agent coordination platform",
    "Deep learning model marketplace",
  ];

  return Array.from(
    { length: count },
    (_, i) =>
      ({
        id: `mock-dao-${i + 1}`,
        name: mockNames[i] || `AI DAO ${i + 1}`,
        description:
          mockDescriptions[i] ||
          `Advanced AI-powered DAO for innovative blockchain solutions`,
        mission: `Advancing AI technology through decentralized governance`,
        website_url: "",
        x_url: "",
        telegram_url: "",
        image_url: "",
        is_graduated: false,
        is_deployed: false,
        created_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        author_id: "mock-author",
        extensions: [],
        is_mock: true, // Flag to identify mock DAOs
      }) as DAO & { is_mock: boolean }
  );
};

export default function AllDaos() {
  // State for search, filtering, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("market_cap");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

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

  console.log(tokenPrices);
  // Helper function to get dex principal and token contract
  // const getTokenContract = useCallback((dao: DAO) => {
  //   const dexExtension = dao.extensions?.find(
  //     (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
  //   );
  //   const dexPrincipal = dexExtension?.contract_principal;
  //   return dexPrincipal;
  // }, []);

  // Fetch token trades using useQueries for parallel fetching
  // const _tradeQueries = useQueries({
  //   queries:
  //     daos?.map((dao) => {
  //       const tokenContract = getTokenContract(dao);
  //       return {
  //         queryKey: ["tokenTrades", dao.id, tokenContract],
  //         queryFn: () => fetchTokenTrades(tokenContract!),
  //         enabled: !!tokenContract,
  //         staleTime: 5 * 60 * 1000, // 5 minutes
  //       };
  //     }) || [],
  // });

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

  //
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

  // Filter and sort DAOs with mock data when only one real DAO exists
  const filteredAndSortedDAOs = useMemo(() => {
    if (!daos) return [];

    let allDAOs = [...daos];

    // Add mock DAOs if there's only one real DAO
    if (daos.length === 1) {
      const mockDAOs = createMockDAOs(10);
      allDAOs = [...daos, ...mockDAOs];
    }

    const filtered = allDAOs.filter((dao) => {
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
          const proposalsA = proposalCounts?.[a.id] || 0;
          const proposalsB = proposalCounts?.[b.id] || 0;
          return proposalsB - proposalsA;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [daos, searchQuery, sortBy, tokenPrices, holdersMap, proposalCounts]);

  // Check if we should show search and filters (hide when only one real DAO)
  const shouldShowSearchAndFilters = daos && daos.length > 1;
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
  }, [currentPage, totalPages, handlePageChange]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-[2400px]">
        {/* Search and Filters - Only show when more than one real DAO */}
        {shouldShowSearchAndFilters && (
          <SearchAndFilters
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            totalResults={filteredAndSortedDAOs.length}
          />
        )}

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
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-card/50 via-card/30 to-card/20 backdrop-blur-md shadow-lg">
                <ListHeader />
                <div className="divide-y divide-border/30">
                  {paginatedDAOs.map((dao) => (
                    <DAOListItem
                      key={dao.id}
                      dao={dao}
                      token={tokens?.find((t) => t.dao_id === dao.id)}
                      tokenPrice={tokenPrices?.[dao.id]}
                      isFetchingPrice={isFetchingTokenPrices}
                      holders={holdersMap[dao.id]}
                      proposalCount={proposalCounts?.[dao.id]}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination - Bottom Right */}
              {filteredAndSortedDAOs.length > itemsPerPage && (
                <div className="mt-6 flex justify-end">
                  <div className="bg-gradient-to-r from-card/40 to-card/20 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      {/* Page Info */}
                      <span className="text-xs text-muted-foreground font-medium">
                        Page {currentPage} of {totalPages}
                      </span>

                      {/* Navigation Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/10 hover:text-primary"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Items count */}
                      <span className="text-xs text-muted-foreground font-medium border-l border-border/50 pl-3">
                        {filteredAndSortedDAOs.length} DAOs
                      </span>
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
