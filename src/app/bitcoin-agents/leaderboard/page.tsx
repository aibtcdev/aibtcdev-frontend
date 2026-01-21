"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LevelBadge } from "@/components/bitcoin-agents";
import { fetchLeaderboard, fetchGlobalStats } from "@/services/bitcoin-agents.service";
import type { BitcoinAgent, BitcoinAgentStats } from "@/types";
import Link from "next/link";

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

const RANK_ICONS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<BitcoinAgent[]>([]);
  const [stats, setStats] = useState<BitcoinAgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [leaderboardData, statsData] = await Promise.all([
        fetchLeaderboard("mainnet", 25),
        fetchGlobalStats(),
      ]);

      setLeaderboard(leaderboardData.leaderboard);
      setStats(statsData);
    } catch (err) {
      setError("Failed to load leaderboard");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-muted-foreground">
          Top Bitcoin Agents by experience points
        </p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats.total_agents}</p>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {stats.alive_count}
              </p>
              <p className="text-sm text-muted-foreground">Still Alive</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{stats.total_feedings}</p>
              <p className="text-sm text-muted-foreground">Total Feedings</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="xp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xp">⭐ By XP</TabsTrigger>
          <TabsTrigger value="longevity">📅 Longevity</TabsTrigger>
          <TabsTrigger value="feeders">🍖 Top Feeders</TabsTrigger>
        </TabsList>

        <TabsContent value="xp">
          <Card>
            <CardHeader>
              <CardTitle>Top Agents by XP</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-center text-red-500 py-8">{error}</p>
              )}

              {!isLoading && !error && (
                <div className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No agents yet. Be the first to mint one!
                    </p>
                  ) : (
                    leaderboard.map((agent, index) => (
                      <Link
                        key={agent.agent_id}
                        href={`/bitcoin-agents/${agent.agent_id}`}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        {/* Rank */}
                        <div className="w-10 text-center">
                          {index < 3 ? (
                            <span className="text-2xl">
                              {RANK_ICONS[index]}
                            </span>
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage
                            src={`${BITCOIN_FACES_API}/get-image?name=${agent.owner}`}
                            alt={agent.name}
                          />
                          <AvatarFallback>
                            {agent.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{agent.name}</p>
                          <div className="flex items-center gap-2">
                            <LevelBadge level={agent.level} size="sm" />
                            {!agent.alive && (
                              <span className="text-xs text-red-500">💀</span>
                            )}
                          </div>
                        </div>

                        {/* XP */}
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {agent.xp.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="longevity">
          <Card>
            <CardHeader>
              <CardTitle>Longest Living Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Longevity leaderboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feeders">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Feeders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Top feeders leaderboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evolution Milestones */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🎯 Evolution Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div className="p-3">
              <p className="text-2xl mb-1">🥚</p>
              <p className="text-sm font-medium">Hatchling</p>
              <p className="text-xs text-muted-foreground">0 XP</p>
            </div>
            <div className="p-3">
              <p className="text-2xl mb-1">🐣</p>
              <p className="text-sm font-medium">Junior</p>
              <p className="text-xs text-muted-foreground">500 XP</p>
            </div>
            <div className="p-3">
              <p className="text-2xl mb-1">🐥</p>
              <p className="text-sm font-medium">Senior</p>
              <p className="text-xs text-muted-foreground">2,000 XP</p>
            </div>
            <div className="p-3">
              <p className="text-2xl mb-1">🦅</p>
              <p className="text-sm font-medium">Elder</p>
              <p className="text-xs text-muted-foreground">10,000 XP</p>
            </div>
            <div className="p-3">
              <p className="text-2xl mb-1">🔥</p>
              <p className="text-sm font-medium">Legendary</p>
              <p className="text-xs text-muted-foreground">50,000 XP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="text-center mt-8">
        <Link
          href="/bitcoin-agents"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to Agents
        </Link>
      </div>
    </div>
  );
}
