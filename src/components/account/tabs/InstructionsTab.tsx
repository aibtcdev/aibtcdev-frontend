"use client";

import { useState } from "react";
import { AgentConfigTable } from "../AgentConfigTable";
import { AgentConfigDrawer } from "../AgentConfigDrawer";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOs } from "@/services/dao.service";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";

export function InstructionsTab() {
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
    <div className="flex flex-col items-center">
      <div className="w-full max-w-5xl">
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
    </div>
  );
}
