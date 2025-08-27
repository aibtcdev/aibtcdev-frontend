"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { getExplorerLink } from "@/utils/format";

interface AccountCardProps {
  title: string;
  address: string | null;
  icon: React.ElementType;
  isPrimary?: boolean;
  network?: "mainnet" | "testnet";
  metadata?: Record<string, unknown>;
}

// Helper function to truncate address for mobile
const truncateAddress = (address: string, startLength = 6, endLength = 4) => {
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
    <div
      className={`transition-all w-full max-w-full min-h-24 rounded-md border bg-background ${
        isPrimary ? "ring-2 ring-primary/20 bg-primary/5" : ""
      }`}
    >
      <div className="py-2 px-4">
        <div className="space-y-3">
          {/* Main Row - Mobile Responsive */}
          <div className="flex items-start gap-3 sm:items-center">
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

            {/* Center: Address and Network - Mobile Stack */}
            <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
              {/* Address with responsive truncation */}
              <button
                onClick={() => copyToClipboard(address)}
                className="font-mono text-sm text-foreground hover:text-primary transition-colors w-full text-left group"
              >
                {/* Show full address on larger screens, truncated on mobile */}
                <span className="hidden sm:inline truncate">{address}</span>
                <span className="sm:hidden">{truncateAddress(address)}</span>
              </button>

              {/* Network Badge */}
              <Badge
                variant={network === "mainnet" ? "default" : "secondary"}
                className={`text-xs ${
                  network === "mainnet"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
              >
                {network.toUpperCase()}
              </Badge>
            </div>

            {/* Right: Actions - Stack on mobile */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
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

              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
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

          {/* Expandable Metadata - Mobile responsive */}
          {metadata && (
            <div className="pt-3 border-t border-border space-y-2">
              {Object.entries(metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm"
                >
                  <span className="text-muted-foreground capitalize">
                    {key.replace("_", " ")}:
                  </span>
                  <span className="font-medium break-all sm:break-normal sm:text-right">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
