// components/account/AccountSidebar.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
}

export function AccountSidebar({ agentAddress, xHandle }: Props) {
  return (
    <aside className="w-full max-w-xs shrink-0 space-y-6 md:space-y-6">
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
              <p className="text-sm font-medium">Proposal Submission</p>
              <p className="text-xs text-muted-foreground">
                Enable submitting proposals via agent
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Voting Contract</p>
              <p className="text-xs text-muted-foreground">
                Enable on-chain voting via smart contract
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Token Purchase</p>
              <p className="text-xs text-muted-foreground">
                Enable users to purchase governance tokens
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
        </div>

        {/* Mobile: Centered vertical stack */}
        <div className="md:hidden space-y-2 flex flex-col items-center">
          <div className="flex flex-col items-center text-center p-3 rounded-md border bg-background w-full max-w-xs">
            <div className="mb-2">
              <p className="text-sm font-medium">Proposal Submission</p>
              <p className="text-xs text-muted-foreground">
                Enable submitting proposals via agent
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 w-full">
              Enable
            </Button>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-md border bg-background w-full max-w-xs">
            <div className="mb-2">
              <p className="text-sm font-medium">Voting Contract</p>
              <p className="text-xs text-muted-foreground">
                Enable on-chain voting via smart contract
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 w-full">
              Enable
            </Button>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-md border bg-background w-full max-w-xs">
            <div className="mb-2">
              <p className="text-sm font-medium">Token Purchase</p>
              <p className="text-xs text-muted-foreground">
                Enable users to purchase governance tokens
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 w-full">
              Enable
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
