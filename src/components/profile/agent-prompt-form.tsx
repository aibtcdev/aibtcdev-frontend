"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Loader2, Save, Edit, Trash2, Power } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { WalletInfoCard } from "./agent-wallet-info";

import { fetchDAOs } from "@/queries/dao-queries";
import { fetchAgents } from "@/queries/agentQueries";
import {
  fetchAgentPrompts,
  createAgentPrompt,
  updateAgentPrompt,
  deleteAgentPrompt,
} from "@/queries/agent-prompt-queries";
import { fetchWalletTokens } from "@/queries/wallet-token-queries";
import { useWalletStore } from "@/store/wallet";
import { useSessionStore } from "@/store/session";
import { queryKeys } from "@/lib/react-query";

export interface AgentPrompt {
  id: string;
  dao_id: string;
  agent_id: string;
  profile_id: string;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();
  const { agentWallets, balances, fetchWallets } = useWalletStore();
  const { userId } = useSessionStore();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    prompt_text: "",
  });

  // Selection state
  const [selectedDaoId, setSelectedDaoId] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch wallet information when userId is available
  // Use React Query to fetch wallets
  const { isLoading: isLoadingWallets } = useQuery({
    queryKey: queryKeys.agentWallets(userId || ""),
    queryFn: () => fetchWallets(userId || ""),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all prompts
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  // Fetch wallet tokens
  const { data: walletTokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["holders"],
    queryFn: fetchWalletTokens,
  });

  // Fetch DAOs
  const { data: daos = [], isLoading: isLoadingDaos } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  // Fetch the DAO Manager agent
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  // Store the DAO Manager agent ID
  const [daoManagerAgentId, setDaoManagerAgentId] = useState<string>("");

  // Set the DAO Manager agent ID once it's loaded
  useEffect(() => {
    if (agents.length > 0) {
      setDaoManagerAgentId(agents[0]?.id || "");
    }
  }, [agents]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<AgentPrompt, "id" | "created_at" | "updated_at">) =>
      createAgentPrompt(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
    }) => updateAgentPrompt(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgentPrompt(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Reset form and selection
  const resetForm = () => {
    setFormData({
      prompt_text: "",
    });
    setSelectedPromptId(null);
    setSelectedDaoId("");
    setErrors({});
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = "Prompt text is required";
    }

    if (!selectedDaoId) {
      newErrors.dao_id = "DAO is required";
    }

    if (!daoManagerAgentId) {
      newErrors.agent_id = "DAO Manager agent not found";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!userId) {
      toast({
        title: "Error",
        description: "User ID is required",
        variant: "destructive",
      });
      return;
    }

    const promptData = {
      ...formData,
      dao_id: selectedDaoId,
      agent_id: daoManagerAgentId,
      profile_id: userId,
      is_active: true,
    };

    if (selectedPromptId) {
      updateMutation.mutate({
        id: selectedPromptId,
        data: promptData,
      });
    } else {
      createMutation.mutate(promptData);
    }
  };

  // Handle prompt selection for editing
  const handleEditPrompt = (promptId: string, daoId: string) => {
    const selectedPrompt = prompts.find((p) => p.id === promptId);
    if (selectedPrompt) {
      setSelectedPromptId(promptId);
      setSelectedDaoId(daoId);
      setFormData({
        prompt_text: selectedPrompt.prompt_text,
      });
      setErrors({});
      setIsDialogOpen(true);
    }
  };

  // Handle enabling a prompt for a DAO
  const handleEnablePrompt = (daoId: string) => {
    setSelectedDaoId(daoId);
    setSelectedPromptId(null);
    setFormData({
      prompt_text: "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  // Handle deleting a prompt
  const handleDelete = () => {
    if (selectedPromptId) {
      if (confirm("Are you sure you want to delete this prompt?")) {
        deleteMutation.mutate(selectedPromptId);
        setIsDialogOpen(false);
      }
    }
  };

  const isLoading =
    isLoadingDaos ||
    isLoadingAgents ||
    isLoadingPrompts ||
    isLoadingTokens ||
    isLoadingWallets ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Get DAO name by ID
  const getDaoName = (daoId: string) => {
    const dao = daos.find((d) => d.id === daoId);
    // Only return the name if the DAO is found, otherwise return empty string
    // This will help filter out "Unknown DAO" entries
    return dao ? dao.name : "";
  };

  // Format token balance
  const formatTokenBalance = (balance: string | number) => {
    return (Number(balance) / 1_000_000).toFixed(2);
  };

  // Extract token name from full token identifier
  const extractTokenName = (fullTokenId: string): string => {
    if (!fullTokenId) return "";

    // Try to extract the token name after the :: delimiter
    if (fullTokenId.includes("::")) {
      return fullTokenId.split("::")[1];
    }

    // If no :: delimiter, try to extract the token name after the last dot
    if (fullTokenId.includes(".")) {
      const parts = fullTokenId.split(".");
      const lastPart = parts[parts.length - 1];

      // If the last part contains a hyphen, extract the part after the hyphen
      if (lastPart.includes("-")) {
        return lastPart.split("-")[0];
      }

      return lastPart;
    }

    return fullTokenId;
  };

  // Get wallet information for an agent
  const getAgentWalletInfo = (agentId: string) => {
    if (!agentId) return { walletAddress: null, walletBalance: null };

    const agentWallet = agentWallets.find(
      (wallet) => wallet.agent_id === agentId
    );

    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
    const walletAddress =
      network === "mainnet"
        ? agentWallet?.mainnet_address
        : agentWallet?.testnet_address;

    const walletBalance = walletAddress ? balances[walletAddress] : null;

    return { walletAddress, walletBalance };
  };

  // Get DAO Manager wallet info
  const {
    walletAddress: daoManagerWalletAddress,
    walletBalance: daoManagerWalletBalance,
  } = getAgentWalletInfo(daoManagerAgentId);

  // Get unique DAOs from wallet tokens, but only include those that match our filtered DAOs
  const uniqueDaoIds = Array.from(
    new Set(
      walletTokens
        .map((token) => token.dao_id)
        .filter(
          (daoId) => daoId && daos.some((d) => d.id === daoId)
        ) as string[]
    )
  );

  return (
    <Card className="border-none shadow-none bg-background/40 backdrop-blur">
      {daoManagerAgentId && (
        <div className="mb-6">
          <WalletInfoCard
            walletAddress={daoManagerWalletAddress}
            walletBalance={daoManagerWalletBalance}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-base sm:text-2xl font-medium">
          Agent Prompts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DAO</TableHead>
                <TableHead> Token Balances</TableHead>
                <TableHead>Prompt Status</TableHead>
                <TableHead>Prompt Text</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : uniqueDaoIds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No DAOs with tokens found.
                  </TableCell>
                </TableRow>
              ) : (
                uniqueDaoIds.map((daoId) => {
                  const daoTokens = walletTokens.filter(
                    (token) => token.dao_id === daoId
                  );
                  const prompt = prompts.find((p) => p.dao_id === daoId);
                  const daoName = getDaoName(daoId);

                  // Get tokens for this DAO from the wallet balance
                  let tokenBalances: { name: string; balance: string }[] = [];

                  if (
                    daoManagerWalletAddress &&
                    daoManagerWalletBalance?.fungible_tokens
                  ) {
                    // Extract tokens from fungible_tokens that match this DAO
                    tokenBalances = Object.entries(
                      daoManagerWalletBalance.fungible_tokens
                    )
                      .map(([tokenId, tokenData]) => {
                        const tokenName = extractTokenName(tokenId);
                        return {
                          name: tokenName,
                          balance: tokenData.balance,
                        };
                      })
                      .filter((token) => {
                        return token.name
                          .toUpperCase()
                          .includes(daoName.toUpperCase());
                      });
                  }

                  return (
                    <TableRow key={daoId}>
                      <TableCell className="font-medium">{daoName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {tokenBalances.length > 0
                            ? tokenBalances.map((token, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>
                                    {formatTokenBalance(token.balance)}
                                  </span>
                                </div>
                              ))
                            : daoTokens.map((token, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>
                                    {formatTokenBalance(token.amount || "0")}
                                  </span>
                                </div>
                              ))}
                          {daoTokens.length === 0 &&
                            tokenBalances.length === 0 && (
                              <span className="text-muted-foreground">
                                No tokens
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={prompt?.is_active ? "default" : "secondary"}
                          className={
                            prompt?.is_active
                              ? "bg-green-500/20 text-green-700 hover:bg-green-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted"
                          }
                        >
                          {prompt?.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm text-muted-foreground">
                          {prompt?.prompt_text || "No prompt configured"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {prompt ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPrompt(prompt.id, daoId)}
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPromptId(prompt.id);
                                if (
                                  confirm(
                                    "Are you sure you want to delete this prompt?"
                                  )
                                ) {
                                  deleteMutation.mutate(prompt.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEnablePrompt(daoId)}
                          >
                            <Power className="h-4 w-4" />
                            <span className="sr-only">Enable</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedPromptId ? "Edit Prompt" : "Enable Prompt"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">DAO</label>
                <div className="text-sm text-muted-foreground">
                  {getDaoName(selectedDaoId)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt Text</label>
                <Textarea
                  name="prompt_text"
                  value={formData.prompt_text}
                  onChange={handleInputChange}
                  placeholder="Enter the prompt text"
                  className="min-h-[150px]"
                />
                {errors.prompt_text && (
                  <p className="text-sm text-red-500">{errors.prompt_text}</p>
                )}
              </div>

              <DialogFooter>
                {selectedPromptId && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="mr-auto"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
