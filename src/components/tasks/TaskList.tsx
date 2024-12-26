"use client";

import React from "react";
import { Task } from "@/hooks/new/useTasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit2, Trash2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskList({ tasks, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="text-gray-500">No tasks found for this agent.</p>;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(task)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => onDelete(task)}
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
