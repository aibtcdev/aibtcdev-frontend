"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ArrowUpDown, ExternalLink } from "lucide-react";
import { fetchAgentContributionHistory } from "@/services/contribution.service";
import { ContributionHistory } from "@/types/contribution";
import { format } from "date-fns";

interface ContributionHistoryTabProps {
  agentAddress: string | null;
}

export function ContributionHistoryTab({
  agentAddress,
}: ContributionHistoryTabProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"date" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const {
    data: contributions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["earning-history", agentAddress],
    queryFn: () => fetchAgentContributionHistory(agentAddress!),
    enabled: !!agentAddress,
  });

  const sortedContributions = useMemo(() => {
    const sorted = [...contributions].sort((a, b) => {
      if (sortBy === "status") {
        // Define status priority: pending = 0, success = 1, failed = 2
        const getStatusPriority = (contribution: ContributionHistory) => {
          if (contribution.concluded_by === null) return 0; // pending
          const isSuccess =
            contribution.executed &&
            contribution.met_quorum &&
            contribution.met_threshold &&
            contribution.passed;
          return isSuccess ? 1 : 2; // success or failed
        };

        const aPriority = getStatusPriority(a);
        const bPriority = getStatusPriority(b);

        if (aPriority !== bPriority) {
          return sortOrder === "desc"
            ? aPriority - bPriority
            : bPriority - aPriority;
        }
      }
      // Default to date sorting
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
    });
    return sorted;
  }, [contributions, sortBy, sortOrder]);

  const handleSort = (column: "date" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleProposalClick = (proposalId: string) => {
    router.push(`/proposals/${proposalId}`);
  };

  const getStatusBadge = (contribution: ContributionHistory) => {
    // Check if proposal is still pending (concluded_by is null)
    if (contribution.concluded_by === null) {
      return <Badge variant="secondary">Pending</Badge>;
    }

    // Proposal is concluded - check if successful
    const isSuccessful =
      contribution.executed &&
      contribution.met_quorum &&
      contribution.met_threshold &&
      contribution.passed;

    if (isSuccessful) {
      return <Badge className="bg-green-600 hover:bg-green-700">Success</Badge>;
    }

    // If concluded but didn't meet requirements or didn't pass
    return <Badge variant="destructive">Failed</Badge>;
  };

  const getRewardDisplay = (contribution: ContributionHistory) => {
    if (contribution.reward_amount === 0) return null;

    const isGain = contribution.reward_type === "gain";
    const symbol = `${contribution.dao_name}`;

    return (
      <div
        className={`flex items-center gap-1 ${
          isGain ? "text-green-600" : "text-red-600"
        }`}
      >
        <span className="font-mono text-sm">
          {isGain ? "+" : "-"}
          {contribution.reward_amount.toLocaleString()} {symbol}
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Loading contribution history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-red-500/10 flex items-center justify-center">
          <History className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            Error Loading History
          </h3>
          <p className="text-sm text-muted-foreground">
            Failed to load contribution history
          </p>
        </div>
      </div>
    );
  }

  if (!agentAddress) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">No Agent Account</h3>
          <p className="text-sm text-muted-foreground">
            Connect an agent account to view contribution history
          </p>
        </div>
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-muted/20 flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">
            No Contributions Yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Your agent hasn't created any DAO contribution yet
          </p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalRewards = sortedContributions
    .filter((c) => c.reward_type === "gain")
    .reduce((acc, contribution) => acc + contribution.reward_amount, 0);

  const totalLostBonds = sortedContributions
    .filter((c) => c.reward_type === "loss")
    .reduce((acc, contribution) => acc + contribution.reward_amount, 0);

  const successfulContributions = sortedContributions.filter(
    (c) => c.reward_type === "gain"
  ).length;

  const failedContributions = sortedContributions.filter(
    (c) => c.reward_type === "loss"
  ).length;

  const pendingContributions = sortedContributions.filter(
    (c) => c.reward_type === "pending"
  ).length;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Successful</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              {successfulContributions}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Failed</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {failedContributions}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Pending</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">
              {pendingContributions}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Rewards</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              +{totalRewards.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">Lost Bond</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              -{totalLostBonds.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Contribution History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contribution History</h3>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {sortedContributions.map((contribution) => (
              <div
                key={contribution.id}
                className="rounded-lg border bg-card p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {contribution.dao_name}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(contribution.created_at), "MMM dd")}
                  </span>
                </div>

                {/* Proposal Title */}
                <button
                  onClick={() => handleProposalClick(contribution.id)}
                  className="text-left hover:text-green-600 transition-colors group flex items-start gap-2 w-full min-w-0"
                  title="Click to view proposal details"
                >
                  <span className="text-sm font-medium break-words flex-1 min-w-0">
                    {contribution.proposal_title}
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                </button>

                {/* Status and Reward */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex-shrink-0">
                    {getStatusBadge(contribution)}
                  </div>
                  <div className="flex-shrink-0">
                    {getRewardDisplay(contribution)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("date")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px]">DAO</TableHead>
                    <TableHead className="min-w-[200px]">Proposal</TableHead>
                    <TableHead className="w-[100px] text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("status")}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        Status
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Reward
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedContributions.map((contribution) => (
                    <TableRow
                      key={contribution.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-sm text-muted-foreground">
                        {format(
                          new Date(contribution.created_at),
                          "MMM dd, yyyy"
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="text-xs">
                          {contribution.dao_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleProposalClick(contribution.id)}
                          className="text-left hover:text-green-600 transition-colors group flex items-center gap-1 max-w-[300px]"
                          title="Click to view proposal details"
                        >
                          <span className="truncate">
                            {contribution.proposal_title}
                          </span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(contribution)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getRewardDisplay(contribution)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
