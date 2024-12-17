// app/daos/[daoId]/extensions/payments/configure/page.tsx
import { Heading } from "@/components/catalyst/heading";
import InvoiceHistory from "@/components/daos/payments/invoice-history";
import ResourcesTable from "@/components/daos/payments/resources-table";
import PaymentStats from "@/components/daos/payments/stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Save } from "lucide-react";

// Types
interface Resource {
  id: number;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  createdAt: string;
  totalSpent: number;
  totalUsed: number;
}

interface Invoice {
  id: number;
  resourceName: string;
  amount: number;
  userAddress: string;
  createdAt: string;
  blockHeight: number;
}

interface PaymentConfig {
  contractAddress: string;
  stats: {
    totalRevenue: number;
    activeResources: number;
    totalResources: number;
    uniqueUsers: number;
    totalInvoices: number;
  };
  resources: Resource[];
  recentInvoices: Invoice[];
}

// Server-side data fetching
async function getPaymentConfig(daoId: string): Promise<PaymentConfig> {
  console.log("Fetching payment config for DAO ID:", daoId);
  // This would be an API call in production
  return {
    contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.payments",
    stats: {
      totalRevenue: 1234567,
      activeResources: 3,
      totalResources: 5,
      uniqueUsers: 25,
      totalInvoices: 156,
    },
    resources: [
      {
        id: 1,
        name: "API Access",
        description: "Access to the DAO's API endpoints",
        price: 100000000, // 100 STX
        enabled: true,
        createdAt: "2024-03-01T00:00:00Z",
        totalSpent: 500000000,
        totalUsed: 5,
      },
      {
        id: 2,
        name: "Data Analysis",
        description: "Custom data analysis reports",
        price: 50000000, // 50 STX
        enabled: true,
        createdAt: "2024-03-02T00:00:00Z",
        totalSpent: 250000000,
        totalUsed: 5,
      },
      {
        id: 3,
        name: "Premium Support",
        description: "24/7 priority support access",
        price: 75000000, // 75 STX
        enabled: false,
        createdAt: "2024-03-03T00:00:00Z",
        totalSpent: 150000000,
        totalUsed: 2,
      },
    ],
    recentInvoices: [
      {
        id: 1,
        resourceName: "API Access",
        amount: 100000000,
        userAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        createdAt: "2024-03-15T14:30:00Z",
        blockHeight: 12345,
      },
      {
        id: 2,
        resourceName: "Data Analysis",
        amount: 50000000,
        userAddress: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        createdAt: "2024-03-15T13:15:00Z",
        blockHeight: 12344,
      },
    ],
  };
}

export default async function PaymentsConfiguration({
  params,
}: {
  params: { daoId: string };
}) {
  const config = await getPaymentConfig(params.daoId);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <Heading>Payments Extension Configuration</Heading>
          <p className="text-muted-foreground">
            Configure resources and manage payment settings
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
        <PaymentStats stats={config.stats} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardContent className="pt-6">
            <ResourcesTable resources={config.resources} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <InvoiceHistory invoices={config.recentInvoices} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
