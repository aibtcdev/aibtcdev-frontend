"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/services/vote.service";
import type { Vote } from "@/types";
import { ThumbsUp, ThumbsDown, ExternalLink, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TokenBalance } from "../reusables/BalanceDisplay";
import { getExplorerLink } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VotesTableProps {
  proposalId: string;
  limit?: number;
}

const VotesTable = ({ proposalId, limit }: VotesTableProps) => {
  const queryClient = useQueryClient();
  const [selectedReasoning, setSelectedReasoning] = useState<{
    reasoning: string;
    voter: string;
  } | null>(null);

  const {
    data: votes,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery<Vote[], Error>({
    queryKey: ["proposalVotesTable", proposalId],
    queryFn: () => fetchProposalVotes(proposalId),
    enabled: !!proposalId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1, // 1 minute stale time
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

  // Handle retry with proper query invalidation
  const handleRetry = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["proposalVotesTable", proposalId],
    });
    refetch();
  };

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    return address.length > 10
      ? `${address.substring(0, 5)}...${address.substring(address.length - 5)}`
      : address;
  };

  // Helper function to parse and display score
  const renderScore = (value: string | object) => {
    if (!value) return <span className="text-muted-foreground text-xs">-</span>;

    try {
      const parsedScore = typeof value === "string" ? JSON.parse(value) : value;

      // Handle object score format with final_score property
      if (typeof parsedScore === "object" && parsedScore !== null) {
        const finalScore =
          parsedScore.final_score ?? parsedScore.score ?? parsedScore;
        return (
          <Badge variant="secondary" className="text-xs">
            {typeof finalScore === "number"
              ? finalScore.toFixed(4)
              : String(finalScore)}
          </Badge>
        );
      }

      // Handle simple numeric scores
      return (
        <Badge variant="secondary" className="text-xs">
          {typeof parsedScore === "number"
            ? parsedScore.toFixed(4)
            : String(parsedScore)}
        </Badge>
      );
    } catch {
      return <span className="text-muted-foreground text-xs">-</span>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full p-8 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading votes...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load votes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error?.message ||
              "There was an error loading the vote data. Please try again."}
          </p>
          <Button onClick={handleRetry} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!votes || votes.length === 0) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center gap-4">
        <ThumbsUp className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            No votes recorded
          </h3>
          <p className="text-sm text-muted-foreground">
            No votes have been recorded for this contribution yet.
          </p>
        </div>
      </div>
    );
  }

  // Apply limit if specified
  const displayedVotes = limit ? votes.slice(0, limit) : votes;

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Voter
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Vote
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Reasoning
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                TX
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedVotes.map((vote) => (
              <tr
                key={vote.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                {/* Voter */}
                <td className="px-4 py-3 text-sm">
                  <span
                    title={vote.address || undefined}
                    className="text-xs font-mono text-muted-foreground"
                  >
                    {vote.address ? truncateAddress(vote.address) : "-"}
                  </span>
                </td>

                {/* Vote */}
                <td className="px-4 py-3 text-sm text-center hidden sm:table-cell">
                  {!vote.tx_id ? (
                    <span className="text-muted-foreground text-xs">-</span>
                  ) : vote.answer ? (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <ThumbsUp className="h-3 w-3" />
                      <span className="text-xs">Yes</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-secondary font-medium">
                      <ThumbsDown className="h-3 w-3" />
                      <span className="text-xs">No</span>
                    </span>
                  )}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 text-sm text-center hidden sm:table-cell">
                  {vote.amount !== null && vote.amount !== undefined ? (
                    <TokenBalance value={vote.amount} variant="abbreviated" />
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>

                {/* Score */}
                <td className="px-4 py-3 text-sm text-center hidden sm:table-cell">
                  {vote.evaluation_score ? (
                    renderScore(vote.evaluation_score)
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </td>

                {/* Reasoning */}
                <td className="px-4 py-3 text-sm">
                  {!vote.reasoning ? (
                    <span className="text-muted-foreground text-xs">-</span>
                  ) : (
                    <button
                      onClick={() =>
                        setSelectedReasoning({
                          reasoning: vote.reasoning || "",
                          voter: vote.address || "Unknown",
                        })
                      }
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer group w-full text-left"
                      title="Click to view full reasoning"
                    >
                      <Eye className="h-3 w-3 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-[400px]">
                        {vote.reasoning}
                      </span>
                    </button>
                  )}
                </td>

                {/* TX */}
                <td className="px-4 py-3 text-sm text-center hidden sm:table-cell">
                  {!vote.tx_id ? (
                    <span className="text-muted-foreground text-xs">-</span>
                  ) : (
                    <a
                      href={getExplorerLink("tx", vote.tx_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reasoning Modal */}
      <Dialog
        open={!!selectedReasoning}
        onOpenChange={(open) => !open && setSelectedReasoning(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vote Reasoning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <strong>Voter:</strong>{" "}
              <span className="font-mono">
                {selectedReasoning?.voter
                  ? truncateAddress(selectedReasoning.voter)
                  : "Unknown"}
              </span>
            </div>
            <div className="bg-muted/50 rounded-sm p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {selectedReasoning?.reasoning || "No reasoning provided"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VotesTable;
