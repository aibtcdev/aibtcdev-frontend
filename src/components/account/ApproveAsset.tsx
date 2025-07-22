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
interface ApproveAssetButtonProps {
  contractToApprove: string;
  agentAccountContract: string;
  onSuccess?: () => void;
  className?: string;
}

const defaultApprovalType = getAgentAccountApprovalType("VOTING");

export function ApproveAssetButton({
  contractToApprove,
  agentAccountContract,
  onSuccess,
  className = "",
}: ApproveAssetButtonProps) {
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
        <DialogContent>
          <DialogTitle>
            {isLoading
              ? "Whitelisting..."
              : response
                ? response.success
                  ? "Success"
                  : "Failed"
                : "Confirm Whitelisting"}
          </DialogTitle>
          {!response && (
            <p className="text-sm">
              By whitelisting this asset you are approving agent account to
              submit contribution, evaluate and vote on it autonomously.
            </p>
          )}
          {response && (
            <div>
              <p className="text-sm">
                {response.success
                  ? "Asset whitelisted successfully."
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
                {isLoading ? "Whitelisting..." : "Confirm"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={() => {
              setConfirmOpen(true);
              setResponse(null);
            }}
            className={`bg-primary hover:bg-primary/90 px-2 ${className}`}
          >
            Enable proposal submission
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-sm">
            One time approval lets you submit contributions with the token from
            your agent account. You can revoke it anytime later.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
