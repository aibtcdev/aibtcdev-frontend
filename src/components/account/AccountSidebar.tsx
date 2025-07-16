// components/account/AccountSidebar.tsx
"use client";
import Image from "next/image";
import { Bot, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  agentAddress: string | null;
  xHandle?: string | null;
}
export function AccountSidebar({ agentAddress, xHandle }: Props) {
  return (
    <aside className="w-full max-w-xs shrink-0 space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div title="Your agent account Bitcoin Face">
          {agentAddress ? (
            <Image
              src={`https://bitcoinfaces.xyz/api/get-image?name=${agentAddress}`}
              alt="Agent Face"
              width={112}
              height={112}
              className="rounded-full"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-muted/20" />
          )}
        </div>
        <a
          href="https://bitcoinfaces.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="text-xs px-3 py-1 h-7">
            Get your Bitcoin Face
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </a>
        <h2 className="text-lg font-semibold">Your Name</h2>
        <p className="text-sm text-muted-foreground">
          @{xHandle ?? "x‑handle"}
        </p>
      </div>

      {/* Agent account */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Bot className="h-3 w-3" />
           Agent Account
        </p>
        {agentAddress ? (
          <div className="break-all">{agentAddress}</div>
        ) : (
          <p className="text-xs italic text-muted-foreground">Not connected</p>
        )}
      </div>

      {/* Configuration Settings */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Configurations
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Proposal Submission</p>
              <p className="text-xs text-muted-foreground">
                Enable submitting proposals via agent
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Voting Contract</p>
              <p className="text-xs text-muted-foreground">
                Enable on-chain voting via smart contract
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-md border bg-background">
            <div>
              <p className="text-sm font-medium">Token Purchase</p>
              <p className="text-xs text-muted-foreground">
                Enable users to purchase governance tokens
              </p>
            </div>
            <Button variant="default" className="text-sm h-8 px-4">
              Enable
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
