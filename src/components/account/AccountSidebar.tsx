// components/account/AccountSidebar.tsx
"use client";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
}

export function AccountSidebar({ agentAddress, xHandle }: Props) {
  return (
    <aside className="w-full max-w-xs shrink-0 space-y-6 md:space-y-6 lg:sticky lg:top-8">
      {/* Avatar - Hidden on mobile */}
      <div className="hidden md:flex flex-col items-center gap-2">
        <Avatar className="h-28 w-28">
          <AvatarFallback delayMs={0}>
            <User className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">Your Name</h2>
        <p className="text-sm text-muted-foreground">
          @{xHandle ?? "x‑handle"}
        </p>
      </div>

      {/* Agent account - Hidden on mobile */}
      <div className="hidden md:block space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Bot className="h-3 w-3" />
          Agent Account
        </p>
        {agentAddress ? (
          <div className="break-all">{agentAddress}</div>
        ) : (
          <p className="text-xs italic text-muted-foreground">Not connected</p>
        )}
      </div>

      {/* Configuration Settings - Responsive layout */}
      <div className="space-y-2 md:space-y-2">
        <p className="text-sm font-semibold text-muted-foreground text-center md:text-left">
          Agent Permissions
        </p>

        {/* Desktop: Vertical stack */}
        <div className="hidden md:block space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Vote on contributions</p>
            </div>
            <Switch id="canUseProposals-desktop" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch id="canApproveRevokecontracts-desktop" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Trade sBTC and DAO tokens in contract
              </p>
            </div>
            <Switch id="canBuySell-desktop" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Deposit tokens into the agent account
              </p>
            </div>
            <Switch id="canDeposit-desktop" />
          </div>
        </div>

        {/* Mobile: Vertical stack */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Vote on contributions</p>
            </div>
            <Switch id="canUseProposals-mobile" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch id="canApproveRevokecontracts-mobile" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Trade sBTC and DAO tokens in contract
              </p>
            </div>
            <Switch id="canBuySell-mobile" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Deposit tokens into the agent account
              </p>
            </div>
            <Switch id="canDeposit-mobile" />
          </div>
        </div>
      </div>
    </aside>
  );
}
