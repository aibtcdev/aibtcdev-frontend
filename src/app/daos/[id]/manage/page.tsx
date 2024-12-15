import { Heading } from "@/components/catalyst/heading";
import BankSettings from "@/components/daos/bank-settings";
import ExtensionsTable from "@/components/daos/extensions-table";
import DaoStats from "@/components/daos/stats";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

// Types
interface Extension {
  id: number;
  name: string;
  type: string;
  description: string;
  status: string;
  lastUsed: string;
}

interface DaoData {
  treasuryBalance: number;
  totalRevenue: number;
  activeExtensions: number;
  totalExtensions: number;
  extensions: Extension[];
}

// Server-side data fetching
async function getDaoData(id: string): Promise<DaoData> {
  console.log("Fetching DAO data for ID:", id);
  // In a real app, this would fetch from your API/database
  return {
    treasuryBalance: 0,
    totalRevenue: 0,
    activeExtensions: 0,
    totalExtensions: 0,
    extensions: [
      {
        id: 1,
        name: "Treasury",
        type: "treasury",
        description: "Manages DAO assets and funds",
        status: "Active",
        lastUsed: "2024-03-15",
      },
      {
        id: 2,
        name: "Payments",
        type: "payments",
        description: "Handles payments and resource management",
        status: "Active",
        lastUsed: "2024-03-14",
      },
      {
        id: 3,
        name: "Messaging",
        type: "messaging",
        description: "On-chain communication system",
        status: "Active",
        lastUsed: "2024-03-13",
      },
      {
        id: 4,
        name: "Governance",
        type: "governance",
        description: "Proposal creation and voting management",
        status: "Inactive",
        lastUsed: "2024-02-28",
      },
      {
        id: 5,
        name: "Analytics",
        type: "analytics",
        description: "On-chain data analysis and reporting",
        status: "Inactive",
        lastUsed: "2024-02-15",
      },
      {
        id: 6,
        name: "Arbitrage",
        type: "trading",
        description: "Automated cross-chain arbitrage execution",
        status: "Inactive",
        lastUsed: "2024-02-10",
      },
      {
        id: 7,
        name: "Yield Farming",
        type: "defi",
        description: "Automated yield optimization and harvesting",
        status: "Inactive",
        lastUsed: "2024-01-30",
      },
      {
        id: 8,
        name: "NFT Manager",
        type: "nft",
        description: "NFT minting and collection management",
        status: "Inactive",
        lastUsed: "2024-01-25",
      },
      {
        id: 9,
        name: "Liquidity",
        type: "defi",
        description: "Automated liquidity provision and management",
        status: "Inactive",
        lastUsed: "2024-01-20",
      },
      {
        id: 10,
        name: "Security",
        type: "security",
        description: "Contract security monitoring and alerts",
        status: "Inactive",
        lastUsed: "2024-01-15",
      },
      {
        id: 11,
        name: "Bridge",
        type: "bridge",
        description: "Cross-chain asset bridging and transfers",
        status: "Inactive",
        lastUsed: "2024-01-10",
      },
      {
        id: 12,
        name: "Staking",
        type: "staking",
        description: "Stake management and reward distribution",
        status: "Inactive",
        lastUsed: "2024-01-05",
      },
    ],
  };
}

// export const runtime = "edge";

export default async function DaoManagement({
  params,
}: {
  params: { id: string };
}) {
  const daoData = await getDaoData(params.id);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-end justify-between gap-4 pb-6">
        <Heading>DAO Management</Heading>
        <Button variant="outline">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          View on Explorer
        </Button>
      </div>

      <DaoStats
        treasuryBalance={daoData.treasuryBalance}
        totalRevenue={daoData.totalRevenue}
        activeExtensions={daoData.activeExtensions}
        totalExtensions={daoData.totalExtensions}
      />

      <ExtensionsTable extensions={daoData.extensions} />

      <BankSettings />
    </div>
  );
}
