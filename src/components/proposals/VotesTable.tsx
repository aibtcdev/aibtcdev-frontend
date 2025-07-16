"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/services/vote.service";
import type { Vote } from "@/types";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { TokenBalance } from "../reusables/BalanceDisplay";

interface VotesTableProps {
  proposalId: string;
}

const VotesTable = ({ proposalId }: VotesTableProps) => {
  const {
    data: votes,
    isLoading,
    error,
    isError,
  } = useQuery<Vote[], Error>({
    queryKey: ["proposalVotesTable", proposalId],
    queryFn: () => fetchProposalVotes(proposalId),
    enabled: !!proposalId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1, // 1 minute stale time
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

  // Note: Realtime updates are now handled globally by SupabaseRealtimeProvider

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-2 p-3 rounded-md">
        <div className="h-3 sm:h-4 bg-muted rounded-full animate-pulse w-full"></div>
        <div className="h-3 sm:h-4 bg-muted rounded-full animate-pulse w-5/6"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive p-3 text-center rounded-md text-sm">
        Error loading votes: {error?.message || "Unknown error"}
      </div>
    );
  }

  // --- Empty State ---
  if (!votes || votes.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground rounded-md text-sm">
        No votes have been recorded for this contribution yet.
      </div>
    );
  }

  // --- Helper function to render flag badges ---
  const renderFlagBadges = (flags: string[] | null) => {
    if (!flags || flags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {flags.map((flag, index) => (
          <Badge
            key={`${flag}-${index}`}
            variant={index % 2 === 0 ? "default" : "secondary"}
            className="font-medium text-xs"
          >
            {flag}
          </Badge>
        ))}
      </div>
    );
  };

  // --- Render Votes Table ---
  return (
    <div className="overflow-x-auto relative rounded-md border border-border/50">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap">
              Voter
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Vote
            </TableHead>
            <TableHead className="text-xs text-center px-2 py-1.5 text-muted-foreground uppercase tracking-wider font-medium">
              Amount
            </TableHead>
            <TableHead className="text-xs text-center px-2 py-1.5 text-muted-foreground uppercase tracking-wider font-medium">
              Score
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Reasoning
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
              TX
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {votes.map((vote) => {
            const parsedScore =
              typeof vote.evaluation_score === "string"
                ? JSON.parse(vote.evaluation_score)
                : vote.evaluation_score;
            return (
              <TableRow
                key={vote.id}
                className="border-border/50 hover:bg-muted/30 transition-colors"
              >
                <TableCell className="px-2 py-1.5 text-xs break-all text-muted-foreground">
                  {vote.address ? (
                    <span title={vote.address}>{vote.address}</span>
                  ) : (
                    "-"
                  )}
                </TableCell>

                {/* Vote Yes/No */}
                <TableCell className="px-2 py-1.5 text-xs">
                  {vote.tx_id ? (
                    vote.answer ? (
                      <span className="flex items-center text-primary font-medium">
                        <ThumbsUp className="h-3 w-3 mr-1 flex-shrink-0" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center text-secondary font-medium">
                        <ThumbsDown className="h-3 w-3 mr-1 flex-shrink-0" />
                        No
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell className="text-xs text-center px-2 py-1.5">
                  {vote.amount !== null && vote.amount !== undefined ? (
                    <TokenBalance value={vote.amount} variant="abbreviated" />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                <TableCell className="text-xs text-center px-2 py-1.5">
                  {parsedScore?.final_score !== undefined ? (
                    <span className="tabular-nums font-medium">
                      {parsedScore.final_score}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* Reasoning */}
                <TableCell className="px-2 py-1.5 text-xs break-words">
                  {vote.reasoning ? (
                    <div className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="line-clamp-2 text-ellipsis overflow-hidden max-w-[200px] sm:max-w-[300px]">
                            {vote.reasoning}
                          </div>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Vote Reasoning</DialogTitle>
                          </DialogHeader>
                          <div className="mt-3 px-1 overflow-y-auto flex-1">
                            {/* Flag Badges */}
                            {renderFlagBadges(vote.flags)}

                            {/* Reasoning Content */}
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-li:my-1">
                              <ReactMarkdown>
                                {vote.reasoning || ""}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>

                {/* TX Link */}
                <TableCell className="px-2 py-1.5 text-center text-xs">
                  {vote.tx_id ? (
                    <a
                      href={`https://explorer.stacks.co/txid/${
                        vote.tx_id
                      }?chain=${
                        process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet"
                          ? "testnet"
                          : "mainnet"
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-block"
                      title={`View transaction ${vote.tx_id}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default VotesTable;
