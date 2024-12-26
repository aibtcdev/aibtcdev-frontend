"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/new/useAuth";
import { useAgents, Agent, AgentFormData } from "@/hooks/new/useAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { AgentList } from "./AgentList";
import { AgentDialog } from "./AgentDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

export function AgentManagement() {
  const { id: crewIdString } = useParams();
  const crewId = useMemo(
    () => parseInt(crewIdString as string, 10),
    [crewIdString]
  );

  const { isAuthenticated, userAddress } = useAuth();
  const {
    getAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    loading,
    error: agentError,
  } = useAgents();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!isAuthenticated || !userAddress || !crewId) return;
    try {
      const fetchedAgents = await getAgents(crewId);
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    }
  }, [crewId, getAgents, isAuthenticated, userAddress]);

  useEffect(() => {
    if (isAuthenticated && userAddress && crewId) {
      fetchAgents();
    }
  }, [isAuthenticated, userAddress, crewId, fetchAgents]);

  const handleCreateAgent = async (formData: AgentFormData) => {
    try {
      const agentData = {
        ...formData,
        profile_id: userAddress!,
        crew_id: crewId,
      };

      await createAgent(agentData);
      fetchAgents();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
      throw err;
    }
  };

  const handleUpdateAgent = async (formData: AgentFormData) => {
    if (!editingAgent) return;

    try {
      await updateAgent(editingAgent.id, formData);
      fetchAgents();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update agent");
      throw err;
    }
  };

  const handleDeleteAgent = async () => {
    if (!deletingAgent) return;

    try {
      await deleteAgent(deletingAgent.id);
      fetchAgents();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent");
      throw err;
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent Management</CardTitle>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {agentError && (
          <p className="text-red-500 mb-4">{agentError.message}</p>
        )}

        <AgentList
          agents={agents}
          onEdit={setEditingAgent}
          onDelete={setDeletingAgent}
        />

        {loading && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <AgentDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={handleCreateAgent}
          title="Create New Agent"
        />

        <AgentDialog
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onSubmit={handleUpdateAgent}
          agent={editingAgent || undefined}
          title="Edit Agent"
        />

        <DeleteConfirmDialog
          isOpen={!!deletingAgent}
          onClose={() => setDeletingAgent(null)}
          onConfirm={handleDeleteAgent}
          title="Delete Agent"
          description={`Are you sure you want to delete ${deletingAgent?.agent_name}? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
}
