"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DAO, Token } from "@/types/supabase";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/queries/dao-queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DAOSendProposalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
  className?: string;
}

export function DAOSendProposal({
  daoId,
  size = "default",
  className,
}: DAOSendProposalProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const { activeThreadId, connect, isConnected } = useChatStore();
  const { accessToken, isLoading: isSessionLoading } = useSessionStore();

  // Fetch DAO extensions
  const { data: daoExtensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
  });

  // Connect WebSocket when component mounts using the token from session store
  useEffect(() => {
    if (accessToken && !isConnected && !isSessionLoading) {
      connect(accessToken);
    }
  }, [accessToken, isConnected, connect, isSessionLoading]);

  // Extract the required extension data
  const extractExtensionData = () => {
    if (!daoExtensions || daoExtensions.length === 0) {
      console.log("No DAO extensions found");
      return null;
    }

    // Find the specific extensions needed
    const actionProposalsVotingExt = daoExtensions.find(
      (ext) => ext.type === "EXTENSIONS_ACTION_PROPOSALS"
    );
    const actionProposalContractExt = daoExtensions.find(
      (ext) => ext.type === "ACTIONS_MESSAGING_SEND_MESSAGE"
    );
    const daoTokenExt = daoExtensions.find((ext) => ext.type === "TOKEN_DAO");

    // Check if all required extensions are found
    if (
      !actionProposalsVotingExt ||
      !actionProposalContractExt ||
      !daoTokenExt
    ) {
      console.error("Missing required extensions", {
        actionProposalsVotingExt,
        actionProposalContractExt,
        daoTokenExt,
      });
      return null;
    }

    // Create the data object
    const extensionData = {
      action_proposals_voting_extension:
        actionProposalsVotingExt.contract_principal,
      action_proposal_contract_to_execute:
        actionProposalContractExt.contract_principal,
      dao_token_contract_address: daoTokenExt.contract_principal,
      message: inputValue.trim(),
    };

    return extensionData;
  };

  // Send the request to the endpoint
  const sendRequest = async (extensionData: any) => {
    if (!accessToken) {
      setInputError("Access token is required");
      return null;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `https://core-staging.aibtc.dev/tools/dao/action_proposals/propose_send_message?token=${encodeURIComponent(
          accessToken
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(extensionData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send proposal");
      }

      console.log("API Response:", data);
      return data;
    } catch (error) {
      console.error("Error sending proposal:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    // Validate message length
    if (inputValue.trim().length < 50) {
      setInputError("Message should have at least 50 characters");
      return;
    }

    if (!inputValue.trim() || !activeThreadId) return;

    // Clear any previous errors
    setInputError(null);
    setApiResponse(null);

    // Get the extension data
    const extensionData = extractExtensionData();

    if (!extensionData) {
      setInputError("Failed to extract required extension data");
      return;
    }

    // Console log the extension data
    console.log("Extension Data:", extensionData);

    try {
      // Send the request
      const response = await sendRequest(extensionData);
      setApiResponse(response);

      // Reset input
      setInputValue("");

      // Show success dialog
      setShowSuccessDialog(true);
    } catch (error: any) {
      setInputError(error.message || "Failed to send proposal");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if user has an access token
  const hasAccessToken = !!accessToken && !isSessionLoading;

  return (
    <>
      <div className={`w-full ${className}`}>
        <div className="relative w-full">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Clear error when user starts typing again
              if (inputError) setInputError(null);
            }}
            placeholder={
              hasAccessToken
                ? "Send on-chain message"
                : "Connect your wallet to send message"
            }
            className={`w-full h-20 pr-16 text-base ${
              inputError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onKeyDown={handleKeyDown}
            disabled={!hasAccessToken || isSubmitting || isLoadingExtensions}
          />
          <div className="absolute bottom-2 right-2">
            <Button
              variant="primary"
              size={size}
              onClick={handleSendMessage}
              disabled={
                !hasAccessToken ||
                !inputValue.trim() ||
                inputValue.trim().length < 50 ||
                !isConnected ||
                isSubmitting ||
                isLoadingExtensions
              }
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {inputError && (
          <p className="text-sm text-red-500 mt-1">{inputError}</p>
        )}
        {!inputError &&
          hasAccessToken &&
          inputValue.trim().length > 0 &&
          inputValue.trim().length < 50 && (
            <p className="text-sm text-red-500 mt-1">
              {`Message needs ${
                50 - inputValue.trim().length
              } more characters (minimum 50)`}
            </p>
          )}
        {isLoadingExtensions && (
          <p className="text-sm text-gray-500 mt-1">
            Loading DAO extensions...
          </p>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Success</DialogTitle>
            <DialogDescription className="text-base">
              Your proposal message has been sent successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-3 bg-gray-100 rounded-md max-h-60 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : "No response data"}
            </pre>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="default"
              onClick={() => setShowSuccessDialog(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
