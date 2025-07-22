"use client";

import { useState } from "react";
import { getAgentAccountApprovalType } from "@aibtc/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip";

interface ApproveContractButtonProps {
  contractToApprove: string;
  agentAccountContract: string;
  onSuccess?: () => void;
  className?: string;
}

const defaultApprovalType = getAgentAccountApprovalType("VOTING");

export function ApproveContractButton({
  contractToApprove,
  agentAccountContract,
  onSuccess,
  className = "",
}: ApproveContractButtonProps) {
  const { accessToken } = useAuth();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    success: boolean;
    message: string;
    link?: string;
  } | null>(null);

  const handleApprove = async () => {
    if (!accessToken) {
      console.error("No access token available.");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/agent_account/approve_contract?token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_account_contract: agentAccountContract,
            contract_to_approve: contractToApprove,
            approval_type: defaultApprovalType,
          }),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      const parsed =
        typeof result.output === "string"
          ? JSON.parse(result.output)
          : result.output;

      setResponse({
        success: parsed.success,
        message: parsed.message || result.message,
        link: parsed?.data?.link,
      });

      if (parsed.success && onSuccess) onSuccess();
    } catch (error) {
      setResponse({
        success: false,
        message: (error as Error).message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTitle>
          {isLoading
            ? "Approving Contract..."
            : response
              ? response.success
                ? "Success"
                : "Failed"
              : "Confirm Contract Approval"}
        </DialogTitle>
        <DialogContent>
          {!response && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="font-medium">Agent Account:</span>
                <span className="break-all text-muted-foreground">
                  {agentAccountContract}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium">Contract to Approve:</span>
                <span className="break-all text-muted-foreground">
                  {contractToApprove}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-medium">Approval Type:</span>
                <span>VOTING ({defaultApprovalType})</span>
              </div>

              <p className="text-sm text-muted-foreground">
                By approving this contract you are allowing your agent account
                to submit, evaluate and autonomously vote on contributions.
              </p>
            </div>
          )}

          {response && (
            <div>
              <p className="text-sm">
                {response.success
                  ? "Contract approved successfully."
                  : response.message}
              </p>
              {response.link && (
                <a
                  href={response.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline text-sm"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}

          {response && (
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-3 py-1 text-sm rounded-md border"
              >
                Close
              </Button>
            </div>
          )}

          {!response && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isLoading}
                className="px-3 py-1 text-sm rounded-md border"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-white text-sm px-3 py-1 rounded-md"
              >
                {isLoading ? "Approving..." : "Confirm"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
              setResponse(null);
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-transparent px-4 py-2 text-sm font-bold text-primary shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 motion-reduce:transition-none sm:px-4 sm:py-3 sm:text-base ${className}`}
          >
            Enable Contributions
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">
            One time approval lets you submit and vote on contributions with the
            token from your agent account. You can revoke it anytime later.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
