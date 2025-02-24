"use client";

import { useCallback, useState } from "react";
import { BsTwitterX } from "react-icons/bs";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DAO, Token } from "@/types/supabase";
import { Loader } from "../reusables/loader";
import { AgentSelectorSheet } from "./DaoAgentSelector";
import { LineChart, Line, Tooltip as RechartsTooltip, XAxis } from "recharts";

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
  isFetchingPrice?: boolean;
  trades: Record<
    string,
    {
      data: Array<{ timestamp: number; price: number }>;
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

export const DAOTable = ({
  daos,
  tokens,
  tokenPrices,
  isFetchingPrice,
  trades,
}: DAOTableProps) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [participatingDaoId, setParticipatingDaoId] = useState<string | null>(
    null
  );

  const getDexPrincipal = useCallback((dao: DAO) => {
    const dexExtension = dao.extensions?.find((ext) => ext.type === "dex");
    return dexExtension?.contract_principal || "";
  }, []);

  const handleParticipate = (daoId: string) => {
    setParticipatingDaoId(daoId);
  };

  const handleAgentSelect = (agentId: string | null) => {
    setSelectedAgentId(agentId);
    setParticipatingDaoId(null);
  };

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
        <div className="flex h-full items-center justify-center">
          <Loader />
        </div>
      );
    }
    if (tradeData.data.length > 0) {
      return (
        <LineChart data={tradeData.data} width={200} height={100}>
          <XAxis dataKey="timestamp" className="hidden" />
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
                    <p>Price: ${Number(payload[0].value).toFixed(4)}</p>
                    <p>
                      Time:{" "}
                      {new Date(payload[0].payload.timestamp).toLocaleString()}
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
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No trades
      </div>
    );
  };

  const renderDAOCard = (dao: DAO) => {
    const token = tokens?.find((t) => t.dao_id === dao.id);
    const tokenPrice = tokenPrices?.[dao.id];
    const dexPrincipal = getDexPrincipal(dao);
    const tradeData = trades[dao.id];
    const isPriceUp =
      tokenPrice?.price24hChanges != null && tokenPrice.price24hChanges > 0;
    const isPriceDown =
      tokenPrice?.price24hChanges != null && tokenPrice.price24hChanges < 0;

    return (
      <Card key={dao.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image
                  src={token?.image_url || dao.image_url || "/placeholder.svg"}
                  alt={dao.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Link href={`/daos/${dao.id}`}>
                    <span className="font-medium hover:text-primary">
                      {dao.name}
                    </span>
                  </Link>
                  {dao.is_graduated && (
                    <Badge variant="secondary" className="ml-2">
                      Graduated
                    </Badge>
                  )}
                </div>
                {token?.symbol && (
                  <div className="text-sm text-muted-foreground">
                    ${token.symbol}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Price:</div>
                  <div className="font-semibold">
                    ${tokenPrice?.price?.toFixed(8) || "0.00000000"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">24h Change:</div>
                  <div
                    className={`font-semibold ${
                      isPriceUp
                        ? "text-emerald-500"
                        : isPriceDown
                        ? "text-rose-500"
                        : "text-gray-500"
                    }`}
                  >
                    {tokenPrice?.price24hChanges != null
                      ? `${Math.abs(tokenPrice.price24hChanges).toFixed(2)}%`
                      : "0.00%"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Market Cap:</div>
                  <div className="font-semibold">
                    ${formatNumber(tokenPrice?.marketCap || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Holders:</div>
                  <div className="font-semibold">
                    {tokenPrice?.holders || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 h-24 w-full">{renderChart(tradeData)}</div>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold">Prompted By</div>
              {dao.user_id ? (
                <Link
                  href={`https://x.com/i/user/${dao.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  <BsTwitterX className="h-4 w-4" />
                </Link>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div>
              {dexPrincipal ? (
                <Button
                  size="default"
                  onClick={() => handleParticipate(dao.id)}
                  className="bg-primary"
                >
                  Participate
                </Button>
              ) : (
                <Button size="default" disabled>
                  Participate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <colgroup>
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
          </colgroup>
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left font-medium">DAO</th>
              <th className="p-4 text-center font-medium">Chart</th>
              <th className="p-4 text-center font-medium">Price Info</th>
              <th className="p-4 text-center font-medium">Holders</th>
              <th className="p-4 text-center font-medium">Prompted By</th>
              <th className="p-4 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {daos.map((dao) => {
              const token = tokens?.find((t) => t.dao_id === dao.id);
              const tokenPrice = tokenPrices?.[dao.id];
              const dexPrincipal = getDexPrincipal(dao);
              const tradeData = trades[dao.id];
              const isPriceUp =
                tokenPrice?.price24hChanges != null &&
                tokenPrice.price24hChanges > 0;
              const isPriceDown =
                tokenPrice?.price24hChanges != null &&
                tokenPrice.price24hChanges < 0;

              return (
                <tr key={dao.id} className="border-b hover:bg-zinc-900">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg">
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
                        />
                      </div>
                      <div>
                        <Link href={`/daos/${dao.id}`}>
                          <span className="font-medium hover:text-primary">
                            {dao.name}
                          </span>
                        </Link>
                        {dao.is_graduated && (
                          <Badge variant="secondary" className="ml-2">
                            Graduated
                          </Badge>
                        )}
                        {token?.symbol && (
                          <div className="text-xs text-muted-foreground">
                            ${token.symbol}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="h-32 w-full">{renderChart(tradeData)}</div>
                  </td>
                  <td className="p-4">
                    <Card className="w-full mx-auto max-w-[200px]">
                      <CardContent className="p-4">
                        {isFetchingPrice ? (
                          <Loader />
                        ) : (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Price:
                              </span>
                              <span className="font-semibold">
                                ${tokenPrice?.price?.toFixed(9) || "0.00"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                24h:
                              </span>
                              <span
                                className={`font-semibold ${
                                  isPriceUp
                                    ? "text-emerald-500"
                                    : isPriceDown
                                    ? "text-rose-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {tokenPrice?.price24hChanges != null
                                  ? `${Math.abs(
                                      tokenPrice.price24hChanges
                                    ).toFixed(2)}%`
                                  : "0.00%"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                MCap:
                              </span>
                              <span className="font-semibold">
                                ${formatNumber(tokenPrice?.marketCap || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </td>
                  <td className="p-4 text-center">
                    {isFetchingPrice ? (
                      <Loader />
                    ) : (
                      <span className="text-muted-foreground">
                        {tokenPrice?.holders || 0}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {dao.user_id ? (
                      <Link
                        href={`https://x.com/i/user/${dao.user_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1 text-primary hover:underline"
                      >
                        <BsTwitterX className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {dexPrincipal ? (
                      <Button
                        size="sm"
                        onClick={() => handleParticipate(dao.id)}
                        className="bg-primary hover:bg-secondary"
                      >
                        Participate
                      </Button>
                    ) : (
                      <Button size="sm" disabled>
                        Participate
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-4">{daos.map(renderDAOCard)}</div>
      <AgentSelectorSheet
        selectedAgentId={selectedAgentId}
        onSelect={handleAgentSelect}
        open={!!participatingDaoId}
        requiredTokenSymbol={
          tokens?.find((t) => t.dao_id === participatingDaoId)?.symbol
        }
        onOpenChange={(open) => {
          if (!open) setParticipatingDaoId(null);
        }}
        daos={daos}
        tokens={tokens}
      />
    </div>
  );
};

export default DAOTable;
