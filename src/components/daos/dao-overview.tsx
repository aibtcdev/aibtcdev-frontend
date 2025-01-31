"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BsGlobe, BsTwitterX, BsTelegram } from "react-icons/bs";
import type { DAO, Token } from "@/types/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAOCreationDate } from "./dao-creation-date";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

interface DAOOverviewProps {
  dao: DAO;
  token?: Token;
  treasuryTokens?: {
    type: "FT" | "NFT";
    name: string;
    symbol: string;
    amount: number;
    value: number;
  }[];
  marketStats?: {
    price: number;
    marketCap: number;
    treasuryBalance: number;
    holderCount: number;
  };
}

function DAOOverview({
  dao,
  treasuryTokens = [],
  marketStats = {
    price: 0,
    marketCap: 0,
    treasuryBalance: 0,
    holderCount: 0,
  },
}: DAOOverviewProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  return (
    <div className="relative w-full">
      <div className="flex justify-center sm:justify-start gap-3 mb-8">
        {dao.website_url && (
          <a
            href={dao.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <BsGlobe className="h-5 w-5" />
          </a>
        )}
        {dao.x_url && (
          <a
            href={dao.x_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <BsTwitterX className="h-5 w-5" />
          </a>
        )}
        {dao.telegram_url && (
          <a
            href={dao.telegram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <BsTelegram className="h-5 w-5" />
          </a>
        )}
      </div>

      <div className="mx-auto space-y-8 sm:space-y-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Token Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.price, true)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.marketCap)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treasury</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(marketStats.treasuryBalance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketStats.holderCount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">About</h2>
            {dao.description && dao.description.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-xs"
              >
                {isDescriptionExpanded ? (
                  <>
                    Show Less <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
          <p
            className={`text-muted-foreground leading-relaxed ${
              !isDescriptionExpanded &&
              dao.description &&
              dao.description.length > 200
                ? "line-clamp-4"
                : ""
            }`}
          >
            {dao.description}
          </p>
        </div>

        {treasuryTokens.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Treasury Holdings</h2>
            <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px]">
                      Type
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {treasuryTokens.some((token) => token.value > 0) && (
                      <TableHead className="text-right">Value</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasuryTokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {token.type}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-none truncate">
                        {token.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {token.symbol}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatNumber(token.amount)}
                      </TableCell>
                      {treasuryTokens.some((token) => token.value > 0) && (
                        <TableCell className="text-right whitespace-nowrap">
                          {token.value > 0 ? formatNumber(token.value) : "-"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        <DAOCreationDate createdAt={dao.created_at} />
      </div>
    </div>
  );
}

export { DAOOverview };
export default DAOOverview;
