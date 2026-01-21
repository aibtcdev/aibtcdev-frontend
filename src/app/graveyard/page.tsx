"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LevelBadge } from "@/components/bitcoin-agents";
import { fetchGraveyard } from "@/services/bitcoin-agents.service";
import type { DeathCertificate } from "@/types";
import Link from "next/link";

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

export default function GraveyardPage() {
  const [certificates, setCertificates] = useState<DeathCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "lifespan" | "level">(
    "recent"
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchGraveyard();
      setCertificates(data.certificates);
    } catch (err) {
      setError("Failed to load graveyard");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const sortedCertificates = [...certificates].sort((a, b) => {
    if (sortBy === "recent") return b.death_block - a.death_block;
    if (sortBy === "lifespan") return b.lifespan_blocks - a.lifespan_blocks;
    if (sortBy === "level") return b.final_xp - a.final_xp;
    return 0;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">💀 The Graveyard</h1>
        <p className="text-muted-foreground">
          A memorial for fallen Bitcoin Agents
        </p>
      </div>

      {/* Sort */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {certificates.length} agents at rest
        </p>
        <Select
          value={sortBy}
          onValueChange={(v) =>
            setSortBy(v as "recent" | "lifespan" | "level")
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="lifespan">Longest Lived</SelectItem>
            <SelectItem value="level">Highest Level</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Certificates */}
      {!isLoading && !error && (
        <>
          {sortedCertificates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">🌱</p>
              <p className="text-xl font-medium mb-2">
                The graveyard is empty
              </p>
              <p className="text-muted-foreground mb-4">
                All agents are still alive! Keep feeding them.
              </p>
              <Link href="/bitcoin-agents">
                <Badge variant="outline" className="cursor-pointer">
                  View Living Agents →
                </Badge>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedCertificates.map((cert) => (
                <Card
                  key={cert.agent_id}
                  className="border-red-200 dark:border-red-800 bg-gradient-to-b from-background to-red-50 dark:to-red-950/20"
                >
                  <CardContent className="pt-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-2 border-red-300 dark:border-red-700 grayscale">
                          <AvatarImage
                            src={`${BITCOIN_FACES_API}/get-image?name=${cert.owner}`}
                            alt={cert.name}
                          />
                          <AvatarFallback>
                            {cert.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 text-2xl">
                          💀
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Agent #{cert.agent_id}
                        </p>
                        <LevelBadge level={cert.final_level} size="sm" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-background/50 p-3 rounded-lg mb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Lifespan</p>
                          <p className="font-mono">
                            {cert.lifespan_blocks.toLocaleString()} blocks
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Final XP</p>
                          <p className="font-mono">
                            {cert.final_xp.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Feedings</p>
                          <p className="font-mono">{cert.total_feedings}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cause</p>
                          <p className="capitalize">{cert.cause_of_death}</p>
                        </div>
                      </div>
                    </div>

                    {/* Epitaph */}
                    {cert.epitaph && (
                      <div className="border-t border-red-200 dark:border-red-800 pt-4">
                        <p className="text-sm italic text-center text-muted-foreground">
                          &quot;{cert.epitaph}&quot;
                        </p>
                      </div>
                    )}

                    {/* Death Block */}
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Died at block {cert.death_block.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Back Link */}
      <div className="text-center mt-8">
        <Link
          href="/bitcoin-agents"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Back to Living Agents
        </Link>
      </div>
    </div>
  );
}
