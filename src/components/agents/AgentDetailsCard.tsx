import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types";

interface Wallet {
  mainnet_address: string;
  testnet_address: string;
}

interface AgentWithWallet extends Agent {
  wallet?: Wallet;
}

interface AgentDetailsCardProps {
  agent: AgentWithWallet;
}

export function AgentDetailsCard({ agent }: AgentDetailsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Role</h2>
            <p>{agent.role}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Goal</h2>
            <p>{agent.goal}</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Backstory</h2>
            <p>{agent.backstory}</p>
          </div>

          {agent.wallet && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Wallet Addresses</h2>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Mainnet:</p>
                  <p className="font-mono text-sm break-all">
                    {agent.wallet.mainnet_address}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Testnet:</p>
                  <p className="font-mono text-sm break-all">
                    {agent.wallet.testnet_address}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Tools</h2>
            <div className="flex flex-wrap gap-2">
              {agent.agent_tools?.map((tool) => (
                <Badge key={tool} variant="secondary">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
