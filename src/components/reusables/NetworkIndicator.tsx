"use client";

import { cn } from "@/lib/utils";

export function NetworkIndicator() {
  const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet";
  const isTestnet = network === "testnet";

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-card/20 backdrop-blur-sm rounded-sm hover:bg-card/30 hover:scale-105 transition-all duration-300 ease-in-out group">
      <div className="relative">
        <div
          className={cn(
            "h-2.5 w-2.5  transition-all duration-300",
            isTestnet
              ? "bg-orange-500 shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50"
              : "bg-green-500 shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50",
            "animate-pulse"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-sm scale-150 opacity-30 transition-opacity duration-300",
            isTestnet ? "bg-orange-500" : "bg-green-500",
            "group-hover:opacity-50 blur-sm"
          )}
        />
      </div>

      <span
        className={cn(
          "text-xs font-semibold tracking-wider transition-all duration-300",
          isTestnet
            ? "text-orange-500 group-hover:text-orange-400"
            : "text-green-500 group-hover:text-green-400",
          "hidden sm:block"
        )}
      >
        {network.toUpperCase()}
      </span>
    </div>
  );
}
