"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { Task, TaskFormData } from "@/hooks/new/useTasks";

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task;
  title: string;
  agentName?: string;
}

export function TaskDialog({
  isOpen,
  onClose,
  onSubmit,
  task,
  title,
  agentName,
}: TaskDialogProps) {
  const handleSubmit = async (data: TaskFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <TaskForm
          initialData={task}
          onSubmit={handleSubmit}
          isEditing={!!task}
          agentName={agentName}
        />
      </DialogContent>
    </Dialog>
  );
}
