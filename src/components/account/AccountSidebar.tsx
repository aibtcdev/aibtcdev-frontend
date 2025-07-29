// components/account/AccountSidebar.tsx
"use client";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
}

export function AccountSidebar({ agentAddress, xHandle }: Props) {
  // State for each permission toggle
  const [canUseProposals, setCanUseProposals] = useState(false);
  const [canApproveRevokeContracts, setCanApproveRevokeContracts] =
    useState(false);
  const [canBuySell, setCanBuySell] = useState(false);
  const [canDeposit, setCanDeposit] = useState(false);

  useEffect(() => {
    const fetchAgentPermissions = async () => {
      if (!agentAddress) return;
      const [contractAddress, contractName] = agentAddress.split(".");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_CACHE_URL}/contract-calls/read-only/${contractAddress}/${contractName}/get-agent-permissions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: contractAddress,
              arguments: [],
            }),
          }
        );
        const data = await res.json();
        const perms = data?.data;
        if (perms) {
          setCanUseProposals(perms.canUseProposals);
          setCanApproveRevokeContracts(perms.canApproveRevokeContracts);
          setCanBuySell(perms.canBuySell);
          setCanDeposit(perms.canDeposit);
        }
      } catch (err) {
        console.error("Failed to fetch agent permissions:", err);
      }
    };

    fetchAgentPermissions();
  }, [agentAddress]);

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
            <Switch
              checked={canUseProposals}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch
              checked={canApproveRevokeContracts}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Trade sBTC and DAO tokens in contract
              </p>
            </div>
            <Switch
              checked={canBuySell}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Deposit tokens into the agent account
              </p>
            </div>
            <Switch
              checked={canDeposit}
              disabled
              className="pointer-events-none"
            />
          </div>
        </div>

        {/* Mobile: Vertical stack */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Vote on contributions</p>
            </div>
            <Switch
              checked={canUseProposals}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch
              checked={canApproveRevokeContracts}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Trade sBTC and DAO tokens in contract
              </p>
            </div>
            <Switch
              checked={canBuySell}
              disabled
              className="pointer-events-none"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">
                Deposit tokens into the agent account
              </p>
            </div>
            <Switch
              checked={canDeposit}
              disabled
              className="pointer-events-none"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
