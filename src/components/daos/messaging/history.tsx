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

interface Message {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  blockHeight: number;
}

interface MessageHistoryProps {
  messages: Message[];
}

export default function MessageHistory({ messages }: MessageHistoryProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Message History</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Block Height</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead className="w-full">Message</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map((msg) => (
            <TableRow key={msg.id}>
              <TableCell className="font-mono">#{msg.blockHeight}</TableCell>
              <TableCell className="font-mono">
                {formatAddress(msg.sender)}
              </TableCell>
              <TableCell className="max-w-md truncate">{msg.message}</TableCell>
              <TableCell>{formatTimestamp(msg.timestamp)}</TableCell>
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
