"use client";

import { useMemo } from "react";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import {
  // Search,
  // ArrowUpDown,
  Users,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { DAOTabLayout } from "@/components/daos/DAOTabLayout";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/useClipboard";
import { getExplorerLink } from "@/utils/format";

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
  // const [searchQuery, setSearchQuery] = useState("");
  // const [sortBy, setSortBy] = useState("balance");
  const { copyToClipboard, copiedText } = useClipboard();

  // const filteredHolders = useMemo(() => {
  //   return holders.filter((holder) =>
  //     holder.address.toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  // }, [holders, searchQuery]);

  // Sort by balance by default (highest to lowest)
  const sortedHolders = useMemo(() => {
    return [...holders].sort((a, b) => {
      return Number.parseFloat(b.balance) - Number.parseFloat(a.balance);
    });
  }, [holders]);

  // const toolbar = (
  //   <div className="flex flex-col gap-4 sm:items-end">
  //     <div className="relative w-full max-w-sm">
  //       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  //       <Input
  //         placeholder="Search by address..."
  //         value={searchQuery}
  //         onChange={(e) => setSearchQuery(e.target.value)}
  //         className="pl-9"
  //       />
  //     </div>
  //     <Select value={sortBy} onValueChange={setSortBy}>
  //       <SelectTrigger className="w-[180px]">
  //         <div className="flex items-center gap-2">
  //           <ArrowUpDown className="h-4 w-4" />
  //           <SelectValue placeholder="Sort by" />
  //         </div>
  //       </SelectTrigger>
  //       <SelectContent>
  //         <SelectItem value="balance">Balance</SelectItem>
  //         <SelectItem value="percentage">Percentage</SelectItem>
  //       </SelectContent>
  //     </Select>
  //   </div>
  // );

  return (
    <DAOTabLayout
      title="Token Holders"
      description="View token distribution and holder information"
      icon={Users}
      // toolbar={toolbar}
      isEmpty={holders.length === 0}
      emptyTitle="No Holders Found"
      emptyDescription="No token holders found for this DAO."
      emptyIcon={Users}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">#</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(holder.address)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedText === holder.address ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={getExplorerLink("address", holder.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DAOTabLayout>
  );
}
