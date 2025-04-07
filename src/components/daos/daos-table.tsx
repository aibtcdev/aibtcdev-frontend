"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, BarChart } from "lucide-react";
import type { DAO, Token, Holder } from "@/types/supabase";
import { Loader } from "../reusables/loader";
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
import { DAOBuyToken } from "./dao-buy-token";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface DAOTableProps {
  daos: DAO[];
  tokens?: Token[];
  tokenPrices?: Record<
    string,
    {
      price: number;
      marketCap: number;
      holders: number;
      price24hChanges: number | null;
    }
  >;
  isFetchingPrice: boolean;
  trades: Record<
    string,
    {
      data: Array<{ timestamp: number; price: number }>;
      isLoading: boolean;
    }
  >;
  holders: Record<
    string,
    {
      data: {
        holders: Holder[];
        totalSupply: number;
        holderCount: number;
      } | null;
      isLoading: boolean;
    }
  >;
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
};

const truncateName = (name: string, maxLength: number = 10) => {
  return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
};

export const DAOTable = ({
  daos,
  tokens,
  tokenPrices,
  isFetchingPrice,
  trades,
  holders,
}: DAOTableProps) => {
  const getChartColor = (data: Array<{ timestamp: number; price: number }>) => {
    if (data.length < 2) return "#8884d8";
    const startPrice = data[0].price;
    const endPrice = data[data.length - 1].price;
    return endPrice >= startPrice ? "#22c55e" : "#ef4444";
  };
  const router = useRouter();

  const renderChart = (
    tradeData: {
      data: Array<{ timestamp: number; price: number }>;
      isLoading: boolean;
    },
    compact = false
  ) => {
    if (tradeData.isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={compact ? 60 : 100}>
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
                    <div className="bg-popover text-popover-foreground rounded-md shadow-md p-2 text-xs">
                      <p>Price: ${Number(payload[0].value).toFixed(8)}</p>
                      <p>
                        Time:{" "}
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
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <BarChart className="h-5 w-5 text-muted-foreground opacity-50" />
        <span className="ml-1 text-xs text-muted-foreground">
          No trade data
        </span>
      </div>
    );
  };

  const renderPriceChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return "0%";

    const isPositive = change > 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div
        className={`flex items-center justify-center gap-1 ${
          isPositive ? "text-green-500" : "text-red-500"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{Math.abs(change).toFixed(2)}%</span>
      </div>
    );
  };

  const getHolderCount = (daoId: string) => {
    const holderData = holders[daoId];
    if (holderData?.isLoading) {
      return <Loader />;
    }

    if (holderData?.data?.holderCount) {
      return holderData.data.holderCount.toLocaleString();
    }

    return tokenPrices?.[daoId]?.holders?.toLocaleString() || "—";
  };

  const renderDAOCard = (dao: DAO) => {
    const token = tokens?.find((t) => t.dao_id === dao.id);
    const tokenPrice = tokenPrices?.[dao.id];
    const tradeData = trades[dao.id];

    return (
      <Card
        key={dao.id}
        className="overflow-hidden h-full hover:shadow-md transition-all"
      >
        <CardContent className="p-0 h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-md flex-shrink-0">
                <Image
                  src={
                    token?.image_url ||
                    dao.image_url ||
                    "/placeholder.svg?height=40&width=40" ||
                    "/placeholder.svg"
                  }
                  alt={dao.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/daos/${encodeURIComponent(dao.name)}`}
                          className="font-medium hover:underline hover:text-primary text-sm"
                        >
                          {truncateName(dao.name)}
                        </Link>
                      </TooltipTrigger>
                      {dao.name.length > 10 && (
                        <TooltipContent>
                          <p className="text-xs">{dao.name}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  {dao.is_graduated && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      Graduated
                    </Badge>
                  )}
                </div>
                {token?.symbol && (
                  <div className="text-xs text-muted-foreground">
                    ${token.symbol}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* WE NEED TO CHANGE IT BASED ON WHAT THE NAME WILL BE ON MAINNET. AS OF NOW SINCE WE ARE TESTING ON THESE TWO ON STAGING I HAVE ENABLED PARTICIPATION FOR THESE TWO ONLY */}
              {dao?.name === "FACES" ||
              dao?.name === "MEDIA2" ||
              dao?.name === "MEDIA3" ? (
                <DAOBuyToken daoId={encodeURIComponent(dao.name)} />
              ) : (
                <Button className="cursor-not-allowed" disabled>
                  Participate.
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 border-b">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground line-clamp-2 cursor-help">
                    {dao.mission || "No mission statement available"}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-[400px]">
                  <p className="text-xs">
                    {dao.mission || "No mission statement available"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Tabs
            defaultValue="overview"
            className="w-full flex-grow flex flex-col"
          >
            <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-9">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="chart" className="text-xs">
                Chart
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="overview"
              className="p-4 pt-3 flex-grow flex flex-col justify-center"
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs h-full">
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Price</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : tokenPrice?.price ? (
                      `$${tokenPrice.price.toFixed(8)}`
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">24h Change</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      renderPriceChange(tokenPrice?.price24hChanges)
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Market Cap</div>
                  <div className="font-medium">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : tokenPrice?.marketCap ? (
                      `$${formatNumber(tokenPrice.marketCap)}`
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground mb-1">Holders</div>
                  <div className="font-medium flex flex-col items-center">
                    {getHolderCount(dao.id)}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent
              value="chart"
              className="p-4 flex-grow flex items-center justify-center"
            >
              {renderChart(tradeData)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium text-muted-foreground">
                DAO
              </th>
              <th className="p-4 text-left font-medium text-muted-foreground">
                Mission
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                Chart
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                Price
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                24h Change
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                Market Cap
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                Holders
              </th>
              <th className="p-4 text-center font-medium text-muted-foreground">
                Quick Buy
              </th>
            </tr>
          </thead>
          <tbody>
            {daos.length > 0 ? (
              daos.map((dao) => {
                const token = tokens?.find((t) => t.dao_id === dao.id);
                const tokenPrice = tokenPrices?.[dao.id];
                const tradeData = trades[dao.id];

                return (
                  <tr
                    key={dao.id}
                    className="border-b hover:bg-muted/30 transition-colors"
                    onClick={() =>
                      router.push(`/daos/${encodeURIComponent(dao.name)}`)
                    }
                  >
                    <td
                      className="p-4 text-left cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-md flex-shrink-0">
                          <Image
                            src={
                              token?.image_url ||
                              dao.image_url ||
                              "/placeholder.svg?height=32&width=32" ||
                              "/placeholder.svg"
                            }
                            alt={dao.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={`/daos/${encodeURIComponent(
                                      dao.name
                                    )}`}
                                    className="font-medium hover:underline text-sm"
                                  >
                                    {truncateName(dao.name)}
                                  </Link>
                                </TooltipTrigger>
                                {dao.name.length > 10 && (
                                  <TooltipContent>
                                    <p className="text-xs">{dao.name}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {dao.is_graduated && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1 py-0 h-4"
                              >
                                Graduated
                              </Badge>
                            )}
                          </div>
                          {token?.symbol && (
                            <div className="text-xs text-muted-foreground">
                              ${token.symbol}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className="p-4 w-[20%] max-w-[300px] text-left cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground truncate">
                              {dao.mission || "No mission statement available"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[400px]">
                            <p className="text-xs">
                              {dao.mission || "No mission statement available"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td
                      className="p-4 w-[15%] text-center cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mx-auto h-16 w-[180px]">
                        {renderChart(tradeData, true)}
                      </div>
                    </td>
                    <td
                      className="p-4 text-center font-medium cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      {isFetchingPrice ? (
                        <Loader />
                      ) : tokenPrice?.price ? (
                        `$${tokenPrice.price.toFixed(8)}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className="p-4 text-center font-medium cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        {isFetchingPrice ? (
                          <Loader />
                        ) : (
                          renderPriceChange(tokenPrice?.price24hChanges)
                        )}
                      </div>
                    </td>
                    <td
                      className="p-4 text-center font-medium cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      {isFetchingPrice ? (
                        <Loader />
                      ) : tokenPrice?.marketCap ? (
                        `$${formatNumber(tokenPrice.marketCap)}`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className="p-4 text-center font-medium cursor-pointer"
                      // onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center justify-center">
                        {getHolderCount(dao.id)}
                      </div>
                    </td>
                    <td
                      className="p-4 text-center cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        {/* WE NEED TO CHANGE IT BASED ON WHAT THE NAME WILL BE ON MAINNET. AS OF NOW SINCE WE ARE TESTING ON THESE TWO ON STAGING I HAVE ENABLED PARTICIPATION FOR THESE TWO ONLY */}
                        {dao?.name === "FACES" ||
                        dao?.name === "MEDIA2" ||
                        dao?.name === "MEDIA3" ? (
                          <DAOBuyToken daoId={dao.id} />
                        ) : (
                          <Button className="cursor-not-allowed" disabled>
                            20k Sats
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="p-6 text-center text-muted-foreground"
                >
                  No DAOs found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {daos.length > 0 ? (
          daos.map(renderDAOCard)
        ) : (
          <div className="p-6 text-center text-muted-foreground border rounded-md">
            No DAOs found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default DAOTable;
