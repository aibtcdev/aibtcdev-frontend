"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/new/useAuth";
import { useTasks, Task, TaskFormData } from "@/hooks/new/useTasks";
import { useAgents, Agent } from "@/hooks/new/useAgents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { AgentSelect } from "./AgentSelect";
import { TaskList } from "./TaskList";
import { TaskDialog } from "./TaskDialog";
import { DeleteConfirmDialog } from "../agents/DeleteConfirmDialog";

export function TaskManagement() {
  const { id: crewIdString } = useParams();
  const crewId = parseInt(crewIdString as string, 10);

  const { isAuthenticated, userAddress } = useAuth();
  const {
    listTasks,
    createTask,
    updateTask,
    deleteTask,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks();
  const { getAgents, loading: agentsLoading, error: agentsError } = useAgents();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!isAuthenticated || !userAddress || !crewId) return;
    try {
      const fetchedAgents = await getAgents(crewId);
      setAgents(fetchedAgents);
      if (fetchedAgents.length > 0 && !selectedAgent) {
        setSelectedAgent(fetchedAgents[0].id.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    }
  }, [crewId, getAgents, isAuthenticated, userAddress, selectedAgent]);

  const fetchTasks = useCallback(async () => {
    if (!selectedAgent) return;
    try {
      const fetchedTasks = await listTasks(parseInt(selectedAgent, 10));
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }
  }, [selectedAgent, listTasks]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (selectedAgent) {
      fetchTasks();
    }
  }, [selectedAgent, fetchTasks]);

  const handleCreateTask = async (formData: TaskFormData) => {
    if (!selectedAgent) {
      setError("Please select an agent");
      return;
    }

    try {
      const taskData = {
        ...formData,
        profile_id: userAddress!,
        crew_id: crewId,
        agent_id: parseInt(selectedAgent, 10),
      };

      await createTask(taskData);
      fetchTasks();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    }
  };

  const handleUpdateTask = async (formData: TaskFormData) => {
    if (!editingTask) return;

    try {
      await updateTask(editingTask.id, formData);
      fetchTasks();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await deleteTask(deletingTask.id);
      fetchTasks();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    }
  };

  const selectedAgentName = agents.find(
    (a) => a.id.toString() === selectedAgent
  )?.agent_name;

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Task Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Please connect your wallet to manage tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Management</CardTitle>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!selectedAgent}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {tasksError && (
          <p className="text-red-500 mb-4">{tasksError.message}</p>
        )}
        {agentsError && (
          <p className="text-red-500 mb-4">{agentsError.message}</p>
        )}

        <AgentSelect
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          disabled={agentsLoading}
        />

        <TaskList
          tasks={tasks}
          onEdit={setEditingTask}
          onDelete={setDeletingTask}
        />

        {(tasksLoading || agentsLoading) && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <TaskDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={handleCreateTask}
          title="Create New Task"
          agentName={selectedAgentName}
        />

        <TaskDialog
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSubmit={handleUpdateTask}
          task={editingTask || undefined}
          title="Edit Task"
          agentName={selectedAgentName}
        />

        <DeleteConfirmDialog
          isOpen={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          description={`Are you sure you want to delete ${deletingTask?.task_name}? This action cannot be undone.`}
        />
      </CardContent>
    </Card>
  );
}
