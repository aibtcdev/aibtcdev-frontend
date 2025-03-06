"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { TokenBuyInput } from "./dao-buy-input";
import AgentWalletSelector from "@/components/chat/agent-selector";
import { useChatStore } from "@/store/chat";
import { useSessionStore } from "@/store/session";
import { fetchDAOExtensions, fetchToken } from "@/queries/daoQueries";
import type { DAO, Token, Extension } from "@/types/supabase";
import { Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DAOChatModalProps {
  daoId: string;
  dao?: DAO;
  token?: Token;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Replace the entire DAOBuyModal component with this updated version
export function DAOBuyModal({
  daoId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  dao,
  token,
}: DAOChatModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const { toast } = useToast();

  const {
    isLoading: isChatLoading,
    isConnected,
    selectedAgentId,
    setSelectedAgent,
    connect,
  } = useChatStore();

  const { accessToken } = useSessionStore();

  const { data: daoExtensions, isLoading: isExtensionsLoading } = useQuery({
    queryKey: ["daoExtensions", daoId],
    queryFn: () => fetchDAOExtensions(daoId),
    staleTime: 600000,
    enabled: open,
  });

  const { data: tokenData, isLoading: isTokenLoading } = useQuery({
    queryKey: ["token", daoId],
    queryFn: () => fetchToken(daoId),
    staleTime: 600000,
    enabled: open && !token,
  });

  const memoizedConnect = useCallback(
    (token: string) => {
      if (!isConnected && token) {
        console.log("Attempting to connect...");
        connect(token);
      }
    },
    [connect, isConnected]
  );

  useEffect(() => {
    if (!accessToken || !open) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        memoizedConnect(accessToken);
      }
    };

    memoizedConnect(accessToken);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accessToken, memoizedConnect, isConnected, open]);

  const handleSendMessage = () => {
    // Implement your send message logic here
    // After successful send:
    toast({
      title: "Message sent successfully",
      description: "The agent will receive funds shortly.",
    });
  };

  const renderBuySection = () => {
    if (!accessToken) {
      return (
        <div className="flex items-center justify-center h-full">
          Please sign in to buy tokens
        </div>
      );
    }

    const tokenDexExtension = daoExtensions?.find(
      (ext: Extension) => ext.type === "TOKEN_DEX"
    );

    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 h-14 flex items-center justify-between px-4 shadow-md bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AgentWalletSelector
              selectedAgentId={selectedAgentId}
              onSelect={setSelectedAgent}
              disabled={isChatLoading || !isConnected}
            />
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="bg-muted p-3 rounded-md flex items-start mb-4">
            <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              The selected agent's address will receive the funds from this
              transaction.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 w-full min-w-0 pb-safe shadow-lg z-20">
          {tokenDexExtension ? (
            <TokenBuyInput
              tokenName={tokenData?.symbol || "DAO"}
              contractPrincipal={tokenDexExtension.contract_principal}
              disabled={isChatLoading || !isConnected}
              onSend={handleSendMessage}
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No TOKEN_DEX extension found
            </div>
          )}
        </div>
      </div>
    );
  };

  const tokenName = tokenData?.symbol || "DAO";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Buy {tokenName}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[400px] h-[400px] p-0 rounded-lg">
        <DialogTitle className="sr-only">Buy {tokenName} Tokens</DialogTitle>
        <DialogDescription className="sr-only">
          Purchase {tokenName} tokens through your selected agent
        </DialogDescription>
        <div className="h-full overflow-hidden">{renderBuySection()}</div>
      </DialogContent>
    </Dialog>
  );
}
