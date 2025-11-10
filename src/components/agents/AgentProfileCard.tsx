import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Agent } from "@/types";

interface AgentProfileCardProps {
  agent: Agent;
}

export function AgentProfileCard({ agent }: AgentProfileCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative aspect-square  mb-4">
          <Image
            src={agent.image_url || "/placeholder-agent.png"}
            alt={agent.name}
            fill
            className="object-cover rounded-sm"
          />
        </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{agent.name}</h1>
        </div>
      </CardContent>
    </Card>
  );
}
