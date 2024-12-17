"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TreasurySettingsProps {
  settings: {
    withdrawalPeriod: number;
    withdrawalLimit: number;
    stackingEnabled: boolean;
    minProposalAmount: number;
  };
}

export default function TreasurySettings({ settings }: TreasurySettingsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Treasury Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="withdrawalPeriod">Withdrawal Period (blocks)</Label>
          <Input
            id="withdrawalPeriod"
            type="number"
            defaultValue={settings.withdrawalPeriod}
          />
          <p className="text-sm text-muted-foreground">
            Number of blocks between withdrawals
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="withdrawalLimit">Withdrawal Limit (STX)</Label>
          <Input
            id="withdrawalLimit"
            type="number"
            defaultValue={settings.withdrawalLimit}
          />
          <p className="text-sm text-muted-foreground">
            Maximum amount that can be withdrawn per period
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minProposalAmount">
            Minimum Proposal Amount (STX)
          </Label>
          <Input
            id="minProposalAmount"
            type="number"
            defaultValue={settings.minProposalAmount}
          />
          <p className="text-sm text-muted-foreground">
            Minimum amount required for a proposal
          </p>
        </div>
        <div className="space-y-2">
          <Label className="block mb-2">Stacking</Label>
          <div className="flex items-center space-x-2">
            <Switch id="stackingEnabled" checked={settings.stackingEnabled} />
            <Label htmlFor="stackingEnabled">Enable STX stacking</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Allow the treasury to participate in STX stacking
          </p>
        </div>
      </div>
    </div>
  );
}
