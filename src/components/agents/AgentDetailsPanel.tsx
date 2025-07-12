"use client";
import { useEffect } from "react";
import { Settings, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { truncateAddress } from "@/utils/format";
import { useClipboard } from "@/hooks/useClipboard";
import { getWalletAddress } from "@/utils/wallet";
import { formatStxBalance, formatTokenBalance } from "@/utils/format";

interface AgentDetailsPanelProps {
  agent: Agent;
}

export function AgentDetailsPanel({ agent }: AgentDetailsPanelProps) {
  const router = useRouter();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useAuth();
  const { copiedText, copyToClipboard } = useClipboard();
  const { toast } = useToast();

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

  // Find the wallet for this agent
  const agentWallet = agentWallets.find(
    (wallet) => wallet.agent_id === agent.id
  );
  const walletAddress = getWalletAddress(agentWallet);
  const walletBalance = walletAddress ? balances[walletAddress] : null;

  return (
    <div className={cn("h-full flex-1", agent.is_archived && "opacity-75")}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          {agent.is_archived && (
            <div className="px-3 py-1 rounded-full bg-zinc-800/40 text-zinc-400 text-xs font-medium">
              Archived
            </div>
          )}
          <div className="flex-1 flex justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 hover:bg-white/5"
              onClick={() => router.push(`/agents/${agent.id}/edit`)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[300px_1fr] gap-6 sm:gap-12">
          <div className="flex-shrink-0">
            <div className="sm:sticky sm:top-8">
              <div
                className={cn(
                  "w-40 h-40 sm:w-full sm:h-auto sm:aspect-square mx-auto overflow-hidden rounded-2xl border border-zinc-800/40 bg-zinc-900/50 relative",
                  agent.is_archived && "grayscale"
                )}
                style={{
                  backgroundImage: `url(${
                    agent.image_url || "/placeholder-agent.png"
                  })`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">
                    {agent.name ? agent.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 text-center">
                <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-100">
                  {agent.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-zinc-400">
                  {agent.role}
                </p>
              </div>

              {/* Wallet Information */}
              {!agent.is_archived && agentWallet && (
                <div className="mt-6 p-4 rounded-xl bg-zinc-800/40 text-sm">
                  <h3 className="font-medium text-zinc-300 mb-3">Wallet</h3>
                  {walletAddress ? (
                    <>
                      <button
                        onClick={() => copyToClipboard(walletAddress)}
                        className="w-full flex items-center justify-between text-xs text-zinc-500 font-mono hover:text-zinc-300 transition-colors group mb-3"
                      >
                        <span>{truncateAddress(walletAddress)}</span>
                        <span className="text-zinc-600 group-hover:text-zinc-400">
                          {copiedText === walletAddress ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </button>

                      {walletBalance && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400">STX Balance</span>
                            <span className="text-zinc-200">
                              {formatStxBalance(walletBalance.stx.balance)} STX
                            </span>
                          </div>

                          {Object.entries(walletBalance.fungible_tokens).map(
                            ([tokenId, token]) => {
                              const [, tokenSymbol] = tokenId.split("::");
                              return (
                                <div
                                  key={tokenId}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-zinc-400">
                                    {tokenSymbol || "Token"}
                                  </span>
                                  <span className="text-zinc-200">
                                    {formatTokenBalance(token.balance)}
                                  </span>
                                </div>
                              );
                            }
                          )}

                          {Object.entries(
                            walletBalance.non_fungible_tokens
                          ).map(([tokenId, token]) => {
                            const [, tokenSymbol] = tokenId.split("::");
                            return (
                              <div
                                key={tokenId}
                                className="flex justify-between items-center"
                              >
                                <span className="text-zinc-400">
                                  {tokenSymbol || "NFT"}
                                </span>
                                <span className="text-zinc-200">
                                  {token.count} items
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-zinc-500 font-mono">
                      No wallet address
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="space-y-8 sm:space-y-12">
              <section>
                <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                  Goal
                </h2>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-zinc-300">
                  {agent.goal}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">
                  Backstory
                </h2>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-zinc-300 whitespace-pre-wrap">
                  {agent.backstory}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400 mb-2 sm:mb-3">
                  Tools & Capabilities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {agent.agent_tools?.map((tool) => (
                    <div
                      key={tool}
                      className="rounded-full bg-zinc-800/40 px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium text-zinc-300"
                    >
                      {tool}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
