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
    extensions: [],
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
