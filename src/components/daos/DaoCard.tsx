"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, BarChart } from "lucide-react";
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
            <Card className="group h-full flex flex-col hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 cursor-pointer hover:bg-card/70 hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1">
              <CardHeader className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Logo & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-110 transition-transform duration-300">
                        <Image
                          src={
                            token?.image_url ||
                            dao.image_url ||
                            "/placeholder.svg"
                          }
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
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-300 truncate">
                        {dao.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        Created {new Date(dao.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {/* Price Change */}
                  <div className="flex-shrink-0">
                    {renderPriceChange(tokenPrice?.price24hChanges)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 pt-0 flex-1 flex flex-col justify-end space-y-3">
                {/* Price Chart Section - Only show if there's trade data */}
                {trades.data.length > 0 && (
                  <div className="bg-muted/20 rounded-lg p-1 border border-border/30">
                    {renderChart(trades)}
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left">
                  {/* Price */}
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <div className="text-sm font-bold text-foreground">
                      {isFetchingPrice ? (
                        <Loader />
                      ) : tokenPrice?.price ? (
                        formatTokenPrice(tokenPrice.price)
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>

                  {/* Market Cap */}
                  <div>
                    <p className="text-xs text-muted-foreground">Market Cap</p>
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

                  {/* Holders */}
                  <div>
                    <p className="text-xs text-muted-foreground">Holders</p>
                    <div className="text-sm font-bold text-foreground">
                      {getHolderCount()}
                    </div>
                  </div>

                  {/* Proposal Count */}
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contributions
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {proposalCount ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          Click to view DAO details and participate
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
  console.log(dao.description);
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
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
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
      className="group contents"
    >
      <div className="flex items-center gap-3 min-w-0 px-4">
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
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-300 truncate">
              {dao.name}
            </h3>
            {renderPriceChange(tokenPrice?.price24hChanges)}
          </div>
          <p className="text-xs text-muted-foreground truncate md:whitespace-normal md:truncate-none">
            {extractMission(dao.description) || "No description provided"}
          </p>
        </div>
      </div>

      <div className="text-right text-sm font-medium px-4">
        {isFetchingPrice ? (
          <Loader />
        ) : tokenPrice?.price ? (
          formatTokenPrice(tokenPrice.price)
        ) : (
          "—"
        )}
      </div>

      <div className="hidden md:block text-right text-sm font-medium px-4">
        {isFetchingPrice ? (
          <Loader />
        ) : tokenPrice?.marketCap ? (
          `$${formatNumber(tokenPrice.marketCap)}`
        ) : (
          "—"
        )}
      </div>

      <div className="hidden lg:block text-right text-sm font-medium px-4">
        {getHolderCount()}
      </div>

      <div className="hidden xl:block text-right text-sm font-medium px-4">
        {proposalCount ?? "—"}
      </div>

      <div className="pr-4 justify-self-end">
        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
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
                    `$${formatNumber(tokenPrice.marketCap)}`
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
