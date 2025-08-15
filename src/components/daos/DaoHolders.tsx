"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface Holder {
  address: string;
  balance: string;
  percentage: number;
  value_usd?: string;
  last_transaction?: string;
}

interface DAOHoldersProps {
  holders: Holder[];
  tokenSymbol: string;
}

export default function DAOHolders({ holders, tokenSymbol }: DAOHoldersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("balance");

  const filteredHolders = useMemo(() => {
    return holders.filter((holder) =>
      holder.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [holders, searchQuery]);
  const sortedHolders = useMemo(() => {
    return [...filteredHolders].sort((a, b) => {
      switch (sortBy) {
        case "balance":
          return Number.parseFloat(b.balance) - Number.parseFloat(a.balance);
        case "percentage":
          return b.percentage - a.percentage;
        case "value":
          return (
            Number.parseFloat(b.value_usd || "0") -
            Number.parseFloat(a.value_usd || "0")
          );
        default:
          return 0;
      }
    });
  }, [filteredHolders, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Token Holders</h2>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                {holders[0]?.value_usd && (
                  <SelectItem value="value">Value (USD)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">#</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  {holders[0]?.value_usd && (
                    <TableHead className="text-right">Value (USD)</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHolders.map((holder, index) => (
                  <TableRow key={holder.address} className="hover:bg-accent/10">
                    <TableCell className="pl-4 text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="break-all font-medium">
                      {holder.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <TokenBalance
                        value={holder.balance}
                        symbol={tokenSymbol}
                        variant="rounded"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {holder.percentage.toFixed(2)}%
                    </TableCell>
                    {holders[0]?.value_usd && (
                      <TableCell className="text-right">
                        {holder.value_usd}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
