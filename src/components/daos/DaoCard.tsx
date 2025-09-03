"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart,
  Users,
  FileText,
  Clock,
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

import { extractMission, formatNumber, formatTokenPrice } from "@/utils/format";

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
  proposalCount?: number;
  heightClass?: string; // New prop for height control
}

const truncateName = (name: string, maxLength = 20) => {
  if (name.length > maxLength) {
    return `${name.slice(0, maxLength)}...`;
  }
  return name;
};

export const DAOCard = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
  trades,
  holders,
  proposalCount,
  heightClass = "min-h-[380px]", // Default height if not provided
}: DAOCardProps) => {
  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice
      ? "hsl(var(--success))"
      : "hsl(var(--destructive))";
  };

  const renderChart = (tradeData: {
    data: Array<{ timestamp: number; price: number }>;
    isLoading: boolean;
  }) => {
    if (tradeData.isLoading) {
      return (
        <div className="flex h-[50px] items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={50}>
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
              strokeWidth={2.5}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <div className="flex h-[50px] items-center justify-center">
        <div className="text-center space-y-1">
          <BarChart className="h-5 w-5 text-muted-foreground/50 mx-auto" />
          <span className="text-xs text-muted-foreground">No trading data</span>
        </div>
      </div>
    );
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) {
      return null;
    }

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
          isPositive
            ? "text-success bg-success/10"
            : "text-destructive bg-destructive/10"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">
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
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={() => router.push(`/daos/${encodeURIComponent(dao.name)}`)}
            className="block h-full"
          >
            <Card
              className={`group h-full flex flex-col ${heightClass} hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/40 cursor-pointer hover:bg-card/80 hover:scale-[1.03] active:scale-[0.97] hover:-translate-y-2 hover:ring-2 hover:ring-primary/30`}
            >
              <CardHeader className="p-4 sm:p-5 pb-3 flex-shrink-0">
                <div className="flex items-start gap-3">
                  {/* Logo & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-110 transition-transform duration-300 ring-2 ring-border/30 group-hover:ring-primary/30">
                        <Image
                          src={
                            token?.image_url ||
                            dao.image_url ||
                            "/placeholder.svg"
                          }
                          alt={dao.name}
                          width={48}
                          height={48}
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate leading-tight mb-1">
                        {dao.name}
                      </h3>
                      {/* Mission Tagline */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {extractMission(dao.description)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-2 flex-1 flex flex-col">
                <div className="flex-1 space-y-4">
                  {/* Price Chart Section - Only show if there's trade data */}
                  {trades.data.length > 0 && (
                    <div className="bg-muted/20 rounded-lg p-1 border border-border/30">
                      {renderChart(trades)}
                    </div>
                  )}

                  {/* Primary Stats - Market Cap Emphasized */}
                  <div className="space-y-4">
                    {/* Market Cap - King Metric */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-primary/5 rounded-lg p-3 sm:p-4 border border-primary/20 ring-1 ring-primary/10">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">
                              Market Cap
                            </p>
                            <div className="text-lg sm:text-xl font-bold text-foreground truncate">
                              {isFetchingPrice ? (
                                <Loader />
                              ) : tokenPrice?.marketCap ? (
                                "$" + `${formatNumber(tokenPrice.marketCap)}`
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {tokenPrice?.marketCap
                              ? `Full value: ${tokenPrice.marketCap.toLocaleString()}`
                              : "Market cap data unavailable"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Price - Secondary with Growth Badge */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground">
                                Price
                              </p>
                              {renderPriceChange(tokenPrice?.price24hChanges)}
                            </div>
                            <div className="text-sm sm:text-base font-semibold text-foreground truncate">
                              {isFetchingPrice ? (
                                <Loader />
                              ) : tokenPrice?.price ? (
                                formatTokenPrice(tokenPrice.price)
                              ) : (
                                "—"
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {tokenPrice?.price
                              ? `Full price: ${tokenPrice.price.toFixed(8)}`
                              : "Price data unavailable"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Divider */}
                    <div className="border-t border-border/30" />

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {/* Holders */}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Holders
                          </p>
                          <div className="text-sm font-semibold text-foreground">
                            {getHolderCount()}
                          </div>
                        </div>
                      </div>

                      {/* Contributions */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Contributions
                          </p>
                          <div className="text-sm font-semibold text-foreground">
                            {proposalCount ?? "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Created Date - Bottom */}
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-border/20 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      Created {new Date(dao.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 opacity-60 group-hover:opacity-100" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-center">
            <p className="font-medium">{dao.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view details and participate
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const DAOListItem = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
  holders,
  proposalCount,
}: Omit<DAOCardProps, "trades">) => {
  const router = useRouter();

  const getHolderCount = () => {
    if (holders?.isLoading) return <Loader />;
    if (holders?.data?.holderCount)
      return holders.data.holderCount.toLocaleString();
    return tokenPrice?.holders?.toLocaleString() || "—";
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) return null;
    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs ${
          isPositive
            ? "text-success bg-success/10"
            : "text-destructive bg-destructive/10"
        }`}
      >
        <Icon className="h-3 w-3" />
        <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div
      onClick={() => router.push(`/daos/${encodeURIComponent(dao.name)}`)}
      className="group grid grid-cols-[1fr_80px] sm:grid-cols-[1fr_80px_100px] md:grid-cols-[1fr_80px_100px_80px] lg:grid-cols-[1fr_80px_100px_80px_100px] items-center gap-x-2 sm:gap-x-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
    >
      {/* DAO Info Column */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-105 transition-transform duration-300">
            <Image
              src={token?.image_url || dao.image_url || "/placeholder.svg"}
              alt={dao.name}
              width={40}
              height={40}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-300 truncate">
              {dao.name}
            </h3>
            <div className="hidden sm:block">
              {renderPriceChange(tokenPrice?.price24hChanges)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {extractMission(dao.description)}
          </p>
        </div>
      </div>

      {/* Price Column */}
      <div className="text-right text-sm font-medium">
        {isFetchingPrice ? (
          <Loader />
        ) : tokenPrice?.price ? (
          formatTokenPrice(tokenPrice.price)
        ) : (
          "—"
        )}
      </div>

      {/* Market Cap Column */}
      <div className="hidden sm:block text-right text-sm font-medium">
        {isFetchingPrice ? (
          <Loader />
        ) : tokenPrice?.marketCap ? (
          `${formatNumber(tokenPrice.marketCap)}`
        ) : (
          "—"
        )}
      </div>

      {/* Holders Column */}
      <div className="hidden md:block text-right text-sm font-medium">
        {getHolderCount()}
      </div>

      {/* Proposals Column */}
      <div className="hidden lg:block text-right text-sm font-medium">
        {proposalCount ?? "—"}
      </div>
    </div>
  );
};

// Compact version for list view or when showing many DAOs
export const CompactDAOCard = ({
  dao,
  token,
  tokenPrice,
  isFetchingPrice,
  holders,
  proposalCount,
}: Omit<DAOCardProps, "trades">) => {
  const router = useRouter();
  const getHolderCount = () => {
    if (holders?.isLoading) {
      return <Loader />;
    }
    if (holders?.data?.holderCount) {
      return holders.data.holderCount.toLocaleString();
    }
    return tokenPrice?.holders?.toLocaleString() || "—";
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) {
      return null;
    }

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
          isPositive
            ? "text-success bg-success/10"
            : "text-destructive bg-destructive/10"
        }`}
      >
        <Icon className="h-3 w-3" />
        <span className="font-medium">{Math.abs(change).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div
      onClick={() => router.push(`/daos/${encodeURIComponent(dao.name)}`)}
      className="group block"
    >
      <Card className="hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-card/30 backdrop-blur-sm border-border/30 hover:border-primary/40 cursor-pointer hover:bg-card/50 hover:scale-[1.01] active:scale-[0.99]">
        <CardContent className="p-3">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={token?.image_url || dao.image_url || "/placeholder.svg"}
                  alt={dao.name}
                  width={40}
                  height={40}
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
            </div>

            {/* DAO Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  {truncateName(dao.name, 25)}
                </h3>
                {renderPriceChange(tokenPrice?.price24hChanges)}
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm flex-shrink-0">
              <div className="text-right">
                <div className="font-bold text-foreground text-sm">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : tokenPrice?.price ? (
                    formatTokenPrice(tokenPrice.price)
                  ) : (
                    "—"
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Price</div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="font-bold text-foreground text-sm">
                  {isFetchingPrice ? (
                    <Loader />
                  ) : tokenPrice?.marketCap ? (
                    `${formatNumber(tokenPrice.marketCap)}`
                  ) : (
                    "—"
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Market Cap</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground text-sm">
                  {getHolderCount()}
                </div>
                <div className="text-xs text-muted-foreground">Holders</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-foreground text-sm">
                  {proposalCount ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Contributions
                </div>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className="flex-shrink-0 pl-2">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
