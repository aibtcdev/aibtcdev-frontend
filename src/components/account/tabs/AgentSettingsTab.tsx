"use client";

import { useState, useMemo } from "react";
import { AgentConfigTable } from "../AgentConfigTable";
import { AgentConfigDrawer } from "../AgentConfigDrawer";
import { AgentPermissions } from "../AgentPermissions";
import { useQuery } from "@tanstack/react-query";
import { fetchDAOs } from "@/services/dao.service";
import { fetchDAOsWithExtension } from "@/services/dao.service";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";
import { fetchAgents } from "@/services/agent.service";
import { useWalletStore } from "@/store/wallet";

export function AgentSettingsTab() {
  const [selectedDaoId, setSelectedDaoId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: daos = [] } = useQuery({
    queryKey: ["daos"],
    queryFn: fetchDAOs,
  });

  const { data: daosWithExtensions = [] } = useQuery({
    queryKey: ["daosWithExtensions"],
    queryFn: fetchDAOsWithExtension,
  });

  const { balances } = useWalletStore();

  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;
  const agentAddress = userAgent?.account_contract || null;
  const agentAccountBalance = agentAddress ? balances[agentAddress] : null;

  // Filter DAOs to only show those where agent has token balance > 0
  const filteredDaos = useMemo(() => {
    if (!agentAccountBalance?.fungible_tokens || !agentAddress) {
      return [];
    }

    return daos.filter((dao) => {
      // Find the token extension for this DAO
      const daoWithExtension = daosWithExtensions.find((d) => d.id === dao.id);
      const tokenExtension = daoWithExtension?.extensions?.find(
        (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
      );

      if (!tokenExtension?.contract_principal) return false;

      // Check if agent has balance for this token
      const agentTokenEntry = Object.entries(
        agentAccountBalance.fungible_tokens
      ).find(([tokenId]) =>
        tokenId.startsWith(tokenExtension.contract_principal!)
      );
      const agentBalance = agentTokenEntry?.[1]?.balance || "0";

      return parseFloat(agentBalance) > 0;
    });
  }, [daos, daosWithExtensions, agentAccountBalance, agentAddress]);

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
          {agentAddress ? (
            <AgentPermissions agentAddress={agentAddress} />
          ) : !agentsLoading ? (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Your agent account is under deployment. Please come back in a
                few minutes.
              </p>
            </div>
          ) : null}
        </div>

        {/* Voting Instructions Section */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Voting Instructions</h3>
          <AgentConfigTable
            daos={filteredDaos}
            prompts={prompts}
            onConfigure={handleConfigureAgent}
          />

          {/* Configuration Drawer */}
          <AgentConfigDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            daoId={selectedDaoId}
            daos={filteredDaos}
            prompts={prompts}
          />
        </div>
      </div>
    </div>
  );
}
