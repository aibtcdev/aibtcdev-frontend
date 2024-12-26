"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save } from "lucide-react";
import { Task, TaskFormData } from "@/hooks/new/useTasks";

interface TaskFormProps {
  initialData?: Partial<Task>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  isEditing?: boolean;
  agentName?: string;
}

export function TaskForm({
  initialData,
  onSubmit,
  isEditing = false,
  agentName,
}: TaskFormProps) {
  const [formData, setFormData] = React.useState<TaskFormData>({
    task_name: initialData?.task_name || "",
    task_description: initialData?.task_description || "",
    task_expected_output: initialData?.task_expected_output || "",
  });

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.task_name?.trim()) {
      setError("Task name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {agentName && (
        <p className="text-sm text-gray-500">
          Creating task for agent:{" "}
          <span className="font-medium">{agentName}</span>
        </p>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="taskName">Task Name *</Label>
          <Input
            id="taskName"
            value={formData.task_name}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.task_description}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.task_expected_output}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                task_expected_output: e.target.value,
              }))
            }
            placeholder="Enter expected output"
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          "Saving..."
        ) : isEditing ? (
          <>
            <Save className="mr-2 h-4 w-4" />
            Update Task
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </>
        )}
      </Button>
    </form>
  );
}
