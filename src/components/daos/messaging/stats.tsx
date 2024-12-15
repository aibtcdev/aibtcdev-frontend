import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, BarChart2 } from "lucide-react";

interface MessagingStatsProps {
  stats: {
    totalMessages: number;
    uniqueSenders: number;
    averageMessageSize: number;
    lastMessage: string;
    lastMessageTime: string;
  };
}

export default function MessagingStats({ stats }: MessagingStatsProps) {
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="font-medium">Total Messages</span>
            </div>
            <span className="text-xl font-bold">{stats.totalMessages}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">Unique Senders</span>
            </div>
            <span className="text-xl font-bold">{stats.uniqueSenders}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              <span className="font-medium">Avg. Message Size</span>
            </div>
            <span className="text-xl font-bold">
              {stats.averageMessageSize} bytes
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
