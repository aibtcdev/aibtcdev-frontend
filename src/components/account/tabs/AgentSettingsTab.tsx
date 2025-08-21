"use client";

import { useState } from "react";
import { AgentConfigTable } from "../AgentConfigTable";
import { AgentConfigDrawer } from "../AgentConfigDrawer";
import { AgentPermissions } from "../AgentPermissions";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOs } from "@/services/dao.service";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";
import { fetchAgents } from "@/services/agent.service";

export function AgentSettingsTab() {
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

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const agentAddress = userAgent?.account_contract || null;

  const handleConfigureAgent = (daoId: string) => {
    setSelectedDaoId(daoId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full">
        {/* Agent Permission Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Agent Permission</h3>
          <AgentPermissions agentAddress={agentAddress} />
        </div>

        {/* Voting Instructions Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Voting Instructions</h3>
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
    </div>
  );
}
