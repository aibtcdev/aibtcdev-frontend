"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "@stacks/connect";
import { Cl } from "@stacks/transactions";
import { useToast } from "@/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DepositPermissionModalProps {
  open: boolean;
  onClose: () => void;
  agentAddress: string | null;
}

export function DepositPermissionModal({
  open,
  onClose,
  agentAddress,
}: DepositPermissionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePermissionMutation = useMutation({
    mutationFn: async () => {
      if (!agentAddress) throw new Error("No agent address");

      try {
        const response = await request("stx_callContract", {
          contract: agentAddress as `${string}.${string}`,
          functionName: "set-agent-can-deposit-assets",
          functionArgs: [Cl.bool(true)],
          network: process.env.NEXT_PUBLIC_STACKS_NETWORK as
            | "mainnet"
            | "testnet",
        });

        return {
          txid: response.txid,
          functionName: "set-agent-can-deposit-assets",
          enabled: true,
        };
        // eslint-disable-next-line
      } catch (error: any) {
        if (error.code === 4001) {
          throw new Error("User cancelled the transaction");
        }
        throw new Error(
          `Failed to update deposit permission: ${error.message || "Unknown error"}`
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
        description: `Deposit permission update submitted. Transaction ID: ${data.txid}`,
      });

      onClose();
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

  const handleUpdatePermission = () => {
    setIsUpdating(true);
    updatePermissionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle>Deposit Permission Required</DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Your agent account doesn't have permission to receive token
            deposits. You need to enable this permission before you can deposit
            Tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="text-sm font-medium mb-2">What this enables:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Allows your agent to receive deposited tokens</li>
              <li>• Required for BTC deposit functionality</li>
              <li>• You can disable this permission anytime</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating || updatePermissionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePermission}
            disabled={isUpdating || updatePermissionMutation.isPending}
          >
            {isUpdating || updatePermissionMutation.isPending
              ? "Updating..."
              : "Enable Deposit Permission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
