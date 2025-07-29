"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProposalVotes } from "@/services/vote.service";
import type { Vote } from "@/types";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { DataTable, Column } from "./data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { TokenBalance } from "../reusables/BalanceDisplay";
import { getExplorerLink } from "@/utils/format";

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

  // Helper function to truncate addresses
  const truncateAddress = (address: string) => {
    return address.length > 10
      ? `${address.substring(0, 5)}...${address.substring(address.length - 5)}`
      : address;
  };

  // Define columns for the data table
  const columns: Column[] = [
    {
      key: "address",
      label: "Voter",
      sortable: true,
      filterable: true,
      width: 140,
      minWidth: 120,
      render: (value: string) => (
        <span title={value} className="text-xs font-mono text-muted-foreground">
          {value ? truncateAddress(value) : "-"}
        </span>
      ),
    },
    {
      key: "answer",
      label: "Vote",
      sortable: true,
      width: 80,
      align: "center",
      responsive: "sm",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (value: boolean, row: any) => {
        if (!row.tx_id) {
          return <span className="text-muted-foreground text-xs">-</span>;
        }

        return value ? (
          <span className="flex items-center justify-center text-primary font-medium">
            <ThumbsUp className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="text-xs">Yes</span>
          </span>
        ) : (
          <span className="flex items-center justify-center text-secondary font-medium">
            <ThumbsDown className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="text-xs">No</span>
          </span>
        );
      },
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      width: 100,
      align: "center",
      render: (value: number) => {
        if (value !== null && value !== undefined) {
          return <TokenBalance value={value} variant="abbreviated" />;
        }
        return <span className="text-muted-foreground text-xs">-</span>;
      },
    },
    {
      key: "evaluation_score",
      label: "Score",
      sortable: true,
      width: 80,
      align: "center",
      responsive: "sm",
      render: (value: string | object) => {
        if (!value)
          return <span className="text-muted-foreground text-xs">-</span>;

        try {
          const parsedScore =
            typeof value === "string" ? JSON.parse(value) : value;

          // Handle object score format with final_score property
          if (typeof parsedScore === "object" && parsedScore !== null) {
            const finalScore =
              parsedScore.final_score ?? parsedScore.score ?? parsedScore;
            return (
              <Badge variant="secondary" className="text-xs">
                {typeof finalScore === "number"
                  ? finalScore.toFixed(1)
                  : String(finalScore)}
              </Badge>
            );
          }

          // Handle simple numeric scores
          return (
            <Badge variant="secondary" className="text-xs">
              {typeof parsedScore === "number"
                ? parsedScore.toFixed(1)
                : String(parsedScore)}
            </Badge>
          );
        } catch {
          return <span className="text-muted-foreground text-xs">-</span>;
        }
      },
    },
    {
      key: "reasoning",
      label: "Reasoning",
      filterable: true,
      responsive: "sm",
      render: (value: string) => {
        if (!value)
          return <span className="text-muted-foreground text-xs">-</span>;

        return (
          <div className="max-w-xs">
            <p className="text-xs text-muted-foreground truncate" title={value}>
              {value}
            </p>
          </div>
        );
      },
    },
    {
      key: "tx_id",
      label: "TX",
      width: 60,
      align: "center",
      render: (value: string) => {
        if (!value)
          return <span className="text-muted-foreground text-xs">-</span>;

        return (
          <a
            href={getExplorerLink("tx", value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      },
    },
  ];

  return (
    <DataTable.Provider
      data={votes || []}
      columns={columns}
      isLoading={isLoading}
      error={isError ? error?.message || "Unknown error" : null}
      defaultSort={{ column: "created_at", direction: "desc" }}
      itemHeight={56}
      containerHeight={400}
    >
      <DataTable.Container>
        <DataTable.Toolbar
          showSearch={true}
          searchPlaceholder="Search votes..."
        />

        {isLoading ? (
          <DataTable.Loading rows={8} />
        ) : isError ? (
          <DataTable.Error
            title="Failed to load votes"
            description={
              error?.message ||
              "There was an error loading the vote data. Please try again."
            }
            onRetry={() => window.location.reload()}
          />
        ) : !votes || votes.length === 0 ? (
          <DataTable.Empty
            icon={<ThumbsUp className="h-12 w-12 text-muted-foreground/50" />}
            title="No votes recorded"
            description="No votes have been recorded for this contribution yet."
          />
        ) : (
          <DataTable.Virtualized />
        )}
      </DataTable.Container>
    </DataTable.Provider>
  );
};

export default VotesTable;
