import { Card, CardContent } from "@/components/ui/card";
import { Agent } from "@/lib/services";
import { DeleteAgentButton } from "./delete-agent-button";
import { getAgentsByCrew } from "@/lib/actions";

export async function AgentsList({ crewId }: { crewId: number }) {
  // This will be caught by the Suspense boundary while loading
  const { data: agents, error } = await getAgentsByCrew(crewId);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!agents?.length) {
    return <p className="text-gray-500">No agents found for this crew.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Existing Agents</h3>
      {agents.map((agent: Agent) => (
        <Card key={agent.id} className="mb-2">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p>
                  <strong>Name:</strong> {agent.agent_name}
                </p>
                <p>
                  <strong>Role:</strong> {agent.agent_role || "N/A"}
                </p>
                <p>
                  <strong>Goal:</strong> {agent.agent_goal || "N/A"}
                </p>
              </div>
              <DeleteAgentButton agentId={agent.id} crewId={crewId} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
