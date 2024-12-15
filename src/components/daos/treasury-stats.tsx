"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Coins, Database, Box } from "lucide-react";

interface TreasuryStatsProps {
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

export default function TreasuryStats({ stats }: TreasuryStatsProps) {
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="font-medium">STX Balance</span>
            </div>
            <span className="text-xl font-bold">
              {stats.stxBalance.toLocaleString()} STX
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              <span className="font-medium">FT Value</span>
            </div>
            <span className="text-xl font-bold">
              ${stats.totalFtValue.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Box className="h-4 w-4 mr-2" />
              <span className="font-medium">NFTs</span>
            </div>
            <span className="text-xl font-bold">{stats.totalNfts}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              <span className="font-medium">Stacked STX</span>
            </div>
            <span className="text-xl font-bold">
              {stats.stackedStx.toLocaleString()} STX
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
