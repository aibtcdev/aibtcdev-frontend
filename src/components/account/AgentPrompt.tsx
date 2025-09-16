"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "@/components/reusables/Loader";
import { useToast } from "@/hooks/useToast";
import { fetchDAOs } from "@/services/dao.service";
import {
  fetchAgentPrompts,
  createAgentPrompt,
  updateAgentPrompt,
  deleteAgentPrompt,
} from "@/services/agent-prompt.service";
import { useWalletStore } from "@/store/wallet";
import { MobileConfigCard } from "./MobileConfig";
import { DesktopConfigTable } from "./DesktopConfig";
import { Settings } from "lucide-react";

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

interface EditingData {
  id: string;
  prompt_text: string;
  model: string;
  temperature: number;
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

  // Fetch all data
  const { data: prompts = [], isLoading: isLoadingPrompts } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  const { data: daos = [], isLoading: isLoadingDaos } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  const { isAuthenticated } = useAuth();

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", userId],
    queryFn: fetchAgents,
    enabled: isAuthenticated && !!userId,
  });

  const [daoManagerAgentId, setDaoManagerAgentId] = useState<string>("");

  useEffect(() => {
    if (agents.length > 0) {
      setDaoManagerAgentId(agents[0]?.id || "");
    }
  }, [agents]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<AgentPrompt, "id" | "created_at" | "updated_at">) =>
      createAgentPrompt(data),
    onSuccess: () => {
      toast({ title: "Success", description: "Prompt created successfully" });
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

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<AgentPrompt, "id" | "created_at" | "updated_at">>;
    }) => updateAgentPrompt(id, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Prompt updated successfully" });
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAgentPrompt(id),
    onSuccess: () => {
      toast({ title: "Success", description: "Prompt deleted successfully" });
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

  // State management
  const [editingDaoId, setEditingDaoId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({
    id: "",
    prompt_text: "",
    model: "",
    temperature: 0.1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Event handlers
  const handleStartEditing = (daoId: string) => {
    const existingPrompt = prompts.find((p) => p.dao_id === daoId);
    if (existingPrompt) {
      setEditingData({
        id: existingPrompt.id,
        prompt_text: existingPrompt.prompt_text,
        model: existingPrompt.model || "openai/gpt-5",
        temperature: existingPrompt.temperature || 0.1,
      });
    } else {
      setEditingData({
        id: "",
        prompt_text: "",
        model: "openai/gpt-5",
        temperature: 0.1,
      });
    }
    setEditingDaoId(daoId);
    setErrors({});
  };

  const handleCancelEditing = () => {
    setEditingDaoId(null);
    setErrors({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "temperature") {
      const numValue = Number.parseFloat(value);
      setEditingData({ ...editingData, temperature: numValue });
    } else {
      setEditingData({ ...editingData, [name]: value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (field: keyof EditingData, value: string) => {
    if (field === "temperature") {
      const numValue = Number.parseFloat(value);
      setEditingData({ ...editingData, temperature: numValue });
    } else {
      setEditingData({ ...editingData, [field]: value });
    }
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

    if (
      editingData.temperature < 0 ||
      editingData.temperature > 1 ||
      isNaN(editingData.temperature)
    ) {
      newErrors.temperature = "Temperature must be between 0 and 1";
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
      updateMutation.mutate({
        id: editingData.id,
        data: {
          prompt_text: editingData.prompt_text,
          model: editingData.model,
          temperature: editingData.temperature,
          is_active: true,
        },
      });
    } else {
      createMutation.mutate({
        dao_id: daoId,
        agent_id: daoManagerAgentId,
        profile_id: userId || "",
        prompt_text: editingData.prompt_text,
        model: editingData.model,
        temperature: editingData.temperature,
        is_active: true,
      });
    }
  };

  const handleDelete = (promptId: string) => {
    if (window.confirm("Are you sure you want to delete this configuration?")) {
      deleteMutation.mutate(promptId);
    }
  };

  const isLoading =
    isLoadingPrompts ||
    isLoadingDaos ||
    isLoadingAgents ||
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const getDaoName = (daoId: string) => {
    const dao = daos.find((d) => d.id === daoId);
    return dao ? dao.name : "";
  };

  const uniqueDaoIds = daos.map((dao) => dao.id);

  return (
    <div className="w-full space-y-6">
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

        {/* Mobile/Tablet Layout */}
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

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <DesktopConfigTable
            prompts={prompts}
            uniqueDaoIds={uniqueDaoIds}
            editingDaoId={editingDaoId}
            editingData={editingData}
            errors={errors}
            isLoading={isLoading}
            getDaoName={getDaoName}
            handleStartEditing={handleStartEditing}
            handleCancelEditing={handleCancelEditing}
            handleSavePrompt={handleSavePrompt}
            handleDelete={handleDelete}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            createMutation={createMutation}
            updateMutation={updateMutation}
            deleteMutation={deleteMutation}
          />
        </div>
      </div>
    </div>
  );
}
