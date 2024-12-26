"use client";

import React from "react";
import { AgentManagement } from "@/components/agents/AgentManagement";
import { TaskManagement } from "@/components/tasks/TaskManagement";

export default function CrewManagement() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Crew Management</h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <AgentManagement />
        <TaskManagement />
      </div>
    </div>
  );
}
