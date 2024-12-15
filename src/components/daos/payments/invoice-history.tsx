import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface Invoice {
  id: number;
  resourceName: string;
  amount: number;
  userAddress: string;
  createdAt: string;
  blockHeight: number;
}

interface InvoiceHistoryProps {
  invoices: Invoice[];
}

export default function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSTX = (amount: number) => {
    return `${(amount / 1000000).toLocaleString()} STX`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Recent Invoices</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Block Height</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-mono">
                #{invoice.blockHeight}
              </TableCell>
              <TableCell>{invoice.resourceName}</TableCell>
              <TableCell>{formatSTX(invoice.amount)}</TableCell>
              <TableCell className="font-mono">
                {formatAddress(invoice.userAddress)}
              </TableCell>
              <TableCell>{formatTimestamp(invoice.createdAt)}</TableCell>
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
