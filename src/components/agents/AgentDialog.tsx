"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgentForm } from "./AgentForm";
import { Agent, AgentFormData } from "@/hooks/new/useAgents";

interface AgentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => Promise<void>;
  agent?: Agent;
  title: string;
}

export function AgentDialog({
  isOpen,
  onClose,
  onSubmit,
  agent,
  title,
}: AgentDialogProps) {
  const handleSubmit = async (data: AgentFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <AgentForm
          initialData={agent}
          onSubmit={handleSubmit}
          isEditing={!!agent}
        />
      </DialogContent>
    </Dialog>
  );
}
