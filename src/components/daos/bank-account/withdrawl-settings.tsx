import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface WithdrawalSettingsProps {
  settings: {
    withdrawalPeriod: number;
    withdrawalAmount: number;
    lastWithdrawalBlock: number;
  };
  currentHolder: string;
  stats: {
    accountBalance: number;
    lastWithdrawal: string;
  };
}

export default function WithdrawalSettings({
  settings,
  currentHolder,
  stats,
}: WithdrawalSettingsProps) {
  console.log(stats);
  // const formatSTX = (amount: number) => {
  //   return `${(amount / 1000000).toLocaleString()} STX`;
  // };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Withdrawal Settings</h2>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Update Holder
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="withdrawalPeriod">Withdrawal Period (blocks)</Label>
          <Input
            id="withdrawalPeriod"
            type="number"
            defaultValue={settings.withdrawalPeriod}
          />
          <p className="text-sm text-muted-foreground">
            Number of blocks between withdrawals (~10 minutes per block)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="withdrawalAmount">Withdrawal Amount</Label>
          <Input
            id="withdrawalAmount"
            type="number"
            defaultValue={settings.withdrawalAmount / 1000000}
          />
          <p className="text-sm text-muted-foreground">
            Amount in STX that can be withdrawn each period
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-muted p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Current Holder:</span>
          <span className="text-sm font-mono">
            {formatAddress(currentHolder)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Last Withdrawal Block:</span>
          <span className="text-sm font-mono">
            #{settings.lastWithdrawalBlock}
          </span>
        </div>
      </div>
    </div>
  );
}
