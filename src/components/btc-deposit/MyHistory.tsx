"use client";
import { ExternalLink } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import type { Deposit } from "@faktoryfun/styx-sdk";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AuthButton from "@/components/home/AuthButton";

interface MyHistoryProps {
  depositHistory: Deposit[] | undefined;
  isLoading: boolean;
  btcUsdPrice: number | null | undefined;
  isRefetching?: boolean;
}

export default function MyHistory({
  depositHistory,
  isLoading,
  btcUsdPrice,
  isRefetching = false,
}: MyHistoryProps) {
  const { accessToken } = useAuth();

  // Format BTC amount for display
  const formatBtcAmount = (amount: number | null): string => {
    if (amount === null || amount === undefined) return "0.00000000";
    return amount.toFixed(8);
  };

  // Format USD value
  const formatUsdValue = (amount: number): string => {
    if (!amount || amount <= 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "broadcast":
        return "secondary";
      case "processing":
        return "default";
      case "confirmed":
        return "outline";
      default:
        return "destructive";
    }
  };

  // Get truncated tx id for display
  const getTruncatedTxId = (txId: string | null): string => {
    if (!txId) return "N/A";
    return `${txId.substring(0, 6)}...${txId.substring(txId.length - 4)}`;
  };

  // Format time using date-fns with timestamp (number) handling
  const formatTimeAgo = (timestamp: number | null): string => {
    if (timestamp === null || timestamp === undefined) return "Unknown";

    try {
      // Convert timestamp to Date object
      const date = new Date(timestamp);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      {!accessToken ? (
        <Card className="p-8 flex flex-col items-center justify-center space-y-6">
          <p className="text-center">
            Connect your wallet to view your deposit history
          </p>
          <AuthButton />
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader />
          <p className="text-sm text-muted-foreground">
            Loading deposit history...
          </p>
        </div>
      ) : depositHistory && depositHistory.length > 0 ? (
        <Card className="bg-card border-border/30 relative overflow-hidden">
          {/* Add refetching overlay */}
          {isRefetching && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 rounded-md">
              <div className="flex flex-col items-center space-y-2">
                <Loader />
                <p className="text-sm">Updating history...</p>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Tx ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositHistory.map((deposit: Deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="py-3 text-xs">
                      {formatTimeAgo(deposit.createdAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs">
                        {formatBtcAmount(deposit.btcAmount)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatUsdValue(deposit.btcAmount * (btcUsdPrice || 0))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant={getStatusVariant(deposit.status)}
                        className="text-[10px] capitalize px-2 py-1"
                      >
                        {deposit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      {deposit.btcTxId ? (
                        <a
                          href={`https://mempool.space/tx/${deposit.btcTxId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center hover:underline"
                        >
                          {getTruncatedTxId(deposit.btcTxId)}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No deposit history found</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Make your first deposit to see it here
          </p>
        </Card>
      )}
    </div>
  );
}
