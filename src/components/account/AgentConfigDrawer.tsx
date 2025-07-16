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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Zap, Brain, Save, X } from "lucide-react";
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
import TemperatureSlider from "../evaluation/TemperatureSlider";

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
  { value: "gpt-4.1", label: "GPT-4.1", description: "Most capable model" },
  { value: "gpt-4o", label: "GPT-4o", description: "Optimized for speed" },
  {
    value: "gpt-4o-mini",
    label: "GPT-4o Mini",
    description: "Fast and efficient",
  },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano", description: "Lightweight" },
  {
    value: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    description: "Balanced performance",
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
    model: "gpt-4.1",
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
          temperature: existingPrompt.temperature,
        });
      } else if (daoId) {
        setFormData({
          dao_id: daoId,
          prompt_text: "",
          model: "gpt-4.1",
          temperature: 0.1,
        });
      } else {
        setFormData({
          dao_id: "",
          prompt_text: "",
          model: "gpt-4.1",
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

    if (formData.temperature < 0 || formData.temperature > 1) {
      newErrors.temperature = "Temperature must be between 0 and 1";
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const selectedModel = AI_MODELS.find((m) => m.value === formData.model);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {existingPrompt ? "Edit" : "Configure"} AI Agent
              </SheetTitle>
              <SheetDescription>
                {selectedDao
                  ? `Configure agent for ${selectedDao.name}`
                  : "Set up automated governance behavior"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* DAO Selection */}
          {!daoId && (
            <div className="space-y-2">
              <Label htmlFor="dao">DAO Organization</Label>
              <Select
                value={formData.dao_id}
                onValueChange={(value) => handleInputChange("dao_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a DAO to configure" />
                </SelectTrigger>
                <SelectContent>
                  {daos.map((dao) => (
                    <SelectItem key={dao.id} value={dao.id}>
                      {dao.name}
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
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModel && (
              <div className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg">
                <Brain className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedModel.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedModel.description}
                  </p>
                </div>
              </div>
            )}
            {errors.model && (
              <p className="text-sm text-destructive">{errors.model}</p>
            )}
          </div>

          {/* Creativity Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Creativity Level
              </Label>
              <Badge variant="outline" className="font-mono">
                {formData.temperature}
              </Badge>
            </div>
            <div className="space-y-2">
              <TemperatureSlider
                value={formData.temperature}
                onChange={(value) => handleInputChange("temperature", value)}
                className="w-full"
                min={0}
                max={1}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Lower values make responses more focused and deterministic. Higher
              values increase creativity and variability.
            </p>
            {errors.temperature && (
              <p className="text-sm text-destructive">{errors.temperature}</p>
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
              onChange={(e) => handleInputChange("prompt_text", e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                Be specific about voting criteria and decision-making logic
              </span>
              <span>{formData.prompt_text.length}/2000</span>
            </div>
            {errors.prompt_text && (
              <p className="text-sm text-destructive">{errors.prompt_text}</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                {existingPrompt ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {existingPrompt
                  ? "Update Configuration"
                  : "Create Configuration"}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
