"use client";

import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";
import { RotateCcw } from "lucide-react";

interface Props {
  agentAddress: string | null;
}

export function AgentPermissions({ agentAddress }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use the shared hook for consistency
  const { data: permissions, isLoading } = useAgentPermissions(agentAddress);

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
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
            | "mainnet"
            | "testnet",
        });

        return {
          txid: response.txid,
          functionName,
          enabled,
        };
        // eslint-disable-next-line
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
      // Invalidate all agent permission queries
      await queryClient.invalidateQueries({
        queryKey: ["agent-permissions"],
      });

      // Force refetch with cache busting
      await queryClient.refetchQueries({
        queryKey: ["agent-permissions"],
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

  const { canUseProposals, canApproveRevokeContracts, canBuySell, canDeposit } =
    permissions || {};

  return (
    <div className="space-y-2 md:space-y-2 w-full">
      <p className="text-sm font-semibold text-muted-foreground text-center md:text-left">
        Adjust which actions your agent has permission to execute
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-sm border bg-background">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Vote on Contributions</p>
            <p className="text-xs text-muted-foreground mt-1">
              Allows agent to vote with tokens in the agent voting account
            </p>
          </div>
          {isLoading ? (
            <RotateCcw className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={canUseProposals || false}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-use-proposals",
                  canUseProposals || false
                )
              }
              disabled={updatePermissionMutation.isPending}
            />
          )}
        </div>
        <div className="flex items-center justify-between p-3 rounded-sm border bg-background">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Manage approved contracts</p>
            <p className="text-xs text-muted-foreground mt-1">
              Allows agent to approve and revoke contracts for use with agent
              voting account
            </p>
          </div>
          {isLoading ? (
            <RotateCcw className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={canApproveRevokeContracts || false}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-approve-revoke-contracts",
                  canApproveRevokeContracts || false
                )
              }
              disabled={updatePermissionMutation.isPending}
            />
          )}
        </div>
        <div className="flex items-center justify-between p-3 rounded-sm border bg-background">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Trade sBTC and DAO tokens</p>
            <p className="text-xs text-muted-foreground mt-1">
              Allows agent to buy and sell within the agent voting account
            </p>
          </div>
          {isLoading ? (
            <RotateCcw className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={canBuySell || false}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-buy-sell-assets",
                  canBuySell || false
                )
              }
              disabled={updatePermissionMutation.isPending}
            />
          )}
        </div>
        <div className="flex items-center justify-between p-3 rounded-sm border bg-background">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Initiate deposit or withdraw</p>
            <p className="text-xs text-muted-foreground mt-1">
              Allows agent to deposit or withdraw from the agent voting account.
              *funds always go to owner / connected wallet
            </p>
          </div>
          {isLoading ? (
            <RotateCcw className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={canDeposit || false}
              onCheckedChange={() =>
                handleToggle(
                  "set-agent-can-deposit-assets",
                  canDeposit || false
                )
              }
              disabled={updatePermissionMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
