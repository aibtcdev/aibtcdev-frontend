"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProposalVotes, type Vote } from "@/queries/vote-queries";
import { formatDistanceToNow } from "date-fns";
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
import ReactMarkdown from "react-markdown";
import CopyButton from "./CopyButton";
import { TokenBalance } from "@/components/reusables/balance-display";
import { supabase } from "@/utils/supabase/client";

interface VotesTableProps {
  proposalId: string;
}

const VotesTable = ({ proposalId }: VotesTableProps) => {
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (!proposalId) return;

    // Subscribe to changes on the votes table for this proposal
    const channel = supabase
      .channel("votes-table-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "votes",
          filter: `proposal_id=eq.${proposalId}`,
        },
        () => {
          // Invalidate or refetch the query to get fresh data
          queryClient.invalidateQueries({
            queryKey: ["proposalVotesTable", proposalId],
          });
        }
      )
      .subscribe();

    // Cleanup on unmount or proposalId change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, queryClient]);

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-2 p-3 bg-zinc-800/30 rounded-md">
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse w-full"></div>
        <div className="h-4 bg-zinc-700 rounded-full animate-pulse w-5/6"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-400 p-3 text-center bg-red-500/5 rounded-md text-sm">
        Error loading votes: {error?.message || "Unknown error"}
      </div>
    );
  }

  // --- Empty State ---
  if (!votes || votes.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground bg-zinc-800/30 rounded-md text-sm">
        No votes have been recorded for this proposal yet.
      </div>
    );
  }

  // --- Helper function for confidence bar color ---
  const getConfidenceColor = (confidence: number | null): string => {
    if (confidence === null) return "bg-zinc-600";
    if (confidence >= 0.8) return "bg-primary";
    if (confidence >= 0.6) return "bg-primary/80";
    if (confidence >= 0.4) return "bg-primary/60";
    if (confidence >= 0.2) return "bg-primary/40";
    return "bg-zinc-500";
  };

  // --- Render Votes Table ---
  return (
    <div className="overflow-x-auto relative bg-zinc-800/30 rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/5 border-b border-zinc-700/30">
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              Vote
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              Amount
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              Date
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              Confidence
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              Reasoning
            </TableHead>
            <TableHead className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
              TX
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {votes.map((vote) => (
            <TableRow
              key={vote.id}
              className="hover:bg-muted/5 border-t border-zinc-700/30"
            >
              {/* Vote Yes/No */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.amount === null ? (
                  <span className="flex items-center text-zinc-500">
                    <span className="h-3 w-3 mr-1 flex-shrink-0 rounded-full border border-zinc-500"></span>
                    No vote
                  </span>
                ) : vote.answer ? (
                  <span className="flex items-center text-primary">
                    <ThumbsUp className="h-3 w-3 mr-1 flex-shrink-0" />
                    Yes
                  </span>
                ) : (
                  <span className="flex items-center text-zinc-400">
                    <ThumbsDown className="h-3 w-3 mr-1 flex-shrink-0" />
                    No
                  </span>
                )}
              </TableCell>

              {/* Amount */}
              <TableCell className="whitespace-nowrap px-2 py-1.5 text-xs">
                {vote.amount !== null ? (
                  <TokenBalance
                    value={vote.amount}
                    decimals={8}
                    variant="rounded"
                  />
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>

              {/* Date */}
              <TableCell className="whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(vote.created_at), {
                  addSuffix: true,
                })}
              </TableCell>

              {/* Confidence */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.confidence !== null ? (
                  <div
                    className="flex items-center"
                    title={`Confidence: ${Math.round(vote.confidence * 100)}%`}
                  >
                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mr-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 ${getConfidenceColor(
                          vote.confidence
                        )}`}
                        style={{ width: `${vote.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="tabular-nums">
                      {Math.round(vote.confidence * 100)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>

              {/* Reasoning */}
              <TableCell className="px-2 py-1.5 text-xs">
                {vote.reasoning ? (
                  <div className="flex items-center gap-1 max-w-xs">
                    <Dialog>
                      <DialogTrigger className="cursor-pointer text-primary hover:underline truncate text-left">
                        {(vote.reasoning || "")
                          .substring(0, 30)
                          .replace(/[#*`_~[\]()]/g, "")}
                        {(vote.reasoning || "").length > 30 ? "..." : ""}
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] sm:w-[80vw] max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle>Vote Reasoning</DialogTitle>
                        </DialogHeader>
                        <div className="mt-3 prose prose-sm dark:prose-invert max-w-none px-1 overflow-y-auto flex-1 prose-p:my-2 prose-li:my-1">
                          <ReactMarkdown>{vote.reasoning || ""}</ReactMarkdown>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <CopyButton text={vote.reasoning || ""} />
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VotesTable;
