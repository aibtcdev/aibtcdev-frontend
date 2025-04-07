"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Archive, Copy, Check } from "lucide-react";
import { Heading } from "@/components/ui/heading";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/queries/agent-queries";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@/types/supabase";

export default function AgentsPage() {
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 1000000,
  });

  const [showArchived, setShowArchived] = useState(false);
  const { userId, accessToken } = useSessionStore();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
        toast({
          title: "Error",
          description: "Failed to fetch wallet information",
          variant: "destructive",
        });
      });
    }
  }, [userId, fetchWallets, toast]);

  if (!accessToken) {
    return (
      <div className="text-zinc-500 text-center">
        Please sign in to use agents
      </div>
    );
  }

  if (isLoadingAgents) {
    return <div>Loading agents...</div>;
  }

  const activeAgents = agents?.filter((agent) => !agent.is_archived) ?? [];
  const archivedAgents = agents?.filter((agent) => agent.is_archived) ?? [];

  const getWalletAddress = (agentId: string) => {
    const wallet = agentWallets.find((w) => w.agent_id === agentId);
    if (!wallet) return null;
    return process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet"
      ? wallet.mainnet_address
      : wallet.testnet_address;
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const formatBalance = (balance: string) => {
    return (Number(balance) / 1_000_000).toFixed(6);
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const AgentCard = ({
    agent,
    isArchived = false,
  }: {
    agent: Agent;
    isArchived: boolean;
  }) => {
    const walletAddress = getWalletAddress(agent.id);
    const balance = walletAddress
      ? balances[walletAddress]?.stx?.balance
      : null;

    return (
      <Link
        href={`/agents/${agent.id}`}
        key={agent.id}
        className={cn(
          "group flex flex-col p-4 bg-card hover:bg-muted transition-colors duration-200 rounded-lg",
          isArchived && "opacity-75 hover:opacity-100"
        )}
      >
        <div className="flex items-center">
          <div
            className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden"
            style={{
              backgroundImage: `url(${
                agent.image_url || "/placeholder-agent.png"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {agent.name ? agent.name.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
          </div>
          <div className="ml-4 flex-grow">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-base">{agent.name}</h3>
              {isArchived && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/40 text-zinc-400">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {agent.goal || agent.role}
            </p>
          </div>
        </div>

        {walletAddress && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <code className="text-xs text-muted-foreground">
                  {truncateAddress(walletAddress)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
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
              {balance && (
                <span className="text-sm text-muted-foreground">
                  {formatBalance(balance)} STX
                </span>
              )}
            </div>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 pb-8">
        <div>
          <Heading>Agents</Heading>
          <p className="text-muted-foreground mt-1">
            Discover and deploy AI agents for your needs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn("gap-2", showArchived && "bg-zinc-800/50")}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Link href="/agents/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Agents */}
      {activeAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} isArchived={false} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-4">
            No agents configured yet
          </h3>
        </div>
      )}

      {/* Archived Agents */}
      {showArchived && archivedAgents.length > 0 && (
        <div className="mt-12">
          <div className="border-b border-border pb-4 mb-6">
            <h2 className="text-lg font-medium text-muted-foreground">
              Archived Agents
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isArchived />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
