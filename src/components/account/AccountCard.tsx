"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { getExplorerLink } from "@/utils/format";

interface AccountCardProps {
  title: string;
  subtitle: string;
  address: string | null;
  icon: React.ElementType;
  isPrimary?: boolean;
  network?: "mainnet" | "testnet";
  metadata?: Record<string, unknown>;
}

export function AccountCard({
  title,
  subtitle,
  address,
  icon: Icon,
  isPrimary = false,
  network = "testnet",
  metadata,
}: AccountCardProps) {
  const { copyToClipboard, copiedText } = useClipboard();

  if (!address) {
    return (
      <div className="border-dashed border border-muted-foreground/30 rounded-md">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-muted-foreground truncate">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              Not Connected
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`transition-all w-full max-w-full h-24 rounded-md border bg-background ${
              isPrimary ? "ring-2 ring-primary/20 bg-primary/5" : ""
            }`}
          >
            <div className="py-2 px-4 overflow-x-auto">
              <div className="space-y-3">
                {/* Main Row */}
                <div className="flex items-center gap-3">
                  {/* Left: Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPrimary ? "bg-primary/10" : "bg-secondary/10"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isPrimary ? "text-primary" : "text-secondary"
                      }`}
                    />
                  </div>

                  {/* Center: Address and Network */}
                  <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                    <span className="text-sm font-medium text-muted-foreground w-full truncate">
                      {isPrimary
                        ? "Primary browser wallet"
                        : "Agent account address"}
                    </span>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="font-mono text-sm text-foreground hover:text-primary transition-colors w-full text-left truncate"
                    >
                      {address}
                    </button>
                    <Badge
                      variant={network === "mainnet" ? "default" : "secondary"}
                      className={`text-sm ${
                        network === "mainnet"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}
                    >
                      {network.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedText === address ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <a
                        href={getExplorerLink("address", address)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Expandable Metadata */}
                {metadata && (
                  <div className="pt-3 border-t border-border space-y-2">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="z-50 space-y-1 p-2">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
