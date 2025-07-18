"use client";

import { useState } from "react";
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

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col ">
        <div className=" flex-1">
          <h2 className="text-xl font-bold text-foreground">
            AI Agent Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure how your AI agent responds to DAO proposals
          </p>
        </div>

        {/* <div className="flex-shrink-0">
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">New Configuration</span>
            <span className="xs:hidden">New</span>
          </Button>
        </div> */}
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
