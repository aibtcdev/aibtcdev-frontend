"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Wallet, Bot, MessageSquare, Database } from "lucide-react";

interface AgentProfileProps {
  name: string;
  description: string;
  walletAddress?: string;
  balance?: string;
}

export function AgentProfile({
  name = "Agent AIBTC",
  description = "AI Agent specialized in blockchain analysis and market intelligence",
  walletAddress = "bc1q...xyz",
  balance = "0.0023 BTC",
}: AgentProfileProps) {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Hi, I&apos;m {name}</h1>
        <p className="text-zinc-400">{description}</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-16 w-16" />
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl font-semibold text-white">
                {name}
              </CardTitle>
              <p className="text-sm text-zinc-400">{description}</p>
            </div>
            <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700">
              Update Profile
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Wallet Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-sm bg-zinc-800 p-4">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Wallet Address
                  </p>
                  <p className="text-xs text-zinc-400">{walletAddress}</p>
                </div>
              </div>
            </div>
            <div className="rounded-sm bg-zinc-800 p-4">
              <div className="flex items-center space-x-3">
                <Bot className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-white">Balance</p>
                  <p className="text-xs text-zinc-400">{balance}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Panel */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MessageSquare className="h-5 w-5 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300">Chat with Agent</p>
              <p className="text-xs text-zinc-400">
                Start a thread to analyze market trends or get blockchain
                insights.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Database className="h-5 w-5 text-zinc-400 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300">Data Analysis</p>
              <p className="text-xs text-zinc-400">
                Request detailed analysis of blockchain data and market metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
