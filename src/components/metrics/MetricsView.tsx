"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface MetricsViewProps {
  metrics: UserMetrics[];
}

type SortField =
  | "username"
  | "totalProposals"
  | "passedProposals"
  | "failedProposals"
  | "pendingProposals"
  | "successRate";
type SortDirection = "asc" | "desc";

const MetricsView = ({ metrics }: MetricsViewProps) => {
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
    let filtered = metrics.filter((metric) => {
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
    return `https://explorer.stacks.co/address/${address}?chain=mainnet`;
  };

  return (
    <div className="py-2 space-y-6 md:px-16">
      {/* Header with sorting and search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Sort by:</span>

          <Badge
            variant={sortField === "totalProposals" ? "default" : "outline"}
            onClick={() => handleSort("totalProposals")}
            className="cursor-pointer hover:bg-accent"
          >
            Contributions
          </Badge>

          <Badge
            variant={sortField === "passedProposals" ? "default" : "outline"}
            onClick={() => handleSort("passedProposals")}
            className="cursor-pointer hover:bg-accent"
          >
            Passed
          </Badge>

          <Badge
            variant={sortField === "failedProposals" ? "default" : "outline"}
            onClick={() => handleSort("failedProposals")}
            className="cursor-pointer hover:bg-accent"
          >
            Failed
          </Badge>
        </div>

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("username")}
                className="h-auto p-0 font-medium hover:bg-transparent border-none"
              >
                User
                <SortIcon field="username" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleSort("totalProposals")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Total Contributions
                <SortIcon field="totalProposals" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleSort("passedProposals")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Passed
                <SortIcon field="passedProposals" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleSort("failedProposals")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Failed
                <SortIcon field="failedProposals" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => handleSort("pendingProposals")}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Pending
                <SortIcon field="pendingProposals" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedMetrics.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
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
              </TableCell>
            </TableRow>
          ) : (
            filteredAndSortedMetrics.map((metric) => (
              <TableRow key={metric.address}>
                <TableCell>
                  <a
                    href={getUserLink(metric.username, metric.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline inline-flex items-center gap-1"
                  >
                    {formatUsername(metric.username, metric.address)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono">{metric.totalProposals}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-green-600 dark:text-green-500">
                    {metric.passedProposals}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono text-red-600 dark:text-red-500">
                    {metric.failedProposals}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono">{metric.pendingProposals}</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MetricsView;
