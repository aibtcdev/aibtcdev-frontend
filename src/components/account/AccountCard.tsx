"use client";

import type React from "react";
import { Copy, Check, ExternalLink, WifiOff } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { getExplorerLink } from "@/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccountCardProps {
  title: string;
  address: string | null;
  icon: React.ElementType;
  isPrimary?: boolean;
  network?: "mainnet" | "testnet";
  metadata?: Record<string, unknown>;
  helpText?: string;
}

// Helper function to truncate address for mobile
const truncateAddress = (address: string, startLength = 8, endLength = 6) => {
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export function AccountCard({
  title,
  address,
  icon: Icon,
  isPrimary = false,
  network = "testnet",
  metadata,
  helpText,
}: AccountCardProps) {
  const { copyToClipboard, copiedText } = useClipboard();

  if (!address) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center flex-shrink-0">
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-muted-foreground mb-1">
                {title}
              </h3>
              {helpText && (
                <p className="text-xs text-muted-foreground/80">{helpText}</p>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              Not Connected
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card
        className={`transition-all duration-200 hover:shadow-md ${
          isPrimary
            ? "ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
            : "hover:border-primary/20 hover:shadow-primary/5"
        }`}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isPrimary
                      ? "bg-primary/15 border border-primary/20"
                      : "bg-muted/30 border border-border/50"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isPrimary ? "text-primary" : "text-foreground/70"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {title}
                  </h3>
                  {helpText && (
                    <p className="text-xs text-muted-foreground">{helpText}</p>
                  )}
                </div>
              </div>

              {/* Network Status */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={network === "mainnet" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {network === "mainnet" ? (
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Mainnet
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Testnet
                    </span>
                  )}
                </Badge>
              </div>
            </div>

            {/* Address Section */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => copyToClipboard(address)}
                        className="font-mono text-sm text-foreground hover:text-primary transition-colors text-left w-full group"
                      >
                        <span className="hidden lg:inline group-hover:bg-primary/10 px-1 py-0.5 rounded transition-colors">
                          {address}
                        </span>
                        <span className="lg:hidden group-hover:bg-primary/10 px-1 py-0.5 rounded transition-colors">
                          {truncateAddress(address)}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy address</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address)}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        {copiedText === address ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {copiedText === address ? "Copied!" : "Copy address"}
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <a
                          href={getExplorerLink(
                            title === "Agent Account" ? "tx" : "address",
                            address
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View on explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Details
                </p>
                <div className="grid gap-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:justify-between gap-1 p-2 bg-muted/20 rounded-md"
                    >
                      <span className="text-xs text-muted-foreground capitalize font-medium">
                        {key.replace(/[_-]/g, " ")}
                      </span>
                      <span className="text-xs font-mono text-foreground break-all">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
