// QUICK WAY TO SEND A PROPOSAL.....
"use client";

import type React from "react";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Bot, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DAO, Token } from "@/types/supabase";
import { useChatStore } from "@/store/chat";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOExtensions } from "@/queries/dao-queries";

interface DAOChatButtonProps extends ButtonProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
}

export function DAOSendProposal({
  daoId,
  size = "default",
  className,
  ...props
}: DAOChatButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { activeThreadId, sendMessage } = useChatStore();

  // Fetch DAO extensions
  const { data: daoExtensions } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000, // 10 minutes
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || !activeThreadId) return;

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

    // Send the message with hidden extension types
    sendMessage(activeThreadId, messageWithExtensions);

    // Reset input and collapse the input field
    setInputValue("");
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isExpanded) {
    return (
      <div className="flex w-full gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your proposal..."
          className="flex-grow"
          autoFocus
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="primary"
          size={size}
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      className={`gap-2 ${className}`}
      onClick={() => setIsExpanded(true)}
      {...props}
    >
      <Bot className="h-4 w-4" />
      <span>Send Proposal</span>
    </Button>
  );
}
