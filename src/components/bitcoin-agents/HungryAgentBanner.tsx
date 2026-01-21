"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { fetchBitcoinAgents } from "@/services/bitcoin-agents.service";
import type { BitcoinAgent } from "@/types";
import Link from "next/link";

interface HungryAgentBannerProps {
  ownerAddress?: string;
}

export function HungryAgentBanner({ ownerAddress }: HungryAgentBannerProps) {
  const [hungryAgents, setHungryAgents] = useState<BitcoinAgent[]>([]);
  const [criticalAgents, setCriticalAgents] = useState<BitcoinAgent[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!ownerAddress) return;

    loadAgents();
    // Check every 5 minutes
    const interval = setInterval(loadAgents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ownerAddress]);

  async function loadAgents() {
    try {
      const { agents } = await fetchBitcoinAgents({ owner: ownerAddress, status: "alive" });

      const hungry = agents.filter((a) => {
        const hunger = a.computed_hunger ?? a.hunger;
        return hunger <= 30 && hunger > 10;
      });

      const critical = agents.filter((a) => {
        const hunger = a.computed_hunger ?? a.hunger;
        return hunger <= 10;
      });

      setHungryAgents(hungry);
      setCriticalAgents(critical);
    } catch (error) {
      console.error("Failed to check agent status:", error);
    }
  }

  if (isDismissed || (hungryAgents.length === 0 && criticalAgents.length === 0)) {
    return null;
  }

  const hasCritical = criticalAgents.length > 0;
  const totalCount = hungryAgents.length + criticalAgents.length;

  return (
    <Alert
      variant={hasCritical ? "destructive" : "default"}
      className="relative mb-4"
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>

      <AlertTitle className="flex items-center gap-2">
        {hasCritical ? "🚨 Critical Alert!" : "⚠️ Hungry Agents"}
      </AlertTitle>

      <AlertDescription className="mt-2">
        {hasCritical ? (
          <>
            <span className="font-medium text-red-600">
              {criticalAgents.length} agent
              {criticalAgents.length > 1 ? "s" : ""} in critical condition!
            </span>{" "}
            Feed them immediately or they will die.
            {hungryAgents.length > 0 && (
              <span className="ml-1">
                ({hungryAgents.length} other{hungryAgents.length > 1 ? "s" : ""}{" "}
                also hungry)
              </span>
            )}
          </>
        ) : (
          <>
            {totalCount} of your agent{totalCount > 1 ? "s" : ""}{" "}
            {totalCount > 1 ? "are" : "is"} getting hungry. Feed them soon!
          </>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {criticalAgents.slice(0, 3).map((agent) => (
            <Link
              key={agent.agent_id}
              href={`/bitcoin-agents/${agent.agent_id}`}
            >
              <Button
                size="sm"
                variant={hasCritical ? "default" : "outline"}
                className="bg-red-600 hover:bg-red-700"
              >
                Feed {agent.name} ({agent.computed_hunger ?? agent.hunger}%)
              </Button>
            </Link>
          ))}
          {hungryAgents.slice(0, 3 - criticalAgents.length).map((agent) => (
            <Link
              key={agent.agent_id}
              href={`/bitcoin-agents/${agent.agent_id}`}
            >
              <Button size="sm" variant="outline">
                Feed {agent.name} ({agent.computed_hunger ?? agent.hunger}%)
              </Button>
            </Link>
          ))}
          {totalCount > 3 && (
            <Link href="/bitcoin-agents">
              <Button size="sm" variant="ghost">
                +{totalCount - 3} more
              </Button>
            </Link>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
