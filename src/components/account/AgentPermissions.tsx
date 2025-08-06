"use client";

import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";

interface Props {
  agentAddress: string | null;
  network?: "mainnet" | "testnet";
}

interface AgentPermissions {
  canUseProposals: boolean;
  canApproveRevokeContracts: boolean;
  canBuySell: boolean;
  canDeposit: boolean;
}

export function AgentPermissions({ agentAddress, network = "testnet" }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          cacheControl: bustCache
            ? {
                bustCache: true,
                ttl: 3600,
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
    queryFn: () => fetchPermissions(false),
    enabled: !!agentAddress,
  });

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
          functionName,
          functionArgs: [Cl.bool(enabled)],
          network,
        });

        return {
          txid: response.txid,
          functionName,
          enabled,
        };
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error("User cancelled the transaction");
        }
        throw new Error(
          `Failed to update ${functionName}: ${error.message || "Unknown error"}`
        );
      }
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["agent-permissions", agentAddress],
      });

      await queryClient.fetchQuery({
        queryKey: ["agent-permissions", agentAddress],
        queryFn: () => fetchPermissions(true),
        staleTime: 0,
      });

      toast({
        title: "Transaction Submitted",
        description: `Permission update submitted. Transaction ID: ${data.txid}`,
      });
    },
    onError: (error) => {
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
    <div className="space-y-2 md:space-y-2 w-full">
      <p className="text-sm font-semibold text-muted-foreground text-center md:text-left">
        Agent Permissions
      </p>

      <div className="space-y-2">
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
  );
}
