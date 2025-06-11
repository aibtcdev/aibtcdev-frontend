"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  Users,
  DollarSign,
  TrendingUp,
  Building2,
} from "lucide-react";
import type { DAO, Token, Holder } from "@/types";
import { Loader } from "@/components/reusables/Loader";
import {
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  XAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { formatNumber } from "@/utils/format";
import { DAOBuyToken } from "./DaoBuyToken";

interface DAOCardProps {
  dao: DAO;
  token?: Token;
  tokenPrice?: {
    price: number;
    marketCap: number;
    holders: number;
    price24hChanges: number | null;
  };
  isFetchingPrice: boolean;
  trades: {
    data: Array<{ timestamp: number; price: number }>;
    isLoading: boolean;
  };
  holders: {
    data: {
      holders: Holder[];
      totalSupply: number;
      holderCount: number;
    } | null;
    isLoading: boolean;
  };
}

const truncateName = (name: string, maxLength = 20) => {
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
};

export const DAOCard = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
  trades,
  holders,
}: DAOCardProps) => {
  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice ? "#22c55e" : "#ef4444";
  };

  const renderChart = (tradeData: {
    data: Array<{ timestamp: number; price: number }>;
    isLoading: boolean;
  }) => {
    if (tradeData.isLoading) {
      return (
        <div className="flex h-20 items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={tradeData.data}>
            <XAxis dataKey="timestamp" hide />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (
                  active &&
                  payload &&
                  payload.length > 0 &&
                  payload[0].value !== undefined
                ) {
                  return (
                    <div className="bg-card/95 backdrop-blur-sm text-foreground rounded-xl shadow-lg p-3 text-xs border border-border/50">
                      <p className="font-medium">
                        Price: ${Number(payload[0].value).toFixed(8)}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(
                          payload[0].payload.timestamp
                        ).toLocaleString()}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={getChartColor(tradeData.data)}
              dot={false}
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <div className="flex h-20 items-center justify-center">
        <div className="text-center space-y-2">
          <BarChart className="h-6 w-6 text-muted-foreground/50 mx-auto" />
          <span className="text-xs text-muted-foreground">No trading data</span>
        </div>
      </div>
    );
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) {
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm font-medium">0%</span>
        </div>
      );
    }

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
          isPositive
            ? "text-emerald-500 bg-emerald-500/10"
            : "text-rose-500 bg-rose-500/10"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm font-semibold">
          {Math.abs(change).toFixed(2)}%
        </span>
      </div>
    );
  };

  const getHolderCount = () => {
    if (holders?.isLoading) {
      return <Loader />;
    }

    if (holders?.data?.holderCount) {
      return holders.data.holderCount.toLocaleString();
    }

    return tokenPrice?.holders?.toLocaleString() || "—";
  };

  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/daos/${encodeURIComponent(dao.name)}`)}
      className=""
    >
      <Card className="group h-full hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 cursor-pointer hover:bg-card/70">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
              {/* Enhanced Logo */}
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-2xl flex-shrink-0 bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={
                      token?.image_url || dao.image_url || "/placeholder.svg"
                    }
                    alt={dao.name}
                    width={64}
                    height={64}
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>
              </div>

              {/* DAO Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                        {truncateName(dao.name)}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dao.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">
                    Created {new Date(dao.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="min-w-0 mt-2 sm:mt-0 sm:ml-4"
              onClick={(e) => e.stopPropagation()}
            >
              <DAOBuyToken daoId={dao.id} daoName={dao.name} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-8">
          {/* Price Chart Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Price Trend
              </h4>
              {renderPriceChange(tokenPrice?.price24hChanges)}
            </div>
            <div className="bg-muted/20 rounded-2xl p-4 border border-border/30">
              {renderChart(trades)}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">
              Key Metrics
            </h4>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Price */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Price
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : tokenPrice?.price ? (
                      `$${formatNumber(tokenPrice.price)}`
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              {/* Holders */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Holders
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {getHolderCount()}
                  </div>
                </div>
              </div>

              {/* Market Cap */}
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    Market Cap
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : tokenPrice?.marketCap ? (
                      `$${formatNumber(tokenPrice.marketCap)}`
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
