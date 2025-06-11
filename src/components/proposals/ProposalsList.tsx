"use client";

import type React from "react";
import { useState } from "react";
import { Filter, CheckCircle } from "lucide-react";
import ProposalCard from "./ProposalCard";
import type { Proposal, ProposalWithDAO } from "@/types";

interface ProposalsListProps {
  proposals: (Proposal | ProposalWithDAO)[];
  onToggleVisibility: (proposalId: string) => void;
  hiddenProposals: Set<string>;
  tokenSymbol?: string;
  showDAOInfo?: boolean;
}

export function ProposalsList({
  proposals,
  // onToggleVisibility,
  // hiddenProposals,
  tokenSymbol = "",
  showDAOInfo = false,
}: ProposalsListProps) {
  const [filter, setFilter] = useState<"all" | "active" | "passed" | "failed">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "votes">("newest");

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === "all") return true;

    // Determine status based on proposal properties
    const isActive =
      proposal.status === "active" || (!proposal.executed && !proposal.passed);
    const isPassed = proposal.passed;
    const isFailed = proposal.executed && !proposal.passed;

    switch (filter) {
      case "active":
        return isActive;
      case "passed":
        return isPassed;
      case "failed":
        return isFailed;
      default:
        return true;
    }
  });

  const sortedProposals = [...filteredProposals].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "votes":
        const aVotes = Number(a.votes_for || 0) + Number(a.votes_against || 0);
        const bVotes = Number(b.votes_for || 0) + Number(b.votes_against || 0);
        return bVotes - aVotes;
      default: // newest
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  const getFilterCount = (status: "all" | "active" | "passed" | "failed") => {
    if (status === "all") return proposals.length;
    return proposals.filter((p) => {
      const isActive = p.status === "active" || (!p.executed && !p.passed);
      const isPassed = p.passed;
      const isFailed = p.executed && !p.passed;

      switch (status) {
        case "active":
          return isActive;
        case "passed":
          return isPassed;
        case "failed":
          return isFailed;
        default:
          return true;
      }
    }).length;
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/30 mb-4">
          <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No proposals yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Be the first to submit a proposal to this DAO. Use the form above to
          get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Proposals</h2>
          <p className="text-muted-foreground text-sm">
            {sortedProposals.length} of {proposals.length} proposals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-background/50 border border-border/30 rounded-xl p-1">
            {(["all", "active", "passed", "failed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  filter === status
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                ({getFilterCount(status)})
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "votes")
            }
            className="bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="votes">Most Votes</option>
          </select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="space-y-4">
        {sortedProposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            // onToggleVisibility={onToggleVisibility}
            // isHidden={hiddenProposals.has(proposal.id)}
            tokenSymbol={tokenSymbol}
            showDAOInfo={showDAOInfo}
          />
        ))}
      </div>

      {filteredProposals.length === 0 && filter !== "all" && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted/30 mb-3">
            <Filter className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No {filter} proposals
          </h3>
          <p className="text-muted-foreground text-sm">
            Try selecting a different filter or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
