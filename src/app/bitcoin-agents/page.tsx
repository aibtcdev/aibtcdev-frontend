"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BitcoinAgentCard } from "@/components/bitcoin-agents";
import {
  fetchBitcoinAgents,
  fetchGlobalStats,
} from "@/services/bitcoin-agents.service";
import type {
  BitcoinAgent,
  BitcoinAgentLevel,
  BitcoinAgentStats,
} from "@/types";
import Link from "next/link";

export default function BitcoinAgentsPage() {
  const [agents, setAgents] = useState<BitcoinAgent[]>([]);
  const [stats, setStats] = useState<BitcoinAgentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "alive" | "dead">(
    "alive"
  );
  const [levelFilter, setLevelFilter] = useState<BitcoinAgentLevel | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"xp" | "hunger" | "age">("xp");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [agentsData, statsData] = await Promise.all([
        fetchBitcoinAgents({
          status: statusFilter === "all" ? undefined : statusFilter,
          level: levelFilter === "all" ? undefined : levelFilter,
        }),
        fetchGlobalStats(),
      ]);

      setAgents(agentsData.agents);
      setStats(statsData);
    } catch (err) {
      setError("Failed to load agents. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, levelFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort agents
  const filteredAgents = agents
    .filter((agent) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          agent.name.toLowerCase().includes(query) ||
          agent.agent_id.toString().includes(query) ||
          agent.owner.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "xp") return b.xp - a.xp;
      if (sortBy === "hunger")
        return (a.computed_hunger ?? a.hunger) - (b.computed_hunger ?? b.hunger);
      if (sortBy === "age") return a.birth_block - b.birth_block;
      return 0;
    });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Bitcoin Agents</h1>
          <p className="text-muted-foreground mt-1">
            Tamagotchi-style AI companions on Bitcoin
          </p>
        </div>
        <Link href="/bitcoin-agents/mint">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
            🥚 Mint New Agent
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total_agents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats.alive_count}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deaths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {stats.total_deaths}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Feedings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total_feedings}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name, ID, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-64"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | "alive" | "dead")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="alive">Alive</SelectItem>
            <SelectItem value="dead">Dead</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={levelFilter}
          onValueChange={(v) =>
            setLevelFilter(v as BitcoinAgentLevel | "all")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="hatchling">🥚 Hatchling</SelectItem>
            <SelectItem value="junior">🐣 Junior</SelectItem>
            <SelectItem value="senior">🐥 Senior</SelectItem>
            <SelectItem value="elder">🦅 Elder</SelectItem>
            <SelectItem value="legendary">🔥 Legendary</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "xp" | "hunger" | "age")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="xp">⭐ XP (High to Low)</SelectItem>
            <SelectItem value="hunger">🍖 Hunger (Urgent)</SelectItem>
            <SelectItem value="age">📅 Age (Oldest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2 mb-6">
        <Link href="/bitcoin-agents/leaderboard">
          <Button variant="outline" size="sm">
            🏆 Leaderboard
          </Button>
        </Link>
        <Link href="/graveyard">
          <Button variant="outline" size="sm">
            💀 Graveyard
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadData}>Try Again</Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agents Grid */}
      {!isLoading && !error && (
        <>
          {filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No agents found matching your criteria.
              </p>
              <Link href="/bitcoin-agents/mint">
                <Button>Mint the First Agent!</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAgents.map((agent) => (
                <BitcoinAgentCard
                  key={agent.agent_id}
                  agent={agent}
                  showOwner
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
