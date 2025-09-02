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
import {
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  fetchAgentContributionHistory,
  ContributionHistory,
} from "@/services/contribution.service";
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
    queryKey: ["contribution-history", agentAddress],
    queryFn: () => fetchAgentContributionHistory(agentAddress!),
    enabled: !!agentAddress,
  });

  const sortedContributions = useMemo(() => {
    const sorted = [...contributions].sort((a, b) => {
      if (sortBy === "status") {
        const aSuccess =
          a.executed && a.met_quorum && a.met_threshold && a.passed;
        const bSuccess =
          b.executed && b.met_quorum && b.met_threshold && b.passed;
        if (aSuccess !== bSuccess) {
          return sortOrder === "desc" ? (aSuccess ? -1 : 1) : aSuccess ? 1 : -1;
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
    if (
      contribution.executed &&
      contribution.met_quorum &&
      contribution.met_threshold &&
      contribution.passed
    ) {
      return <Badge variant="default">Success</Badge>;
    }
    if (!contribution.passed || !contribution.executed) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getRewardDisplay = (contribution: ContributionHistory) => {
    if (contribution.reward_amount === 0) return null;

    const isGain = contribution.reward_type === "gain";
    const symbol = `${contribution.dao_name}`;

    return (
      <div
        className={`flex items-center gap-1 ${isGain ? "text-primary" : "text-red-600"}`}
      >
        {isGain ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
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
            Your agent hasn't participated in any DAO proposals yet
          </p>
        </div>
      </div>
    );
  }

  const totalRewards = sortedContributions.reduce((acc, contribution) => {
    if (contribution.reward_type === "gain") {
      return acc + contribution.reward_amount;
    } else {
      return acc - contribution.reward_amount;
    }
  }, 0);

  const successfulContributions = sortedContributions.filter(
    (c) => c.reward_type === "gain"
  ).length;
  const failedContributions = sortedContributions.filter(
    (c) => c.reward_type === "loss"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Successful Proposals</span>
          </div>
          <p className="text-2xl font-bold">{successfulContributions}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Failed Proposals</span>
          </div>
          <p className="text-2xl font-bold">{failedContributions}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="text-sm font-medium">Net Rewards</span>
          </div>
          <p className="text-2xl font-bold">
            {totalRewards >= 0 ? "+" : ""}
            {totalRewards.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Contribution History Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
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
                <TableHead className="w-[120px] text-right">Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContributions.map((contribution) => (
                <TableRow
                  key={contribution.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(contribution.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {contribution.dao_name}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleProposalClick(contribution.id)}
                      className="text-left hover:text-primary transition-colors group flex items-center gap-1"
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
  );
}
