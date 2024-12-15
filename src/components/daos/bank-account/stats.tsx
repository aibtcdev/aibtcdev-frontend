import { Card, CardContent } from "@/components/ui/card";
import { Wallet, ArrowUpDown, Hash } from "lucide-react";

interface AccountStatsProps {
  stats: {
    accountBalance: number;
    totalWithdrawn: number;
    averageWithdrawalSize: number;
    withdrawalCount: number;
    lastWithdrawal: string;
  };
}

export default function AccountStats({ stats }: AccountStatsProps) {
  const formatSTX = (amount: number) => {
    return `${(amount / 1000000).toLocaleString()} STX`;
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="font-medium">Balance</span>
            </div>
            <span className="text-xl font-bold">
              {formatSTX(stats.accountBalance)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <span className="font-medium">Total Withdrawn</span>
            </div>
            <span className="text-xl font-bold">
              {formatSTX(stats.totalWithdrawn)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              <span className="font-medium">Total Withdrawals</span>
            </div>
            <span className="text-xl font-bold">{stats.withdrawalCount}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
