"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Trash2, Check, X, Pencil, Settings } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { fetchDAOs } from "@/services/dao.service";
import { fetchAgents } from "@/services/agent.service";
import {
  fetchAgentPrompts,
  createAgentPrompt,
  updateAgentPrompt,
  deleteAgentPrompt,
} from "@/services/agent-prompt.service";
import { useWalletStore } from "@/store/wallet";
import { useAuth } from "@/hooks/useAuth";
import { AI_MODELS } from "@/lib/constant";

export interface AgentPrompt {
  id: string;
  dao_id: string;
  agent_id: string;
  profile_id: string;
  prompt_text: string;
  is_active: boolean;
  model: string;
  temperature: number;
  created_at: string;
  updated_at: string;
}

// Define types for editing data
interface EditingData {
  id: string;
  prompt_text: string;
  model: string;
}

// Define types for mutations
type CreateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  Omit<AgentPrompt, "id" | "created_at" | "updated_at">,
  unknown
>;

type UpdateMutationType = UseMutationResult<
  AgentPrompt,
  Error,
  {
    id: string;
    data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
  },
  unknown
>;

type DeleteMutationType = UseMutationResult<void, Error, string, unknown>;

// Mobile Card Component for individual DAO configurations
function MobileConfigCard({
  daoId,
  daoName,
  prompt,
  isEditing,
  editingData,
  errors,
  onStartEditing,
  onCancelEditing,
  onSavePrompt,
  onDelete,
  onInputChange,
  onSelectChange,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,
}: {
  daoId: string;
  daoName: string;
  prompt?: AgentPrompt;
  isEditing: boolean;
  editingData: EditingData;
  errors: Record<string, string>;
  onStartEditing: (daoId: string) => void;
  onCancelEditing: () => void;
  onSavePrompt: (daoId: string) => void;
  onDelete: (promptId: string) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (field: keyof EditingData, value: string) => void;
  isLoading: boolean;
  createMutation: CreateMutationType;
  updateMutation: UpdateMutationType;
  deleteMutation: DeleteMutationType;
}) {
  return (
    <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-lg border border-border/30 p-4 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
          <h4 className="font-bold text-foreground text-sm truncate">
            {daoName}
          </h4>
        </div>

        {/* Status Badge */}
        {prompt?.is_active ? (
          <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border-primary/40 px-2 py-1 font-semibold text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse" />
            Active
          </Badge>
        ) : (
          <Badge className="bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border-muted/40 px-2 py-1 font-semibold text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1" />
            Disabled
          </Badge>
        )}
      </div>

      {/* Configuration Content */}
      <div className="space-y-3">
        {/* AI Model */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            AI Model
          </label>
          {isEditing ? (
            <Select
              value={editingData.model}
              onValueChange={(value) => onSelectChange("model", value)}
            >
              <SelectTrigger className="h-9 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-lg text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-lg">
                {AI_MODELS.map(
                  (model: {
                    value: string;
                    label: string;
                    description: string;
                  }) => (
                    <SelectItem
                      key={model.value}
                      value={model.value}
                      className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {model.label}
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg border border-border/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-muted-foreground font-semibold text-sm">
                {prompt?.model || "openai/gpt-5"}
              </span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Instructions
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <Textarea
                name="prompt_text"
                value={editingData.prompt_text}
                onChange={onInputChange}
                placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                className="min-h-[80px] max-h-[120px] text-xs bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-lg resize-none"
              />
              {errors.prompt_text && (
                <p className="text-xs text-destructive font-medium">
                  {errors.prompt_text}
                </p>
              )}
            </div>
          ) : (
            <div className="p-2 bg-muted/20 rounded-lg border border-border/20 min-h-[60px]">
              {prompt?.prompt_text ? (
                <p className="text-xs text-muted-foreground">
                  {prompt.prompt_text}
                </p>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/70 italic text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  No configuration set
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-2 pt-2 border-t border-border/20">
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEditing}
              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSavePrompt(daoId)}
              disabled={isLoading}
              className="h-8 px-3 text-primary hover:text-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 rounded-lg"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <div className="flex items-center gap-1">
                  <Loader />
                  Saving...
                </div>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartEditing(daoId)}
              className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Configure
            </Button>
            {prompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(prompt.id)}
                disabled={deleteMutation.isPending}
                className="h-8 px-3 text-destructive hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/20 hover:to-destructive/20 rounded-lg"
              >
                {deleteMutation.isPending ? (
                  <div className="flex items-center gap-1">
                    <Loader />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AgentPromptForm() {
  const queryClient = useQueryClient();
  const { fetchWallets } = useWalletStore();
  const { userId } = useAuth();
  const { toast } = useToast();

  // Fetch wallet information when userId is available
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

  // Fetch all prompts
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  // Fetch DAOs
  const { data: daos = [], isLoading: isLoadingDaos } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  // Fetch the DAO Manager agent
  const { isAuthenticated } = useAuth();

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: isAuthenticated && !!userId,
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
      setEditingDaoId(null);
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
      setEditingDaoId(null);
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
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete prompt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Inline editing state
  const [editingDaoId, setEditingDaoId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    id: "",
    prompt_text: "",
    model: "openai/gpt-5",
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle start editing
  const handleStartEditing = (daoId: string) => {
    const existingPrompt = prompts.find((p) => p.dao_id === daoId);

    if (existingPrompt) {
      // Editing existing prompt
      setEditingData({
        id: existingPrompt.id,
        prompt_text: existingPrompt.prompt_text,
        model: existingPrompt.model || "openai/gpt-5",
      });
    } else {
      // Creating new prompt
      setEditingData({
        id: "",
        prompt_text: "",
        model: "openai/gpt-5",
      });
    }

    setEditingDaoId(daoId);
    setErrors({});
  };

  // Handle cancel editing
  const handleCancelEditing = () => {
    setEditingDaoId(null);
    setErrors({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setEditingData({ ...editingData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field: keyof EditingData, value: string) => {
    setEditingData({ ...editingData, [field]: value });

    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editingData.prompt_text.trim()) {
      newErrors.prompt_text = "Instructions are required";
    } else if (editingData.prompt_text.length < 10) {
      newErrors.prompt_text = "Instructions must be at least 10 characters";
    } else if (editingData.prompt_text.length > 2000) {
      newErrors.prompt_text = "Instructions must be less than 2000 characters";
    }

    if (!editingData.model) {
      newErrors.model = "Model selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePrompt = (daoId: string) => {
    if (!validateForm()) return;

    if (editingData.id) {
      // Update existing prompt
      updateMutation.mutate({
        id: editingData.id,
        data: {
          prompt_text: editingData.prompt_text,
          model: editingData.model,
          temperature: 0.1,
          is_active: true,
        },
      });
    } else {
      // Create new prompt
      createMutation.mutate({
        dao_id: daoId,
        agent_id: daoManagerAgentId,
        profile_id: userId || "",
        prompt_text: editingData.prompt_text,
        model: editingData.model,
        temperature: 0.1,
        is_active: true,
      });
    }
  };

  const handleDelete = (promptId: string) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(promptId);
    }
  };

  // Check if any mutation is loading
  const isLoading =
    isLoadingPrompts ||
    isLoadingDaos ||
    isLoadingAgents ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Get DAO name by ID
  const getDaoName = (daoId: string) => {
    const dao = daos.find((d) => d.id === daoId);
    return dao ? dao.name : "";
  };

  // Get all DAOs
  const uniqueDaoIds = daos.map((dao) => dao.id);

  return (
    <div className="w-full space-y-6">
      {/* Agent Prompts Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">
            AI Agent Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure how your AI agent responds to DAO proposals across
            different organizations.
            <span className="text-primary font-medium">
              {" "}
              Fine-tune behavior and decision-making parameters.
            </span>
          </p>
        </div>

        {/* Mobile/Tablet Layout - Cards */}
        <div className="lg:hidden space-y-3">
          {isLoading && uniqueDaoIds.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="relative mx-auto w-fit">
                <Loader />
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">
                  Loading configurations...
                </p>
                <p className="text-sm text-muted-foreground">
                  Initializing AI agent settings
                </p>
              </div>
            </div>
          ) : uniqueDaoIds.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <div className="space-y-2 max-w-sm mx-auto">
                <h4 className="text-base font-semibold text-foreground">
                  No DAOs Available
                </h4>
                <p className="text-sm text-muted-foreground px-4">
                  Available DAOs will appear here for AI agent configuration.
                  Connect to organizations to begin automated governance.
                </p>
              </div>
            </div>
          ) : (
            uniqueDaoIds.map((daoId) => {
              const prompt = prompts.find((p) => p.dao_id === daoId);
              const daoName = getDaoName(daoId);
              const isEditing = editingDaoId === daoId;

              return (
                <MobileConfigCard
                  key={daoId}
                  daoId={daoId}
                  daoName={daoName}
                  prompt={prompt}
                  isEditing={isEditing}
                  editingData={editingData}
                  errors={errors}
                  onStartEditing={handleStartEditing}
                  onCancelEditing={handleCancelEditing}
                  onSavePrompt={handleSavePrompt}
                  onDelete={handleDelete}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  isLoading={isLoading}
                  createMutation={createMutation}
                  updateMutation={updateMutation}
                  deleteMutation={deleteMutation}
                />
              );
            })
          )}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden lg:block bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-lg border border-border/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/20 backdrop-blur-sm">
                  <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[150px]">
                    DAO
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-4 py-3 text-sm w-[120px]">
                    AI Model
                  </TableHead>
                  <TableHead className="text-foreground font-bold px-4 py-3 text-sm min-w-[250px]">
                    Instructions
                  </TableHead>
                  <TableHead className="text-right text-foreground font-bold px-4 py-3 text-sm w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <Loader />
                        </div>
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-foreground">
                            Loading configurations...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Initializing AI agent settings
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : uniqueDaoIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                          <Settings className="h-6 w-6 text-muted-foreground/60" />
                        </div>
                        <div className="space-y-2 max-w-md">
                          <h4 className="text-base font-semibold text-foreground">
                            No DAOs Available
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Available DAOs will appear here for AI agent
                            configuration. Connect to organizations to begin
                            automated governance.
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueDaoIds.map((daoId) => {
                    const prompt = prompts.find((p) => p.dao_id === daoId);
                    const daoName = getDaoName(daoId);
                    const isEditing = editingDaoId === daoId;

                    return (
                      <TableRow
                        key={daoId}
                        className="border-border/20 hover:bg-gradient-to-r hover:from-muted/20 hover:via-muted/10 hover:to-transparent transition-all duration-300"
                      >
                        <TableCell className="font-bold text-foreground px-4 py-3 text-sm w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                            <span className="truncate">{daoName}</span>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 w-[100px]">
                          {prompt?.is_active ? (
                            <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border-primary/40 px-2 py-1 font-semibold text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1 animate-pulse" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground border-muted/40 px-2 py-1 font-semibold text-xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </TableCell>

                        {/* Model Selection */}
                        <TableCell className="px-4 py-3 w-[120px]">
                          {isEditing ? (
                            <Select
                              value={editingData.model}
                              onValueChange={(value) =>
                                handleSelectChange("model", value)
                              }
                            >
                              <SelectTrigger className="h-8 w-full bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground rounded-lg text-sm">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-lg">
                                {AI_MODELS.map(
                                  (model: {
                                    value: string;
                                    label: string;
                                    description: string;
                                  }) => (
                                    <SelectItem
                                      key={model.value}
                                      value={model.value}
                                      className="text-foreground hover:bg-primary/10 rounded-md text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {model.label}
                                      </div>
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              <span className="text-muted-foreground font-semibold text-xs truncate">
                                {prompt?.model || "openai/gpt-5"}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Instructions */}
                        <TableCell className="px-4 py-3 min-w-[250px]">
                          {isEditing ? (
                            <div className="space-y-1">
                              <Textarea
                                name="prompt_text"
                                value={editingData.prompt_text}
                                onChange={handleInputChange}
                                placeholder="Enter detailed AI agent instructions and decision-making criteria..."
                                className="min-h-[60px] max-h-[100px] text-xs bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border/40 text-foreground placeholder:text-muted-foreground/70 rounded-lg resize-none"
                              />
                              {errors.prompt_text && (
                                <p className="text-xs text-destructive font-medium">
                                  {errors.prompt_text}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              {prompt?.prompt_text ? (
                                <div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {prompt.prompt_text}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground/70 italic text-xs">
                                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                  No configuration set
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right px-4 py-3 w-[100px]">
                          {isEditing ? (
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditing}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
                                title="Cancel editing"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSavePrompt(daoId)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 rounded-lg"
                                title="Save configuration"
                              >
                                {createMutation.isPending ||
                                updateMutation.isPending ? (
                                  <Loader />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartEditing(daoId)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 rounded-lg"
                                title="Configure agent"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {prompt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(prompt.id)}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-gradient-to-r hover:from-destructive/20 hover:to-destructive/20 rounded-lg"
                                  title="Delete configuration"
                                >
                                  {deleteMutation.isPending ? (
                                    <Loader />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
