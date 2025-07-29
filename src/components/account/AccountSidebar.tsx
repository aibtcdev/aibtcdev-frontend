// components/account/AccountSidebar.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
  network?: "mainnet" | "testnet";
}

interface AgentPermissions {
  canUseProposals: boolean;
  canApproveRevokeContracts: boolean;
  canBuySell: boolean;
  canDeposit: boolean;
}

export function AccountSidebar({
  agentAddress,
  xHandle,
  network = "testnet",
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agent permissions with conditional cache busting
  const fetchPermissions = async (
    bustCache = false
  ): Promise<AgentPermissions> => {
    if (!agentAddress) throw new Error("No agent address");

    const [contractAddress, contractName] = agentAddress.split(".");
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
          // Add cache control in the request body
          cacheControl: bustCache
            ? {
                bustCache: true, // Force a fresh request
                ttl: 3600, // Cache for 1 hour
              }
            : undefined,
        }),
      }
    );

    if (!res.ok) throw new Error("Failed to fetch permissions");

    const data = await res.json();
    return (
      data?.data || {
        canUseProposals: true,
        canApproveRevokeContracts: true,
        canBuySell: false,
        canDeposit: true,
      }
    );
  };

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["agent-permissions", agentAddress],
    queryFn: () => fetchPermissions(false), // Don't bust cache on initial load
    enabled: !!agentAddress,
  });

  // Mutation for updating permissions using Stacks Connect
  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      functionName,
      enabled,
    }: {
      functionName: string;
      enabled: boolean;
    }) => {
      if (!agentAddress) throw new Error("No agent address");

      try {
        const response = await request("stx_callContract", {
          contract: agentAddress as `${string}.${string}`,
          functionName, // name of the function to call
          functionArgs: [Cl.bool(enabled)], // array of Clarity values as arguments
          network, // 'mainnet' or 'testnet'
        });

        return {
          txid: response.txid,
          functionName,
          enabled,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        // Handle user cancellation or other errors
        if (error.code === 4001) {
          throw new Error("User cancelled the transaction");
        }
        throw new Error(
          `Failed to update ${functionName}: ${error.message || "Unknown error"}`
        );
      }
    },
    onSuccess: async (data) => {
      // First, invalidate the current query to remove stale data
      await queryClient.invalidateQueries({
        queryKey: ["agent-permissions", agentAddress],
      });

      // Then refetch with cache busting to get fresh data
      await queryClient.fetchQuery({
        queryKey: ["agent-permissions", agentAddress],
        queryFn: () => fetchPermissions(true), // Bust cache after permission update
        staleTime: 0, // Treat as immediately stale
      });

      toast({
        title: "Transaction Submitted",
        description: `Permission update submitted. Transaction ID: ${data.txid}`,
      });
    },
    onError: (error) => {
      // Handle user cancellation gracefully
      if (error.message === "User cancelled the transaction") {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the permission update.",
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to update permission: ${error.message}`,
          variant: "destructive",
        });
      }
    },
  });

  const handleToggle = (functionName: string, currentValue: boolean) => {
    updatePermissionMutation.mutate({
      functionName,
      enabled: !currentValue,
    });
  };

  // Use default values if permissions are not loaded yet
  if (isLoading || !permissions) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading permissions...
      </div>
    );
  }

  const { canUseProposals, canApproveRevokeContracts, canBuySell, canDeposit } =
    permissions;

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
              onCheckedChange={() =>
                handleToggle("set-agent-can-use-proposals", canUseProposals)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch
              checked={canApproveRevokeContracts}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-approve-revoke-contracts",
                  canApproveRevokeContracts
                )
              }
              disabled={isLoading || updatePermissionMutation.isPending}
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
              onCheckedChange={() =>
                handleToggle("set-agent-can-buy-sell-assets", canBuySell)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
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
              onCheckedChange={() =>
                handleToggle("set-agent-can-deposit-assets", canDeposit)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
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
              onCheckedChange={() =>
                handleToggle("set-agent-can-use-proposals", canUseProposals)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Manage approved contracts</p>
            </div>
            <Switch
              checked={canApproveRevokeContracts}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-approve-revoke-contracts",
                  canApproveRevokeContracts
                )
              }
              disabled={isLoading || updatePermissionMutation.isPending}
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
              onCheckedChange={() =>
                handleToggle("set-agent-can-buy-sell-assets", canBuySell)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
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
              onCheckedChange={() =>
                handleToggle("set-agent-can-deposit-assets", canDeposit)
              }
              disabled={isLoading || updatePermissionMutation.isPending}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
