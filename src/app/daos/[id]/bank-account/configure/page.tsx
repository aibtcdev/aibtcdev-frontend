// app/daos/[daoId]/extensions/bank-account/configure/page.tsx
import { Heading } from "@/components/catalyst/heading";
import TransactionHistory from "@/components/daos/bank-account/history";
import AccountStats from "@/components/daos/bank-account/stats";
import WithdrawalSettings from "@/components/daos/bank-account/withdrawl-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Save } from "lucide-react";

// Types
interface BankAccountConfig {
  contractAddress: string;
  currentHolder: string;
  settings: {
    withdrawalPeriod: number;
    withdrawalAmount: number;
    lastWithdrawalBlock: number;
  };
  stats: {
    accountBalance: number;
    totalWithdrawn: number;
    averageWithdrawalSize: number;
    withdrawalCount: number;
    lastWithdrawal: string;
  };
  transactions: {
    id: number;
    type: "withdrawal" | "deposit";
    amount: number;
    sender: string;
    recipient: string;
    timestamp: string;
    blockHeight: number;
  }[];
}

// Server-side data fetching
async function getBankAccountConfig(daoId: string): Promise<BankAccountConfig> {
  console.log("Fetching bank account config for DAO ID:", daoId);
  // This would be an API call in production
  return {
    contractAddress: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bank-account",
    currentHolder: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    settings: {
      withdrawalPeriod: 144,
      withdrawalAmount: 10000000,
      lastWithdrawalBlock: 12340,
    },
    stats: {
      accountBalance: 500000000,
      totalWithdrawn: 150000000,
      averageWithdrawalSize: 10000000,
      withdrawalCount: 15,
      lastWithdrawal: "2024-03-15T14:30:00Z",
    },
    transactions: [
      {
        id: 1,
        type: "deposit",
        amount: 20000000,
        sender: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
        recipient: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bank-account",
        timestamp: "2024-03-15T14:30:00Z",
        blockHeight: 12345,
      },
      {
        id: 2,
        type: "withdrawal",
        amount: 10000000,
        sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bank-account",
        recipient: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        timestamp: "2024-03-15T13:15:00Z",
        blockHeight: 12344,
      },
    ],
  };
}

export default async function BankAccountConfiguration({
  params,
}: {
  params: { daoId: string };
}) {
  const config = await getBankAccountConfig(params.daoId);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <Heading>Bank Account Configuration</Heading>
          <p className="text-muted-foreground">
            Configure withdrawal settings and manage account holder
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
        <AccountStats stats={config.stats} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardContent className="pt-6">
            <WithdrawalSettings
              settings={config.settings}
              currentHolder={config.currentHolder}
              stats={config.stats}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <TransactionHistory transactions={config.transactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
