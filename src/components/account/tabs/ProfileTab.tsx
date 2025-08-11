"use client";

import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AgentPermissions } from "@/components/account/AgentPermissions";
import { ConnectedWallet } from "@/components/account/ConnectedWallet";

interface ProfileTabProps {
  agentAddress: string | null;
}

export function ProfileTab({ agentAddress }: ProfileTabProps) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-1 rounded-xl border bg-card p-6">
          <AccountSidebar agentAddress={agentAddress} />
        </div>
        <div className="lg:col-span-1 rounded-xl border bg-card p-6">
          <AgentPermissions agentAddress={agentAddress} />
        </div>
      </div>
      <div className="mt-8 w-full">
        <ConnectedWallet />
      </div>
    </div>
  );
}
