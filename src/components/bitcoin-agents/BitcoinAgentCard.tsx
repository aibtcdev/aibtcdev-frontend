"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BitcoinAgent } from "@/types";
import { LevelBadge } from "./LevelBadge";
import { HungerHealthBars } from "./HungerHealthBars";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BitcoinAgentCardProps {
  agent: BitcoinAgent;
  showOwner?: boolean;
  showStats?: boolean;
  className?: string;
}

const BITCOIN_FACES_API = "https://bitcoinfaces.xyz/api";

export function BitcoinAgentCard({
  agent,
  showOwner = false,
  showStats = true,
  className,
}: BitcoinAgentCardProps) {
  const faceUrl =
    agent.face_image_url ||
    `${BITCOIN_FACES_API}/get-image?name=${agent.owner}`;

  const hunger = agent.computed_hunger ?? agent.hunger;
  const health = agent.computed_health ?? agent.health;

  return (
    <Link href={`/bitcoin-agents/${agent.agent_id}`}>
      <Card
        className={cn(
          "hover:shadow-lg transition-all duration-200 cursor-pointer",
          !agent.alive && "opacity-60 grayscale",
          className
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={faceUrl} alt={agent.name} />
                <AvatarFallback className="text-lg">
                  {agent.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  {agent.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  #{agent.agent_id}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <LevelBadge level={agent.level} size="sm" />
              {!agent.alive && (
                <Badge variant="destructive" className="text-xs">
                  💀 Dead
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {showStats && agent.alive && (
          <CardContent className="pt-2">
            <HungerHealthBars
              hunger={hunger}
              health={health}
              size="sm"
              showLabels={false}
              showValues={false}
            />
            <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
              <span>🍖 {hunger}%</span>
              <span>❤️ {health}%</span>
              <span>⭐ {agent.xp.toLocaleString()} XP</span>
            </div>
          </CardContent>
        )}

        {showOwner && (
          <CardContent className="pt-0 pb-3">
            <p className="text-xs text-muted-foreground truncate">
              Owner: {agent.owner.slice(0, 8)}...{agent.owner.slice(-4)}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
