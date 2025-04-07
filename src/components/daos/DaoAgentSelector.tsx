"use client";

import { useState } from "react";
import { Bot, Copy, Check, Send } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { useWalletStore, type WalletBalance } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AgentAvatar } from "../reusables/AgentAvatar";
import { AgentBalance } from "../reusables/AgentBalance";
import { TransferTokenModal } from "./TransferTokenModal";
import { SuccessModal } from "../reusables/SuccessModal";
import type { Wallet, DAO, Token } from "@/types/supabase";

// First, let's modify the imports to include our query keys
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";

interface AgentSelectorSheetProps {
  selectedAgentId: string | null;
  onSelect: (value: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredTokenSymbol?: string;
  daos: DAO[];
  tokens?: Token[];
}

/**
 * AgentSelectorSheet Component
 * Main component for selecting and managing agents
 */
export function AgentSelectorSheet({
  selectedAgentId,
  onSelect,
  open,
  onOpenChange,
  requiredTokenSymbol,
  daos,
  tokens,
}: AgentSelectorSheetProps) {
  // Hooks and state
  const { agents, loading: agentsLoading } = useAgents();
  const {
    balances,
    agentWallets,
    isLoading: walletsLoading,
    fetchWallets,
  } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  // const [error, setError] = useState<string | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [participatingAgentId, setParticipatingAgentId] = useState<
    string | null
  >(null);
  const [selectedTransferAgent, setSelectedTransferAgent] = useState<{
    id: string;
    name: string;
    tokenSymbol: string;
    dexPrincipal: string;
    contractPrincipal: string;
    walletAddress: string;
  } | null>(null);

  // Filter out archived agents
  const activeAgents = agents.filter((agent) => !agent.is_archived);

  // Fetch wallets on component mount
  // Replace the existing useEffect for wallet fetching with a React Query implementation
  // Use React Query to fetch wallets
  const { isLoading: isLoadingWallets } = useQuery({
    queryKey: queryKeys.agentWallets(userId || ""),
    queryFn: () => fetchWallets(userId || ""),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper functions
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const getDexPrincipal = (dao: DAO) => {
    const dexExtension = dao.extensions?.find((ext) => ext.type === "dex");
    return dexExtension?.contract_principal || "";
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getWalletAddress = (wallet: Wallet) => {
    return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
      ? wallet.mainnet_address
      : wallet.testnet_address;
  };

  const isAgentEligible = (
    balance: WalletBalance,
    requiredTokenSymbol?: string
  ) => {
    if (!requiredTokenSymbol) return true;
    return Object.entries(balance.fungible_tokens).some(([tokenId, token]) => {
      const [, tokenSymbol] = tokenId.split("::");
      return tokenSymbol === requiredTokenSymbol && Number(token.balance) > 0;
    });
  };

  // Create tasks for the selected agent
  const createTasks = async (
    agentId: string,
    tokenSymbol: string,
    daoMission: string
  ) => {
    const tasks = [
      {
        name: "Send Proposal",
        prompt: `Create and submit a structured proposal for the ${tokenSymbol} DAO. The proposal must include:
        - **Title**: A clear and concise title.
        - **Objective**: Describe the goal and what this proposal aims to achieve.
        - **Benefits**: Explain the advantages and how it aligns with the DAO's mission.
        - **Execution Plan**: Outline step-by-step how the proposal will be implemented.
        - **Resources Needed**: Detail any funding, tools, or expertise required.
        - **Call to Action**: Clearly state the next steps and request for approval.
        
        Submit the proposal automatically without waiting for confirmation.`,
        agent_id: agentId,
        is_scheduled: true,
        cron: "0 * * * *",
        profile_id: userId,
      },
      {
        name: "Vote on proposal",
        prompt: `Analyze the active proposals in the ${tokenSymbol} DAO and vote on the most beneficial one based on:
        - Alignment with the DAO's mission:\n
        ${daoMission}
        - Feasibility of execution.
        - Required resources and funding.

        Cast the vote automatically without requiring confirmation.`,
        agent_id: agentId,
        is_scheduled: true,
        cron: "0 * * * *",
        profile_id: userId,
      },
    ];

    try {
      const { error } = await supabase.from("tasks").insert(tasks);
      if (error) throw error;
      setParticipatingAgentId(agentId);
      setSuccessModalOpen(true);
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast({
        title: "Error",
        description: "Failed to participate",
        variant: "destructive",
      });
    }
  };

  // Event handlers
  const handleSelect = async (agentId: string | null) => {
    if (agentId && requiredTokenSymbol) {
      const dao = daos.find((d) => {
        const token = tokens?.find((t) => t.dao_id === d.id);
        return token?.symbol === requiredTokenSymbol;
      });

      if (dao) {
        await createTasks(
          agentId,
          requiredTokenSymbol,
          dao.mission || "mission"
        );
      }
    }

    onSelect(agentId);
    onOpenChange(false);
  };

  const handleTransferRequest = (
    agentId: string,
    name: string,
    tokenSymbol: string,
    walletAddress: string
  ) => {
    const token = tokens?.find((t) => t.symbol === tokenSymbol);
    const dao = daos.find((d) => d.id === token?.dao_id);

    if (dao && token) {
      const dexPrincipal = getDexPrincipal(dao);
      setSelectedTransferAgent({
        id: agentId,
        name,
        tokenSymbol,
        dexPrincipal,
        contractPrincipal: token.contract_principal,
        walletAddress,
      });
      setTransferModalOpen(true);
    }
  };

  const handleTransferSuccess = () => {
    toast({
      title: "Transfer Initiated",
      description: "The transfer has been initiated successfully",
    });
    setTransferModalOpen(false);
  };

  const handleTransferError = () => {
    toast({
      title: "Transfer Failed",
      description: "Failed to initiate transfer",
      variant: "destructive",
    });
  };

  if (agentsLoading || walletsLoading || isLoadingWallets) {
    return (
      <div className="flex h-11 w-auto items-center justify-center rounded-full bg-background/50 backdrop-blur-sm px-4">
        <Bot className="h-4 w-4 animate-pulse text-foreground/50 mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Select an Agent</SheetTitle>
            <SheetDescription>
              {requiredTokenSymbol
                ? `Choose an agent with ${requiredTokenSymbol} tokens`
                : "Choose an agent to participate"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {activeAgents.map((agent) => {
              const wallet = agentWallets.find((w) => w.agent_id === agent.id);
              const walletAddress = wallet ? getWalletAddress(wallet) : null;
              const balance = walletAddress ? balances[walletAddress] : null;
              const isEligible = balance
                ? isAgentEligible(balance, requiredTokenSymbol)
                : false;

              return (
                <div
                  key={agent.id}
                  className={`flex flex-col p-3 rounded-lg ${
                    isEligible
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  } ${selectedAgentId === agent.id ? "bg-accent/50" : ""}`}
                  onClick={() => isEligible && handleSelect(agent.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AgentAvatar agent={agent} className="h-8 w-8" />
                      <div>
                        <span className="font-medium">{agent.name}</span>
                        {walletAddress && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <code>{truncateAddress(walletAddress)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(walletAddress);
                              }}
                            >
                              {copiedAddress === walletAddress ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {requiredTokenSymbol && walletAddress && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransferRequest(
                            agent.id,
                            agent.name,
                            requiredTokenSymbol,
                            walletAddress
                          );
                        }}
                      >
                        <Send className="h-3 w-3" />
                        Transfer Tokens
                      </Button>
                    )}
                  </div>

                  {balance && (
                    <AgentBalance
                      balance={balance}
                      requiredTokenSymbol={requiredTokenSymbol}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
      <TransferTokenModal
        isOpen={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        agent={selectedTransferAgent}
        onSuccess={handleTransferSuccess}
        onError={handleTransferError}
      />
      {requiredTokenSymbol && participatingAgentId && (
        <SuccessModal
          isOpen={successModalOpen}
          onOpenChange={setSuccessModalOpen}
          agentId={participatingAgentId}
        />
      )}
    </>
  );
}
