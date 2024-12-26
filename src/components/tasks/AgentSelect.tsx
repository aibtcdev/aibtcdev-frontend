"use client";

import React from "react";
import { Agent } from "@/hooks/new/useAgents";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentSelectProps {
  agents: Agent[];
  selectedAgent: string;
  onAgentChange: (value: string) => void;
  disabled?: boolean;
}

export function AgentSelect({
  agents,
  selectedAgent,
  onAgentChange,
  disabled = false,
}: AgentSelectProps) {
  return (
    <div className="mb-4">
      <Label>Select Agent</Label>
      <Select
        value={selectedAgent}
        onValueChange={onAgentChange}
        disabled={disabled || agents.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an agent" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id.toString()}>
              {agent.agent_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
