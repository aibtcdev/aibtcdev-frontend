"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Wallet, User } from "lucide-react";
import { getStacksAddress } from "@/lib/address";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";

export function AccountHeader() {
  const [stacksAddress, setStacksAddress] = useState<string | null>(null);
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const userAgent = agents[0] || null;

  useEffect(() => {
    setStacksAddress(getStacksAddress());
  }, []);

  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK;
  const isMainnet = network === "mainnet";

  return (
    <div className="fixed  z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: User Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  Account Dashboard
                </span>
                <Badge
                  variant={isMainnet ? "default" : "secondary"}
                  className={`text-xs ${
                    isMainnet
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  {isMainnet ? "MAINNET" : "TESTNET"}
                </Badge>
              </div>
              {stacksAddress && (
                <span className="text-xs text-muted-foreground font-mono">
                  {stacksAddress.slice(0, 8)}...{stacksAddress.slice(-4)}
                </span>
              )}
            </div>
          </div>

          {/* Right: Portfolio Summary */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Portfolio Value</p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {userAgent ? "Agent Active" : "No Agent"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
