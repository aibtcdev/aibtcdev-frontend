import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown } from "lucide-react";

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

function formatBalance(balance: string): string {
  const num = Number.parseFloat(balance) / 1_00_00_00;
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + "B";
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  } else {
    return num.toFixed(2);
  }
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

  const totalHolders = holders.length;
  const top10Holdings = holders
    .slice(0, 10)
    .reduce((acc, holder) => acc + holder.percentage, 0)
    .toFixed(2);
  const avgBalance = formatBalance(
    (
      holders.reduce(
        (acc, holder) => acc + Number.parseFloat(holder.balance),
        0
      ) / totalHolders
    ).toString()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Token Holders</h2>
          <p className="text-muted-foreground mt-2">
            View and analyze the distribution of token holders
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHolders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top 10 Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{top10Holdings}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgBalance} {tokenSymbol}
              </div>
            </CardContent>
          </Card>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  {holders[0]?.value_usd && (
                    <TableHead className="text-right hidden md:table-cell">
                      Value (USD)
                    </TableHead>
                  )}
                  {holders[0]?.last_transaction && (
                    <TableHead className="hidden lg:table-cell">
                      Last Transaction
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHolders.map((holder, index) => (
                  <TableRow key={holder.address}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="max-w-[120px] sm:max-w-[200px] truncate">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {holder.address}
                      </code>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBalance(holder.balance)} {tokenSymbol}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {holder.percentage.toFixed(2)}%
                    </TableCell>
                    {holders[0]?.value_usd && (
                      <TableCell className="text-right tabular-nums hidden md:table-cell">
                        $
                        {Number.parseFloat(
                          holder.value_usd || "0"
                        ).toLocaleString()}
                      </TableCell>
                    )}
                    {holders[0]?.last_transaction && (
                      <TableCell className="hidden lg:table-cell">
                        {holder.last_transaction}
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
