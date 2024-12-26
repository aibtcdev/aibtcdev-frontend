"use client";

import React from "react";
import { AgentFormData } from "@/hooks/new/useAgents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save } from "lucide-react";

interface AgentFormProps {
  initialData?: Partial<AgentFormData>;
  onSubmit: (data: AgentFormData) => Promise<void>;
  isEditing?: boolean;
}

export function AgentForm({
  initialData,
  onSubmit,
  isEditing = false,
}: AgentFormProps) {
  const [formData, setFormData] = React.useState<AgentFormData>({
    agent_name: initialData?.agent_name || "",
    agent_role: initialData?.agent_role || "",
    agent_goal: initialData?.agent_goal || "",
    agent_backstory: initialData?.agent_backstory || "",
    agent_tools: initialData?.agent_tools || [],
  });

  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agent_name?.trim()) {
      setError("Agent name is required");
      return;
    }

    try {
      await onSubmit(formData);
      if (!isEditing) {
        // Reset form only if creating new agent
        setFormData({
          agent_name: "",
          agent_role: "",
          agent_goal: "",
          agent_backstory: "",
          agent_tools: [],
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold">
        {isEditing ? "Edit Agent" : "Create New Agent"}
      </h3>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="agentName">Agent Name *</Label>
          <Input
            id="agentName"
            value={formData.agent_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agent_name: e.target.value,
              }))
            }
            placeholder="Enter agent name"
            required
          />
        </div>
        <div>
          <Label htmlFor="agentRole">Agent Role</Label>
          <Input
            id="agentRole"
            value={formData.agent_role}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agent_role: e.target.value,
              }))
            }
            placeholder="Enter agent role"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="agentGoal">Agent Goal</Label>
          <Input
            id="agentGoal"
            value={formData.agent_goal}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agent_goal: e.target.value,
              }))
            }
            placeholder="Enter agent goal"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="agentBackstory">Agent Backstory</Label>
          <Textarea
            id="agentBackstory"
            value={formData.agent_backstory}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agent_backstory: e.target.value,
              }))
            }
            placeholder="Enter agent backstory"
            rows={3}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="agentTools">Agent Tools (comma-separated)</Label>
          <Input
            id="agentTools"
            value={formData.agent_tools.join(", ")}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agent_tools: e.target.value
                  .split(",")
                  .map((tool) => tool.trim()),
              }))
            }
            placeholder="Enter agent tools (e.g., tool1, tool2, tool3)"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? (
          <>
            <Save className="mr-2 h-4 w-4" />
            Update Agent
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </>
        )}
      </Button>
    </form>
  );
}
