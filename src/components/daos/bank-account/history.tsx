import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  id: number;
  type: "withdrawal" | "deposit";
  amount: number;
  sender: string;
  recipient: string;
  timestamp: string;
  blockHeight: number;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSTX = (amount: number) => {
    return `${(amount / 1000000).toLocaleString()} STX`;
  };

  const TransactionIcon = ({ type }: { type: "withdrawal" | "deposit" }) => {
    return type === "withdrawal" ? (
      <ArrowUpRight className="h-4 w-4 text-red-500" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Transaction History</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Block Height</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-mono">#{tx.blockHeight}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TransactionIcon type={tx.type} />
                  <span className="capitalize">{tx.type}</span>
                </div>
              </TableCell>
              <TableCell>{formatSTX(tx.amount)}</TableCell>
              <TableCell className="font-mono">
                {formatAddress(tx.sender)}
              </TableCell>
              <TableCell className="font-mono">
                {formatAddress(tx.recipient)}
              </TableCell>
              <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
