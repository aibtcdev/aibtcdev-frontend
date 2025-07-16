"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AgentConfigTable } from "../AgentConfigTable";
import { AgentConfigDrawer } from "../AgentConfigDrawer";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOs } from "@/services/dao.service";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";

export function AgentTab() {
  const [selectedDaoId, setSelectedDaoId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: daos = [] } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  const handleConfigureAgent = (daoId: string) => {
    setSelectedDaoId(daoId);
    setIsDrawerOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedDaoId(null);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            AI Agent Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure how your AI agent responds to DAO proposals
          </p>
        </div>

        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Configuration
        </Button>
      </div>

      {/* Configuration Table */}
      <AgentConfigTable
        daos={daos}
        prompts={prompts}
        onConfigure={handleConfigureAgent}
      />

      {/* Configuration Drawer */}
      <AgentConfigDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        daoId={selectedDaoId}
        daos={daos}
        prompts={prompts}
      />
    </div>
  );
}
