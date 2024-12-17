// app/daos/[daoId]/extensions/messaging/configure/page.tsx
import { Heading } from "@/components/catalyst/heading";
import MessageHistory from "@/components/daos/messaging/history";
import MessagingSettings from "@/components/daos/messaging/settings";
import MessagingStats from "@/components/daos/messaging/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Save } from "lucide-react";

// Types
interface MessagingConfig {
  contractAddress: string;
  stats: {
    totalMessages: number;
    uniqueSenders: number;
    averageMessageSize: number;
    lastMessage: string;
    lastMessageTime: string;
  };
  messages: {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    blockHeight: number;
  }[];
}

// Server-side data fetching
async function getMessagingConfig(daoId: string): Promise<MessagingConfig> {
  console.log("Fetching messaging config for DAO ID:", daoId);
  // This would be an API call in production
  return {
    contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.messaging",
    stats: {
      totalMessages: 156,
      uniqueSenders: 24,
      averageMessageSize: 128,
      lastMessage: "Latest network status update...",
      lastMessageTime: "2024-03-15T14:30:00Z",
    },
    messages: [
      {
        id: 1,
        sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        message: "Network status: All systems operational",
        timestamp: "2024-03-15T14:30:00Z",
        blockHeight: 12345,
      },
      {
        id: 2,
        sender: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        message: "Scheduled maintenance completed successfully",
        timestamp: "2024-03-15T13:15:00Z",
        blockHeight: 12344,
      },
      // Add more message history as needed
    ],
  };
}

export default async function MessagingConfiguration({
  params,
}: {
  params: { daoId: string };
}) {
  const config = await getMessagingConfig(params.daoId);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <Heading>Messaging Extension Configuration</Heading>
          <p className="text-muted-foreground">
            Configure messaging settings and view message history
          </p>
          <code className="text-sm font-mono text-muted-foreground">
            {config.contractAddress}
          </code>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MessagingStats stats={config.stats} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardContent className="pt-6">
            <MessagingSettings />
          </CardContent>
        </Card>

        <MessageHistory messages={config.messages} />
      </div>
    </div>
  );
}
