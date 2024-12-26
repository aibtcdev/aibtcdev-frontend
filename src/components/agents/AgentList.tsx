"use client";

import React from "react";
import { Agent } from "@/hooks/new/useAgents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";

interface AgentListProps {
  agents: Agent[];
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
}

export function AgentList({ agents, onEdit, onDelete }: AgentListProps) {
  if (agents.length === 0) {
    return <p className="text-gray-500">No agents found for this crew.</p>;
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="mb-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {agent.agent_name}
                </p>
                <p>
                  <strong>Role:</strong> {agent.agent_role || "N/A"}
                </p>
                <p>
                  <strong>Goal:</strong> {agent.agent_goal || "N/A"}
                </p>
                {agent.agent_backstory && (
                  <p>
                    <strong>Backstory:</strong> {agent.agent_backstory}
                  </p>
                )}
                {agent.agent_tools && agent.agent_tools.length > 0 && (
                  <p>
                    <strong>Tools:</strong> {agent.agent_tools.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(agent)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(agent)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
