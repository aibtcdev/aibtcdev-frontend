// app/daos/[daoId]/extensions/treasury/configure/page.tsx
import { Heading } from "@/components/catalyst/heading";
import AllowedAssets from "@/components/daos/allowed-assets";
import TreasurySettings from "@/components/daos/treasury-settings";
import TreasuryStats from "@/components/daos/treasury-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Save } from "lucide-react";

// Types
interface TreasuryConfig {
  name: string;
  contractAddress: string;
  settings: {
    allowedAssets: {
      address: string;
      enabled: boolean;
      type: "ft" | "nft";
      name: string;
      lastUsed?: string;
      balance?: number;
    }[];
    withdrawalPeriod: number;
    withdrawalLimit: number;
    stackingEnabled: boolean;
    minProposalAmount: number;
  };
  stats: {
    stxBalance: number;
    totalFtValue: number;
    totalNfts: number;
    lastActivity: string;
    totalInflow: number;
    totalOutflow: number;
    stackedStx: number;
  };
}

// Fetch treasury data
async function getTreasuryConfig(daoId: string): Promise<TreasuryConfig> {
  console.log(daoId);
  // This would be an API call in production
  return {
    name: "Treasury",
    contractAddress:
      "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.aibtcdev-treasury",
    settings: {
      allowedAssets: [
        {
          address: "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usda-token",
          enabled: true,
          type: "ft",
          name: "USDA",
          lastUsed: "2024-03-15",
          balance: 50000,
        },
        {
          address: "SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.arkadiko-token",
          enabled: true,
          type: "ft",
          name: "DIKO",
          lastUsed: "2024-03-10",
          balance: 25000,
        },
        {
          address: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bitcoin-monkeys",
          enabled: true,
          type: "nft",
          name: "Bitcoin Monkeys",
          lastUsed: "2024-02-28",
          balance: 5,
        },
      ],
      withdrawalPeriod: 144,
      withdrawalLimit: 10000,
      stackingEnabled: true,
      minProposalAmount: 1000,
    },
    stats: {
      stxBalance: 500000,
      totalFtValue: 75000,
      totalNfts: 5,
      lastActivity: "2024-03-15",
      totalInflow: 750000,
      totalOutflow: 250000,
      stackedStx: 100000,
    },
  };
}

export default async function TreasuryConfiguration({
  params,
}: {
  params: { daoId: string };
}) {
  const config = await getTreasuryConfig(params.daoId);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <Heading>Treasury Configuration</Heading>
          <p className="text-muted-foreground">
            Configure treasury settings and manage allowed assets
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TreasuryStats stats={config.stats} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardContent className="pt-6">
            <TreasurySettings
              settings={{
                withdrawalPeriod: config.settings.withdrawalPeriod,
                withdrawalLimit: config.settings.withdrawalLimit,
                stackingEnabled: config.settings.stackingEnabled,
                minProposalAmount: config.settings.minProposalAmount,
              }}
            />
          </CardContent>
        </Card>

        <AllowedAssets assets={config.settings.allowedAssets} />
      </div>
    </div>
  );
}
