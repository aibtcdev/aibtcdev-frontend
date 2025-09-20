"use client";

import type React from "react";
import {
  CoinsIcon as CoinIcon,
  TrendingUp,
  Users2,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsData {
  price: number;
  marketCap: number;
  holderCount: number;
  proposalCount: number;
}

interface MetricsGridProps {
  data: MetricsData;
  isLoading: boolean;
}

interface CompactMetricsProps {
  data: MetricsData;
  isLoading: boolean;
}

export function MetricsGrid({ data, isLoading }: MetricsGridProps) {
  // Format number helper function
  const formatNumber = (num: number, isPrice = false) => {
    if (isPrice) {
      if (num === 0) return "$0.00";
      if (num < 0.01) return `$${num.toFixed(8)}`;
      return `$${num.toFixed(2)}`;
    }

    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <CoinIcon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Price
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">
          {formatNumber(data.price, true)}
        </span>
      </div>

      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-emerald-500/30 transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Market Cap
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">
          {formatNumber(data.marketCap)}
        </span>
      </div>

      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-blue-500/30 transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center">
            <Users2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Holders
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">
          {data.holderCount.toLocaleString()}
        </span>
      </div>

      <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-purple-500/30 transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Proposals
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">
          {data.proposalCount}
        </span>
      </div>
    </div>
  );
}

// Compact version for sidebar use
export function CompactMetrics({ data, isLoading }: CompactMetricsProps) {
  // Format number helper function
  const formatNumber = (num: number, isPrice = false) => {
    if (isPrice) {
      if (num === 0) return "$0.00";
      if (num < 0.01) return `$${num.toFixed(8)}`;
      return `$${num.toFixed(2)}`;
    }

    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return `${num.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Price",
      value: formatNumber(data.price, true),
      icon: CoinIcon,
      color: "text-primary",
    },
    {
      label: "Market Cap",
      value: `$${formatNumber(data.marketCap)}`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Holders",
      value: data.holderCount.toLocaleString(),
      icon: Users2,
      color: "text-blue-500",
    },
    {
      label: "Proposals",
      value: data.proposalCount.toString(),
      icon: FileText,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-2">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="flex items-center justify-between group hover:bg-muted/20 rounded-md p-1.5 transition-colors duration-200"
          >
            <div className="flex items-center gap-1.5">
              <Icon
                className={`h-3 w-3 ${metric.color} group-hover:scale-110 transition-transform duration-200`}
              />
              <span className="text-xs text-muted-foreground font-medium">
                {metric.label}
              </span>
            </div>
            <span className="text-xs font-bold text-foreground">
              {metric.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
