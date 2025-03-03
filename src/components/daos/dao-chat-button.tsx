"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { DAOChatModal } from "./dao-chat-modal";
import type { DAO, Token } from "@/types/supabase";

interface DAOChatButtonProps extends ButtonProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  size?: "sm" | "default";
}

export function DAOChatButton({
  daoId,
  dao,
  token,
  size = "default",
  className,
  ...props
}: DAOChatButtonProps) {
  return (
    <DAOChatModal
      daoId={daoId}
      dao={dao}
      token={token}
      trigger={
        <Button
          variant="outline"
          size={size}
          className={`gap-2 ${className}`}
          data-modal-trigger="dao-chat"
          {...props}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Participate</span>
        </Button>
      }
    />
  );
}
