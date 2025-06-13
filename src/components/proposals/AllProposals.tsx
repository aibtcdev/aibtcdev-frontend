"use client";

import { useRef, useState, useMemo, useCallback } from "react";
// Removed unused Card imports
import { Button } from "@/components/ui/button";
import ProposalCard from "@/components/proposals/ProposalCard";
import {
  FilterSidebar,
  type FilterConfig,
  type FilterState,
  type SummaryStats,
} from "@/components/reusables/FilterSidebar";
import { Pagination } from "@/components/reusables/Pagination";
import type { ProposalWithDAO } from "@/types";
import {
  FileText,
  Filter,
  X,
  Vote,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTokens } from "@/hooks/useTokens";
import { getProposalStatus } from "@/utils/proposal";

interface AllProposalsProps {
  proposals: ProposalWithDAO[];
}

// Define sort options
type SortField = "newest" | "oldest" | "title" | "votes" | "status" | "dao";

function CompactMetrics({
  totalProposals,
  activeProposals,
  passedProposals,
  failedProposals,
}: {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  failedProposals: number;
}) {
  const metrics = [
    { label: "Total", value: totalProposals, icon: Activity },
    { label: "Active", value: activeProposals, icon: TrendingUp },
    { label: "Passed", value: passedProposals, icon: CheckCircle },
    { label: "Failed", value: failedProposals, icon: XCircle },
  ];

  return (
    <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
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

const AllProposals = ({ proposals }: AllProposalsProps) => {
  // Fetch tokens and create lookup map
  const { tokenLookup } = useTokens();
  const proposalsRef = useRef<HTMLDivElement>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter and pagination state
  const [filterState, setFilterState] = useState<FilterState>({
    search: "",
    dao: [],
    status: ["ACTIVE", "PASSED", "FAILED"], // Default to all except DRAFT
    sort: "newest",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Get unique DAOs for filter options
  const daoOptions = useMemo(() => {
    const uniqueDAOs = Array.from(
      new Set(proposals.map((p) => p.daos?.name).filter(Boolean))
    ).sort();

    return uniqueDAOs.map((dao) => ({ value: dao!, label: dao! }));
  }, [proposals]);

  // Calculate status counts for all proposals (for filter display) using consistent logic
  const allActiveProposals = proposals.filter(
    (p) => getProposalStatus(p) === "ACTIVE"
  ).length;
  const allPassedProposals = proposals.filter(
    (p) => getProposalStatus(p) === "PASSED"
  ).length;
  const allFailedProposals = proposals.filter(
    (p) => getProposalStatus(p) === "FAILED"
  ).length;
  const allDraftProposals = proposals.filter(
    (p) => getProposalStatus(p) === "DRAFT"
  ).length;

  // Filter configuration
  const filterConfig: FilterConfig[] = [
    {
      key: "search",
      label: "Search",
      type: "search",
      placeholder: "Search proposals...",
    },
    {
      key: "dao",
      label: "DAO",
      type: "multiselect",
      options: daoOptions,
    },
    {
      key: "status",
      label: "Status",
      type: "status",
      options: [
        { value: "ACTIVE", label: "Active", count: allActiveProposals },
        { value: "PASSED", label: "Passed", count: allPassedProposals },
        { value: "FAILED", label: "Failed", count: allFailedProposals },
        { value: "DRAFT", label: "Draft", count: allDraftProposals },
      ],
    },
    {
      key: "sort",
      label: "Sort By",
      type: "select",
      options: [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "title", label: "Title A-Z" },
        { value: "votes", label: "Most Votes" },
        { value: "status", label: "Status" },
        { value: "dao", label: "DAO Name" },
      ],
    },
  ];

  // Filter and sort logic
  const filteredAndSortedProposals = useMemo(() => {
    const filtered = proposals.filter((proposal) => {
      // Search filter
      if (filterState.search && typeof filterState.search === "string") {
        const searchTerm = filterState.search.toLowerCase();
        const matchesTitle =
          proposal.title?.toLowerCase().includes(searchTerm) || false;
        const matchesDAO =
          proposal.daos?.name?.toLowerCase().includes(searchTerm) || false;
        const matchesCreator =
          proposal.creator?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDAO && !matchesCreator) return false;
      }

      // DAO filter (multiselect - if nothing selected, show all)
      if (Array.isArray(filterState.dao) && filterState.dao.length > 0) {
        if (
          !proposal.daos?.name ||
          !filterState.dao.includes(proposal.daos.name)
        ) {
          return false;
        }
      }

      // Status filter (multiselect - if nothing selected, show all)
      if (Array.isArray(filterState.status) && filterState.status.length > 0) {
        const proposalStatus = getProposalStatus(proposal);
        if (!filterState.status.includes(proposalStatus)) {
          return false;
        }
      }

      return true;
    });

    // Sort logic
    const sortField = filterState.sort as SortField;
    filtered.sort((a, b) => {
      switch (sortField) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "votes":
          const votesA =
            Number(a.votes_for || 0) + Number(a.votes_against || 0);
          const votesB =
            Number(b.votes_for || 0) + Number(b.votes_against || 0);
          return votesB - votesA;
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        case "dao":
          const daoA = a.daos?.name || "";
          const daoB = b.daos?.name || "";
          return daoA.localeCompare(daoB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, filterState]);

  // Pagination logic
  const totalPages = Math.ceil(
    filteredAndSortedProposals.length / itemsPerPage
  );
  const paginatedProposals = filteredAndSortedProposals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics for filtered proposals using consistent status logic
  const totalProposals = filteredAndSortedProposals.length;
  const activeProposals = filteredAndSortedProposals.filter(
    (p) => getProposalStatus(p) === "ACTIVE"
  ).length;
  const passedProposals = filteredAndSortedProposals.filter(
    (p) => getProposalStatus(p) === "PASSED"
  ).length;
  const failedProposals = filteredAndSortedProposals.filter(
    (p) => getProposalStatus(p) === "FAILED"
  ).length;

  // Summary stats for sidebar
  const summaryStats: SummaryStats = {
    total: {
      label: "Total Proposals",
      value: totalProposals,
    },
    active: {
      label: "Active",
      value: activeProposals,
    },
    passed: {
      label: "Passed",
      value: passedProposals,
    },
    failed: {
      label: "Failed",
      value: failedProposals,
    },
  };

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      setFilterState((prev) => ({ ...prev, [key]: value }));
      setCurrentPage(1); // Reset to first page when filtering
    },
    []
  );

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    proposalsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Vote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Governance Proposals
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore and participate in DAO governance decisions
            </p>
          </div>
        </div>

        {/* Compact Metrics */}
        <CompactMetrics
          totalProposals={totalProposals}
          activeProposals={activeProposals}
          passedProposals={passedProposals}
          failedProposals={failedProposals}
        />

        {/* Filter Toggle for Mobile */}
        <div className="lg:hidden flex justify-between items-center">
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground truncate">
              All Proposals
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredAndSortedProposals.length > 0
                ? `${filteredAndSortedProposals.length} ${filteredAndSortedProposals.length === 1 ? "proposal" : "proposals"}`
                : "No proposals found"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-2 flex-shrink-0 ml-3"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden min-[420px]:inline">Filters</span>
          </Button>
        </div>

        {/* Mobile Filter Overlay */}
        {isMobileFilterOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[85vw] max-w-[320px] bg-card/95 backdrop-blur-xl border-l border-border/50 overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border/30 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-300 flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-4">
                <FilterSidebar
                  title=""
                  filters={filterConfig}
                  filterState={filterState}
                  onFilterChange={handleFilterChange}
                  summaryStats={summaryStats}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <FilterSidebar
              title="Filters"
              filters={filterConfig}
              filterState={filterState}
              onFilterChange={handleFilterChange}
              summaryStats={summaryStats}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Content Section Header */}
            <div className="space-y-2 mb-6">
              <div className="text-center lg:text-left">
                <h2 className="text-lg font-semibold text-foreground">
                  All Proposals ({filteredAndSortedProposals.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedProposals.length > 0
                    ? `${filteredAndSortedProposals.length === 1 ? "1 proposal" : `${filteredAndSortedProposals.length} proposals`} available`
                    : "No proposals match your current filters"}
                </p>
              </div>
            </div>

            {/* Proposals List */}
            <div ref={proposalsRef} className="space-y-4">
              {paginatedProposals.length === 0 ? (
                <div className="border-dashed border rounded-lg py-12">
                  <div className="text-center space-y-4 px-4">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">
                        No Proposals Found
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {totalProposals === 0
                          ? "No proposals have been created yet. Check back later for new governance proposals."
                          : "No proposals match your current search and filter criteria. Try adjusting your filters or search terms."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                paginatedProposals.map((proposal) => (
                  <ProposalCard
                    key={`${proposal.id}-${proposal.status}`}
                    proposal={proposal}
                    tokenSymbol={tokenLookup[proposal.dao_id || ""] || ""}
                    showDAOInfo={true}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredAndSortedProposals.length > 0 && (
              <div className="mt-8">
                <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border/50 p-4 overflow-x-auto">
                  <div className="min-w-[320px]">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAndSortedProposals.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProposals;
