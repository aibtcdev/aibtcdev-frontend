"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/new/useAuth";
import { useTasks, Task, CreateTaskData } from "@/hooks/new/useTasks";
import { useAgents, Agent } from "@/hooks/new/useAgents";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TaskManagement() {
  const { id: crewIdString } = useParams();
  const crewId = parseInt(crewIdString as string, 10);

  const { isAuthenticated, userAddress } = useAuth();
  const {
    listTasks,
    createTask,
    deleteTask,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks();
  const { getAgents, loading: agentsLoading, error: agentsError } = useAgents();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [newTask, setNewTask] = useState<Partial<CreateTaskData>>({
    task_name: "",
    task_description: "",
    task_expected_output: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && userAddress && crewId) {
      fetchAgents();
    }
  }, [isAuthenticated, userAddress, crewId]);

  useEffect(() => {
    if (selectedAgent) {
      fetchTasks();
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      const fetchedAgents = await getAgents(crewId);
      setAgents(fetchedAgents);
      // Optionally set first agent as default
      if (fetchedAgents.length > 0) {
        setSelectedAgent(fetchedAgents[0].id.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    }
  };

  const fetchTasks = async () => {
    if (!selectedAgent) return;

    try {
      const fetchedTasks = await listTasks(parseInt(selectedAgent, 10));
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    if (!newTask.task_name?.trim()) {
      setError("Task name is required");
      return;
    }

    if (!selectedAgent) {
      setError("Please select an agent");
      return;
    }

    try {
      const taskData: CreateTaskData = {
        profile_id: userAddress!,
        crew_id: crewId,
        agent_id: parseInt(selectedAgent, 10),
        task_name: newTask.task_name!,
        task_description: newTask.task_description || "",
        task_expected_output: newTask.task_expected_output || "",
      };

      await createTask(taskData);

      // Reset form and fetch updated tasks
      setNewTask({
        task_name: "",
        task_description: "",
        task_expected_output: "",
      });
      setError(null);

      // Refetch tasks
      fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      fetchTasks(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-3xl">
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
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Task Management for Crew {crewId}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {tasksError && (
          <p className="text-red-500 mb-4">{tasksError.message}</p>
        )}
        {agentsError && (
          <p className="text-red-500 mb-4">{agentsError.message}</p>
        )}

        {/* Agent Selection */}
        <div className="mb-4">
          <Label>Select Agent</Label>
          <Select
            value={selectedAgent}
            onValueChange={setSelectedAgent}
            disabled={agents.length === 0}
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

        {/* Create Task Form */}
        <form onSubmit={handleCreateTask} className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold">
            Create New Task for{" "}
            {agents.find((a) => a.id.toString() === selectedAgent)
              ?.agent_name || "Selected Agent"}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="taskName">Task Name *</Label>
              <Input
                id="taskName"
                value={newTask.task_name || ""}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    task_name: e.target.value,
                  }))
                }
                placeholder="Enter task name"
                required
              />
            </div>
            <div>
              <Label htmlFor="taskDescription">Task Description</Label>
              <Textarea
                id="taskDescription"
                value={newTask.task_description || ""}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    task_description: e.target.value,
                  }))
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="taskExpectedOutput">Expected Output</Label>
              <Textarea
                id="taskExpectedOutput"
                value={newTask.task_expected_output || ""}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    task_expected_output: e.target.value,
                  }))
                }
                placeholder="Enter expected output"
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={!selectedAgent}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </form>

        {/* Tasks List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks found for this agent.</p>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="mb-2">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow pr-4">
                      <p>
                        <strong>Name:</strong> {task.task_name}
                      </p>
                      {task.task_description && (
                        <p>
                          <strong>Description:</strong> {task.task_description}
                        </p>
                      )}
                      {task.task_expected_output && (
                        <p>
                          <strong>Expected Output:</strong>{" "}
                          {task.task_expected_output}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {(tasksLoading || agentsLoading) && (
          <div className="flex justify-center items-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
