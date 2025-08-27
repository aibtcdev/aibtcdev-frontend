"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bot, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAgentPrompt,
  updateAgentPrompt,
} from "@/services/agent-prompt.service";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import type { AgentPrompt } from "./AgentPrompt";

interface AgentConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  daoId: string | null;
  daos: Array<{ id: string; name: string }>;
  prompts: AgentPrompt[];
}

interface FormData {
  dao_id: string;
  prompt_text: string;
  model: string;
  temperature: number;
}

const AI_MODELS = [
  {
    value: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
    description: "Ultra lightweight, experimental",
  },
  {
    value: "openai/gpt-5-mini",
    label: "GPT-5 Mini",
    description: "Compact and fast",
  },
  {
    value: "openai/gpt-5",
    label: "GPT-5",
    description: "Latest generation, highly capable",
  },
  {
    value: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Google's advanced multimodal model",
  },
  {
    value: "x-ai/grok-4",
    label: "Grok",
    description: "xAI’s large-scale reasoning model",
  },
  {
    value: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet",
    description: "Anthropic’s balanced performance model",
  },
];

export function AgentConfigDrawer({
  isOpen,
  onClose,
  daoId,
  daos,
  prompts,
}: AgentConfigDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userId } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const daoManagerAgentId = agents[0]?.id || "";

  const [formData, setFormData] = useState<FormData>({
    dao_id: "",
    prompt_text: "",
    model: "openai/gpt-5",
    temperature: 0.1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find existing prompt for the selected DAO
  const existingPrompt = daoId ? prompts.find((p) => p.dao_id === daoId) : null;
  const selectedDao = daoId ? daos.find((d) => d.id === daoId) : null;

  // Initialize form data when drawer opens
  useEffect(() => {
    if (isOpen) {
      if (existingPrompt) {
        setFormData({
          dao_id: existingPrompt.dao_id,
          prompt_text: existingPrompt.prompt_text,
          model: existingPrompt.model,
          temperature: existingPrompt.temperature || 0.1,
        });
      } else if (daoId) {
        setFormData({
          dao_id: daoId,
          prompt_text: "",
          model: "GPT-5",
          temperature: 0.1,
        });
      } else {
        setFormData({
          dao_id: "",
          prompt_text: "",
          model: "GPT-5",
          temperature: 0.1,
        });
      }
      setErrors({});
    }
  }, [isOpen, existingPrompt, daoId]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<AgentPrompt, "id" | "created_at" | "updated_at">) =>
      createAgentPrompt(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Agent configuration created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create configuration: ${error.message}`,
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
      toast({
        title: "Success",
        description: "Agent configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update configuration: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dao_id) {
      newErrors.dao_id = "Please select a DAO";
    }

    if (!formData.prompt_text.trim()) {
      newErrors.prompt_text = "Instructions are required";
    } else if (formData.prompt_text.length < 10) {
      newErrors.prompt_text = "Instructions must be at least 10 characters";
    } else if (formData.prompt_text.length > 2000) {
      newErrors.prompt_text = "Instructions must be less than 2000 characters";
    }

    if (!formData.model) {
      newErrors.model = "Please select an AI model";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (existingPrompt) {
      updateMutation.mutate({
        id: existingPrompt.id,
        data: {
          prompt_text: formData.prompt_text,
          model: formData.model,
          temperature: formData.temperature,
          is_active: true,
        },
      });
    } else {
      createMutation.mutate({
        dao_id: formData.dao_id,
        agent_id: daoManagerAgentId,
        profile_id: userId || "",
        prompt_text: formData.prompt_text,
        model: formData.model,
        temperature: formData.temperature,
        is_active: true,
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedModel = AI_MODELS.find((m) => m.value === formData.model);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px] md:w-[600px] md:max-w-[600px] overflow-y-auto">
        <div className="h-full flex flex-col">
          <SheetHeader className="space-y-3 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg sm:text-xl truncate">
                  {existingPrompt ? "Edit" : "Configure"} AI Agent
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {selectedDao
                    ? `Configure agent for ${selectedDao.name}`
                    : "Set up automated governance behavior"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="space-y-6">
              {/* DAO Selection */}
              {!daoId && (
                <div className="space-y-2">
                  <Label htmlFor="dao">DAO Organization</Label>
                  <Select
                    value={formData.dao_id}
                    onValueChange={(value) =>
                      handleInputChange("dao_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a DAO to configure" />
                    </SelectTrigger>
                    <SelectContent>
                      {daos.map((dao) => (
                        <SelectItem key={dao.id} value={dao.id}>
                          <span className="truncate">{dao.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.dao_id && (
                    <p className="text-sm text-destructive">{errors.dao_id}</p>
                  )}
                </div>
              )}

              {/* AI Model Selection */}
              <div className="space-y-3">
                <Label>AI Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => handleInputChange("model", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">
                            {model.label}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {selectedModel.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {selectedModel.description}
                      </p>
                    </div>
                  </div>
                )}
                {errors.model && (
                  <p className="text-sm text-destructive">{errors.model}</p>
                )}
              </div>

              <Separator />

              {/* Instructions */}
              <div className="space-y-3">
                <Label htmlFor="instructions">Agent Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Provide detailed instructions for how the AI agent should analyze and respond to DAO proposals. Include decision-making criteria, voting preferences, and any specific guidelines..."
                  value={formData.prompt_text}
                  onChange={(e) =>
                    handleInputChange("prompt_text", e.target.value)
                  }
                  className="min-h-[120px] resize-none"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">
                    Be specific about voting criteria and decision-making logic
                  </span>
                  <span className="text-right sm:text-left">
                    {formData.prompt_text.length}/2000
                  </span>
                </div>
                {errors.prompt_text && (
                  <p className="text-sm text-destructive">
                    {errors.prompt_text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                  <span className="truncate">
                    {existingPrompt ? "Updating..." : "Creating..."}
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span className="truncate">
                    {existingPrompt
                      ? "Update Configuration"
                      : "Create Configuration"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
