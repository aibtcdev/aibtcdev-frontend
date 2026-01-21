"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LevelBadge,
  HungerHealthBars,
  XPProgress,
  FeedButton,
} from "@/components/bitcoin-agents";
import {
  fetchBitcoinAgentById,
  fetchFoodTiers,
  fetchAgentCapabilities,
  visitAgent,
} from "@/services/bitcoin-agents.service";
import type { BitcoinAgent, FoodTier, AgentCapabilities } from "@/types";
import Link from "next/link";

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

export default function BitcoinAgentDetailPage() {
  const params = useParams();
  const agentId = parseInt(params.id as string, 10);

  const [agent, setAgent] = useState<BitcoinAgent | null>(null);
  const [foodTiers, setFoodTiers] = useState<Record<number, FoodTier>>({});
  const [capabilities, setCapabilities] = useState<AgentCapabilities | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNaN(agentId)) {
      loadData();
    }
  }, [agentId]);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [agentData, tiersData, capabilitiesData] = await Promise.all([
        fetchBitcoinAgentById(agentId),
        fetchFoodTiers(),
        fetchAgentCapabilities(agentId).catch(() => null),
      ]);

      if (!agentData) {
        setError("Agent not found");
        return;
      }

      setAgent(agentData);
      setFoodTiers(tiersData.food_tiers);
      setCapabilities(capabilitiesData);
    } catch (err) {
      setError("Failed to load agent details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-start gap-6 mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error || "Agent Not Found"}
        </h1>
        <Link href="/bitcoin-agents">
          <Button>Back to Agents</Button>
        </Link>
      </div>
    );
  }

  const faceUrl =
    agent.face_image_url ||
    `${BITCOIN_FACES_API}/get-image?name=${agent.owner}`;
  const hunger = agent.computed_hunger ?? agent.hunger;
  const health = agent.computed_health ?? agent.health;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/bitcoin-agents"
        className="text-muted-foreground hover:text-foreground mb-4 inline-block"
      >
        ← Back to Agents
      </Link>

      {/* Agent Header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-border">
            <AvatarImage src={faceUrl} alt={agent.name} />
            <AvatarFallback className="text-4xl">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!agent.alive && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <span className="text-4xl">💀</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <LevelBadge level={agent.level} xp={agent.xp} showXp />
          </div>

          <p className="text-muted-foreground mb-4">
            Agent #{agent.agent_id} • Born at block {agent.birth_block}
          </p>

          <div className="flex flex-wrap gap-2">
            {!agent.alive && (
              <Badge variant="destructive" className="text-sm">
                💀 Deceased
              </Badge>
            )}
            <Badge variant="secondary">
              Fed {agent.total_fed_count} times
            </Badge>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
      {agent.alive && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HungerHealthBars hunger={hunger} health={health} size="lg" />

              {hunger <= 30 && (
                <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 p-3 rounded-lg text-sm">
                  ⚠️ {hunger <= 10 ? "Critical!" : "Warning:"} This agent is
                  hungry and needs food soon!
                </div>
              )}
            </CardContent>
          </Card>

          {/* XP Card */}
          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-4xl font-bold">{agent.xp.toLocaleString()}</p>
                <p className="text-muted-foreground">Total XP</p>
              </div>
              <XPProgress xp={agent.xp} level={agent.level} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feed Button */}
      {agent.alive && Object.keys(foodTiers).length > 0 && (
        <div className="mb-8">
          <FeedButton
            agentId={agent.agent_id}
            agentName={agent.name}
            foodTiers={foodTiers}
          />
        </div>
      )}

      {/* Tabs for Details */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-mono text-sm break-all">{agent.owner}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent ID</p>
                  <p className="font-mono">#{agent.agent_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Birth Block</p>
                  <p className="font-mono">{agent.birth_block}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Fed</p>
                  <p className="font-mono">Block {agent.last_fed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedings</p>
                  <p className="font-mono">{agent.total_fed_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{agent.alive ? "🟢 Alive" : "💀 Dead"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities">
          <Card>
            <CardHeader>
              <CardTitle>Available Tools ({capabilities?.total_tools ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {capabilities ? (
                <div className="space-y-4">
                  {Object.entries(capabilities.tools_by_category).map(
                    ([category, tools]) =>
                      tools.length > 0 && (
                        <div key={category}>
                          <h4 className="font-medium capitalize mb-2">
                            {category.replace(/_/g, " ")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {tools.map((tool) => (
                              <Badge key={tool} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Capabilities not available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Activity log coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Death Certificate for Dead Agents */}
      {!agent.alive && (
        <Card className="mt-8 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600">💀 Death Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-2xl font-bold mb-2">{agent.name}</p>
              <p className="text-muted-foreground">
                Lived {agent.last_fed - agent.birth_block} blocks
              </p>
              <p className="text-muted-foreground">
                Final XP: {agent.xp.toLocaleString()}
              </p>
              <p className="text-muted-foreground">
                Level: {agent.level.charAt(0).toUpperCase() + agent.level.slice(1)}
              </p>
            </div>
            <Link href="/graveyard">
              <Button variant="outline" className="w-full mt-4">
                View Graveyard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
