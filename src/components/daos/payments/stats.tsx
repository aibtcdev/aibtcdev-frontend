import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Layout, Users } from "lucide-react";

interface PaymentStatsProps {
  stats: {
    totalRevenue: number;
    activeResources: number;
    totalResources: number;
    uniqueUsers: number;
    totalInvoices: number;
  };
}

export default function PaymentStats({ stats }: PaymentStatsProps) {
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
              <span className="font-medium">Total Revenue</span>
            </div>
            <span className="text-xl font-bold">
              {formatSTX(stats.totalRevenue)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Layout className="h-4 w-4 mr-2" />
              <span className="font-medium">Active Resources</span>
            </div>
            <span className="text-xl font-bold">
              {stats.activeResources}/{stats.totalResources}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">Unique Users</span>
            </div>
            <span className="text-xl font-bold">{stats.uniqueUsers}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
