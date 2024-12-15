// app/daos/[id]/manage/components/dao-stats.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, CircleDollarSign, Check } from "lucide-react";

interface DaoStatsProps {
  treasuryBalance: number;
  totalRevenue: number;
  activeExtensions: number;
  totalExtensions: number;
}

export default function DaoStats({
  treasuryBalance,
  totalRevenue,
  activeExtensions,
  totalExtensions,
}: DaoStatsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="h-4 w-4 mr-2" />
                <span className="font-medium">Treasury Balance</span>
              </div>
              <span className="text-xl font-bold">{treasuryBalance} STX</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CircleDollarSign className="h-4 w-4 mr-2" />
                <span className="font-medium">Total Revenue</span>
              </div>
              <span className="text-xl font-bold">{totalRevenue} STX</span>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2" />
                <span className="font-medium">Active Extensions</span>
              </div>
              <span className="text-xl font-bold">
                {activeExtensions}/{totalExtensions}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
