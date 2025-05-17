"use client";
// TODO: ADD VALIDATION IF AGENT HAS THE TOKEN ENABLE THE BUTTON TO SEND MESSAGE OR ELSE SHOW THEM BUY TOKEN BUTTON..
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
  const { activeThreadId, sendMessage, connect, isConnected } = useChatStore();
  const { accessToken, isLoading: isSessionLoading } = useSessionStore();

  // Fetch DAO extensions
  const { data: daoExtensions } = useQuery({
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

  const handleSendMessage = () => {
    // Validate message length
    if (inputValue.trim().length < 50) {
      setInputError("Message should have at least 50 characters");
      return;
    }

    if (!inputValue.trim() || !activeThreadId) return;

    // Clear any previous errors
    setInputError(null);

    // Find the relevant extensions
    const relevantExtensions =
      daoExtensions?.filter((ext) =>
        [
          "EXTENSIONS_ACTION_PROPOSALS",
          "ACTIONS_MESSAGING_SEND_MESSAGE",
          "TOKEN_DAO",
        ].includes(ext.type)
      ) || [];

    // Format the extensions list
    const extensionsList = relevantExtensions
      .map((ext) => `${ext.type}: ${ext.contract_principal}`)
      .join("\n");

    // Append the extension types to the message without showing to user
    const messageWithExtensions = `${inputValue}

    ${extensionsList}
`;

    // Check if WebSocket is connected before sending
    if (!isConnected) {
      setInputError("WebSocket not connected. Please try again.");
      return;
    }

    // Send the message with hidden extension types
    sendMessage(activeThreadId, messageWithExtensions);

    // Reset input
    setInputValue("");

    // Show success dialog
    setShowSuccessDialog(true);
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
      <div className={`flex w-full gap-2 flex-col ${className}`}>
        {!hasAccessToken ? (
          <p className="text-xs text-amber-500 mb-1">
            Connect your wallet to send proposal
          </p>
        ) : !isConnected ? (
          <p className="text-xs text-amber-500 mb-1">
            Connecting to messaging service...
          </p>
        ) : null}
        <div className="flex w-full gap-2">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Clear error when user starts typing again
              if (inputError) setInputError(null);
            }}
            placeholder="Send on-chain message"
            className={`flex-grow ${
              inputError ? "border-red-500 focus-visible:ring-red-500" : ""
            }`}
            onKeyDown={handleKeyDown}
            disabled={!hasAccessToken}
          />
          <Button
            variant="primary"
            size={size}
            onClick={handleSendMessage}
            disabled={
              !hasAccessToken ||
              !inputValue.trim() ||
              inputValue.trim().length < 50 ||
              !isConnected
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {inputError && (
          <p className="text-xs text-red-500 mt-1">{inputError}</p>
        )}
        {!inputError &&
          hasAccessToken &&
          inputValue.trim().length > 0 &&
          inputValue.trim().length < 50 && (
            <p className="text-xs text-red-500 mt-1">
              {`Message needs ${
                50 - inputValue.trim().length
              } more characters (minimum 50)`}
            </p>
          )}
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>
              Your proposal message will be on-chain in a few seconds...
            </DialogDescription>
          </DialogHeader>
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
