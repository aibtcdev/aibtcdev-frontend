"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/new/useAuth";
import { useAgents, Agent, CreateAgentData } from "@/hooks/new/useAgents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function AgentManagement() {
  const { id: crewIdString } = useParams();
  const crewId = parseInt(crewIdString as string, 10);

  const { isAuthenticated, userAddress } = useAuth();
  const {
    getAgents,
    createAgent,
    // deleteAgent,
    loading,
    error: agentError,
  } = useAgents();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [newAgent, setNewAgent] = useState<Partial<CreateAgentData>>({
    agent_name: "",
    agent_role: "",
    agent_goal: "",
    agent_backstory: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const fetchedAgents = await getAgents(crewId);
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    }
  }, [crewId, getAgents]);

  useEffect(() => {
    if (isAuthenticated && userAddress && crewId) {
      fetchAgents();
    }
  }, [isAuthenticated, userAddress, crewId, fetchAgents]);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!newAgent.agent_name?.trim()) {
      setError("Agent name is required");
      return;
    }

    try {
      const agentData: CreateAgentData = {
        profile_id: userAddress!,
        crew_id: crewId,
        agent_name: newAgent.agent_name!,
        agent_role: newAgent.agent_role || "",
        agent_goal: newAgent.agent_goal || "",
        agent_backstory: newAgent.agent_backstory || "",
      };

      await createAgent(agentData);

      // Reset form and fetch updated agents
      setNewAgent({
        agent_name: "",
        agent_role: "",
        agent_goal: "",
        agent_backstory: "",
      });
      setError(null);

      // Refetch agents
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    }
  };

  // const handleDeleteAgent = async (agentId: number) => {
  //   try {
  //     await deleteAgent(agentId);
  //     fetchAgents(); // Refresh the list
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Failed to delete agent");
  //   }
  // };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please connect your wallet to manage agents.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Agent Management for Crew {crewId}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {agentError && (
          <p className="text-red-500 mb-4">{agentError.message}</p>
        )}

        {/* Create Agent Form */}
        <form onSubmit={handleCreateAgent} className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold">Create New Agent</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agentName">Agent Name *</Label>
              <Input
                id="agentName"
                value={newAgent.agent_name || ""}
                onChange={(e) =>
                  setNewAgent((prev) => ({
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
                value={newAgent.agent_role || ""}
                onChange={(e) =>
                  setNewAgent((prev) => ({
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
                value={newAgent.agent_goal || ""}
                onChange={(e) =>
                  setNewAgent((prev) => ({
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
                value={newAgent.agent_backstory || ""}
                onChange={(e) =>
                  setNewAgent((prev) => ({
                    ...prev,
                    agent_backstory: e.target.value,
                  }))
                }
                placeholder="Enter agent backstory"
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </form>

        {/* Agents List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Agents</h3>
          {agents.length === 0 ? (
            <p className="text-gray-500">No agents found for this crew.</p>
          ) : (
            agents.map((agent) => (
              <Card key={agent.id} className="mb-2">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p>
                        <strong>Name:</strong> {agent.agent_name}
                      </p>
                      <p>
                        <strong>Role:</strong> {agent.agent_role || "N/A"}
                      </p>
                      <p>
                        <strong>Goal:</strong> {agent.agent_goal || "N/A"}
                      </p>
                    </div>
                    {/* <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAgent(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button> */}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
