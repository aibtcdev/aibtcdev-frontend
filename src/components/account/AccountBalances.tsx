"use client";

import { Coins } from "lucide-react";

interface AccountBalancesProps {
  userAgentAddress: string | null;
  userAgentContractBalance: string;
}

export function AccountBalances({
  userAgentAddress,
  userAgentContractBalance,
}: AccountBalancesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Account Balances</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {userAgentAddress && userAgentContractBalance && (
              <tr className="hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap">Agent Account</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {userAgentContractBalance}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
