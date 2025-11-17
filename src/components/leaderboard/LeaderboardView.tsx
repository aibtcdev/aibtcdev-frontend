"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserMetrics } from "@/services/metrics.service";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getExplorerLink } from "@/utils/format";

interface LeaderboardViewProps {
  metrics: UserMetrics[];
}

type SortField =
  | "username"
  | "totalProposals"
  | "passedProposals"
  | "failedProposals"
  | "pendingProposals"
  | "successRate"
  | "btcEarned";
type SortDirection = "asc" | "desc";

const LeaderboardView = ({ metrics }: LeaderboardViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalProposals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field - default to desc for numbers, asc for text
      setSortField(field);
      setSortDirection(field === "username" ? "asc" : "desc");
    }
  };

  // Filter and sort metrics
  const filteredAndSortedMetrics = useMemo(() => {
    // Filter by search query
    const filtered = metrics.filter((metric) => {
      const query = searchQuery.toLowerCase();
      return (
        (metric.username && metric.username.toLowerCase().includes(query)) ||
        metric.address.toLowerCase().includes(query)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [metrics, searchQuery, sortField, sortDirection]);

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Format username display - show username or truncated address
  const formatUsername = (username: string, address: string) => {
    if (username) return username;
    // Truncate address: first 5 + ... + last 5
    if (address.length > 13) {
      return `${address.slice(0, 5)}...${address.slice(-5)}`;
    }
    return address;
  };

  // Get link for user - X profile or explorer
  const getUserLink = (username: string, address: string) => {
    if (username) {
      return `https://x.com/${username}`;
    }
    return getExplorerLink("address", address);
  };

  return (
    <div className="min-h-screen py-4 px-4 space-y-6 md:px-16">
      {/* Leaderboard Title */}
      <h1 className="text-3xl font-bold text-center">Leaderboard</h1>

      {/* Header with sorting and search */}
      <div className="flex flex-col items-stretch gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium whitespace-nowrap">
            Sort by:
          </span>

          <Badge
            variant={sortField === "totalProposals" ? "default" : "outline"}
            onClick={() => handleSort("totalProposals")}
            className="cursor-pointer hover:bg-accent text-xs px-1.5 py-0 h-5"
          >
            Contributions
          </Badge>

          <Badge
            variant={sortField === "btcEarned" ? "default" : "outline"}
            onClick={() => handleSort("btcEarned")}
            className="cursor-pointer hover:bg-accent text-xs px-1.5 py-0 h-5"
          >
            BTC Earned
          </Badge>

          <Badge
            variant={sortField === "passedProposals" ? "default" : "outline"}
            onClick={() => handleSort("passedProposals")}
            className="cursor-pointer hover:bg-accent text-xs px-1.5 py-0 h-5"
          >
            Passed
          </Badge>

          <Badge
            variant={sortField === "failedProposals" ? "default" : "outline"}
            onClick={() => handleSort("failedProposals")}
            className="cursor-pointer hover:bg-accent text-xs px-1.5 py-0 h-5"
          >
            Failed
          </Badge>
        </div>

        <div className="relative w-full md:w-80 md:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("username")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  User
                  <SortIcon field="username" />
                </Button>
              </th>
              <th className="text-center py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("totalProposals")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Contributions
                  <SortIcon field="totalProposals" />
                </Button>
              </th>
              <th className="text-center py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("passedProposals")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Passed
                  <SortIcon field="passedProposals" />
                </Button>
              </th>
              <th className="text-center py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("failedProposals")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Failed
                  <SortIcon field="failedProposals" />
                </Button>
              </th>
              <th className="text-center py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("pendingProposals")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  Pending
                  <SortIcon field="pendingProposals" />
                </Button>
              </th>
              <th className="text-center py-4 px-4">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("btcEarned")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  BTC Earned
                  <SortIcon field="btcEarned" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedMetrics.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">
                      No contributions yet
                    </p>
                    {searchQuery && (
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="text-sm"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedMetrics.map((metric) => (
                <tr
                  key={metric.address}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="py-4 px-4">
                    <a
                      href={getUserLink(metric.username, metric.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {formatUsername(metric.username, metric.address)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-mono">{metric.totalProposals}</span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-mono text-green-600 dark:text-green-500">
                      {metric.passedProposals}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-mono text-red-600 dark:text-red-500">
                      {metric.failedProposals}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-mono">{metric.pendingProposals}</span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="font-mono text-green-600 dark:text-green-500">
                      ${metric.btcEarned}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Table - Hidden on desktop */}
      <div className="md:hidden overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs">User</th>
              <th className="text-center py-3 px-2 text-xs">Contributions</th>
              <th className="text-center py-3 px-2 text-xs">BTC Earned</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedMetrics.length === 0 ? (
              <tr>
                <td colSpan={3} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">No users found</p>
                    {searchQuery && (
                      <Button
                        variant="link"
                        onClick={() => setSearchQuery("")}
                        className="text-sm"
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedMetrics.map((metric) => (
                <tr key={metric.address} className="border-b border-border/50">
                  <td className="py-3 px-2">
                    <a
                      href={getUserLink(metric.username, metric.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {formatUsername(metric.username, metric.address)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="font-mono text-sm">
                      {metric.totalProposals}
                    </span>
                  </td>
                  <td className="text-center py-3 px-2">
                    <span className="font-mono text-sm text-green-600 dark:text-green-500">
                      ${metric.btcEarned}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardView;
