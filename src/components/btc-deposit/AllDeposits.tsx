"use client";

import { ExternalLink } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import type { Deposit } from "@faktoryfun/styx-sdk";
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
import useResolveBnsOrAddress from "@/hooks/deposit/useResolveBnsOrAddress";

interface AllDepositsProps {
  allDepositsHistory:
    | {
        aggregateData: {
          totalDeposits: number;
          totalVolume: string;
          uniqueUsers: number;
        };
        recentDeposits: Deposit[];
      }
    | undefined;
  isLoading: boolean;
  btcUsdPrice: number | null | undefined;
  isRefetching?: boolean;
}

// AddressCell Component
const AddressCell = ({ address }: { address: string }) => {
  const { data } = useResolveBnsOrAddress(address);

  const displayAddress =
    data?.resolvedValue && !data.resolvedValue.startsWith("SP")
      ? data.resolvedValue // Show BNS names
      : formatAddress(address);

  const bgColor = getBackgroundColor(address);

  const handleAddressClick = () => {
    window.open(
      `https://explorer.hiro.so/address/${address}?chain=mainnet`,
      "_blank"
    );
  };

  return (
    <div
      className="inline-block px-2 py-1 rounded-lg text-xs cursor-pointer hover:opacity-80"
      style={{ backgroundColor: bgColor }}
      onClick={handleAddressClick}
    >
      {displayAddress}
    </div>
  );
};

// Helper functions
const formatAddress = (address: string): string => {
  if (!address) return "Unknown";
  if (address.length <= 10) return address;
  return `${address.substring(0, 5)}...${address.substring(
    address.length - 5
  )}`;
};

const getBackgroundColor = (address: string): string => {
  if (!address) return "#3f3f46"; // zinc-700

  // Simple hash function to generate a color
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with fixed saturation and lightness
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 30%)`;
};

export default function AllDeposits({
  allDepositsHistory,
  isLoading,
  btcUsdPrice,
  isRefetching = false,
}: AllDepositsProps) {
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
        return "secondary"; // yellow equivalent
      case "processing":
        return "default"; // blue equivalent
      case "confirmed":
        return "outline"; // green equivalent
      default:
        return "destructive"; // gray equivalent
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

  // Check if we have data to display
  const hasData =
    allDepositsHistory &&
    allDepositsHistory.recentDeposits &&
    allDepositsHistory.recentDeposits.length > 0;

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h3 className="text-lg font-medium mb-4">Recent Network Activity</h3>

      {/* Stats summary box */}
      {!isLoading && hasData && (
        <Card className="bg-card border-border/30 p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Deposits</p>
              <p className="text-xl font-bold text-primary">
                {allDepositsHistory.aggregateData.totalDeposits}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Volume</p>
              <p className="text-xl font-bold text-primary">
                {Number.parseFloat(
                  allDepositsHistory.aggregateData.totalVolume
                ).toFixed(8)}
              </p>
              <p className="text-xs text-muted-foreground">BTC</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Unique Users</p>
              <p className="text-xl font-bold text-primary">
                {allDepositsHistory.aggregateData.uniqueUsers}
              </p>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader />
          <p className="text-sm text-muted-foreground">
            Loading network activity...
          </p>
        </div>
      ) : hasData ? (
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
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Tx ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDepositsHistory.recentDeposits.map((deposit: Deposit) => (
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
                      <AddressCell address={deposit.stxReceiver} />
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
          <p className="text-muted-foreground">No network activity found</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Network activity will appear here once deposits are made
          </p>
        </Card>
      )}
    </div>
  );
}
