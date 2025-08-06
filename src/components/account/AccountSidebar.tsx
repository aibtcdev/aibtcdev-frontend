// components/account/AccountSidebar.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
}

const truncateAddress = (address: string) => {
  if (!address) return "Not connected";
  if (address.length <= 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

export function AccountSidebar({ agentAddress, xHandle }: Props) {
  return (
    <aside className="w-full shrink-0 space-y-6 md:space-y-6 lg:sticky lg:top-8">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Your Name</h2>
          <p className="text-sm text-muted-foreground">
            @{xHandle ?? "x-handle-placeholder"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This is a placeholder for the user's bio.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Bot className="h-3 w-3" />
              Agent Account
            </p>
            <div className="break-all font-mono text-sm">
              {truncateAddress(agentAddress || "")}
            </div>
          </div>
        </div>
        <Avatar className="h-28 w-28">
          <AvatarFallback delayMs={0}>
            <User className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
