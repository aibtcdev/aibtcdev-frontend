"use client";

import type React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Building2, FileText, Users, BarChart3 } from "lucide-react";
import {
  fetchToken,
  fetchDAOExtensions,
  fetchMarketStats,
  fetchTreasuryTokens,
  fetchTokenPrice,
  fetchHolders,
  fetchProposals,
  fetchDAOByName,
} from "@/services/dao.service";
import { Loader } from "@/components/reusables/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProposalSubmission } from "../proposals/ProposalSubmission";
import { extractMission, formatTokenPrice } from "@/utils/format";
import BitcoinDeposit from "@/components/btc-deposit";
import { formatNumber } from "@/utils/format";

export function DAOPage({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const encodedName = params.name as string;

  const { data: dao, isLoading: isLoadingDAOByName } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000,
  });

  const id = dao?.id;

  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  const { data: extensions } = useQuery({
    queryKey: ["extensions", id],
    queryFn: () => fetchDAOExtensions(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  const { dex, treasuryAddress, dexContract } = useMemo(() => {
    if (!extensions)
      return { dex: undefined, treasuryAddress: undefined, dexContract: null };
    const dexExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    console.log(dexPrincipal);

    // const dexPrincipal =
    //   "SP2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5E4R0JRM.beast2-faktory-dex";
    return {
      dex: dexPrincipal,
      treasuryAddress: extensions.find((ext) => ext.type === "aibtc-treasury")
        ?.contract_principal,
      dexContract: dexPrincipal,
    };
  }, [extensions]);

  const { data: tokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
    staleTime: 300000,
  });

  const { data: holdersData } = useQuery({
    queryKey: ["holders", id],
    queryFn: () => fetchHolders(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  const { data: proposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  const { data: marketStats } = useQuery({
    queryKey: ["marketStats", id, dex, token?.max_supply],
    queryFn: () => fetchMarketStats(dex!, id!, token!.max_supply || 0),
    enabled: !!dex && !!id && !!token?.max_supply,
    staleTime: 300000,
  });

  useQuery({
    queryKey: ["treasuryTokens", treasuryAddress, tokenPrice?.price],
    queryFn: () => fetchTreasuryTokens(treasuryAddress!, tokenPrice!.price),
    enabled: !!treasuryAddress && !!tokenPrice?.price,
    staleTime: 300000,
  });

  const isBasicLoading = isLoadingDAOByName || isLoadingToken;

  const enhancedMarketStats = useMemo(() => {
    const basePrice = tokenPrice?.price || 0;
    const baseMarketCap = tokenPrice?.marketCap || 0;
    const baseHolderCount = holdersData?.holderCount || 0;
    const maxSupply = token?.max_supply || 0;

    if (marketStats) {
      return {
        price: marketStats.price || basePrice,
        marketCap: marketStats.marketCap || baseMarketCap,
        treasuryBalance:
          marketStats.treasuryBalance || maxSupply * 0.8 * basePrice,
        holderCount: marketStats.holderCount || baseHolderCount,
      };
    }

    return {
      price: basePrice,
      marketCap: baseMarketCap,
      treasuryBalance: maxSupply * 0.8 * basePrice,
      holderCount: baseHolderCount,
    };
  }, [marketStats, tokenPrice, holdersData, token]);

  const totalProposals = useMemo(() => {
    return Array.isArray(proposals) ? proposals.length : 0;
  }, [proposals]);

  if (isBasicLoading || !dao) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isBasicLoading ? "Loading DAO..." : "DAO Not Found"}
            </h1>
            <p className="max-w-md text-muted-foreground">
              {isBasicLoading
                ? "Please wait while we fetch the DAO details."
                : "The DAO you're looking for doesn't exist or has been removed."}
            </p>
          </div>
          {isBasicLoading && <Loader />}
        </div>
      </main>
    );
  }

  const navItems = [
    {
      href: `/daos/${encodedName}`,
      label: "Contributions",
      icon: FileText,
      isActive: pathname === `/daos/${encodedName}`,
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/charter`,
      label: "Charter",
      icon: BarChart3,
      isActive: pathname.startsWith(`/daos/${encodedName}/charter`),
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/holders`,
      label: "Holders",
      icon: Users,
      isActive: pathname === `/daos/${encodedName}/holders`,
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/extension`,
      label: "Extensions",
      icon: FileText,
      isActive: pathname === `/daos/${encodedName}/extension`,
      disabled: false,
    },
  ];

  const defaultTabValue =
    navItems.find((item) => item.isActive)?.href || `/daos/${encodedName}`;

  return (
    <div className="flex flex-col h-screen w-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0 rounded-lg">
              <AvatarImage
                src={
                  token?.image_url ||
                  "/placeholder.svg?height=64&width=64&query=DAO logo"
                }
                alt={dao.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground text-2xl rounded-lg">
                {dao.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl text-white">{dao.name}</h1>
              <p className="text-zinc-400 mt-2 text-sm">
                {extractMission(dao.mission)}
              </p>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
            <div className="bg-muted/30 rounded-md p-2 flex items-center justify-center text-center">
              <div className="min-w-0 flex items-center justify-center text-center text-base truncate">
                <span className="text-xs">Price: </span>
                {formatTokenPrice(enhancedMarketStats.price)}
              </div>
            </div>
            <div className="bg-muted/30 rounded-md p-2 flex items-center justify-center text-center">
              <div className="min-w-0 flex items-center justify-center text-center text-base truncate">
                <span className="text-xs">Market Cap: </span>$
                {formatNumber(enhancedMarketStats.marketCap)}
              </div>
            </div>
            <div className="bg-muted/30 rounded-md p-2 flex items-center justify-center text-center">
              <div className="min-w-0 flex items-center justify-center text-center">
                <div className="text-xs">
                  Holders: {Math.floor(enhancedMarketStats.holderCount)}
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-md p-2 flex items-center justify-center text-center">
              <div className="min-w-0 flex items-center justify-center text-center text-base truncate">
                <span className="text-xs">Contributions: </span>
                {totalProposals}
              </div>
            </div>
          </div>

          {/* Two-column grid layout with viewport calculations */}
          <div
            className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-7 items-start"
            style={
              {
                "--header-height": "96px",
                "--tabs-height": "60px",
                "--vertical-gap": "24px",
                "--submit-cta-height": "56px",
                "--cta-spacing": "16px",
                "--available-height":
                  "calc(100dvh - var(--header-height) - var(--tabs-height) - var(--vertical-gap) - 120px)",
              } as React.CSSProperties
            }
          >
            {/* Left column - Submit Contribution */}
            <div className="order-2 lg:order-1">
              <ProposalSubmission
                daoId={dao.id}
                daoName={dao.name}
                headerOffset={96}
              />
            </div>

            {/* Right column - Buy Panel */}
            <div className="order-1 lg:order-2">
              <BitcoinDeposit
                dexId={1}
                dexContract={dexContract || ""}
                daoName={dao.name}
                tokenContract={dexContract || ""}
                headerOffset={96}
              />
            </div>
          </div>

          {/* Tabs outside the grid */}
          <Tabs
            defaultValue={defaultTabValue}
            value={pathname}
            className="w-full mt-0.5"
          >
            <TabsList className="grid w-full grid-cols-4 h-auto mb-3 sticky bottom-0 bg-muted/95  mt-0 backdrop-blur-sm ">
              {navItems.map((item) => (
                <TabsTrigger
                  key={item.label}
                  value={item.href}
                  asChild
                  disabled={item.disabled}
                >
                  <Link
                    href={item.disabled ? "#" : item.href}
                    className="flex items-center justify-center gap-2 py-2 px-4"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={`/daos/${encodedName}`} className="mt-0">
              {children}
            </TabsContent>
            <TabsContent
              value={`/daos/${encodedName}/charter`}
              className="mt-0"
            >
              {children}
            </TabsContent>
            <TabsContent
              value={`/daos/${encodedName}/holders`}
              className="mt-0"
            >
              {children}
            </TabsContent>
            <TabsContent
              value={`/daos/${encodedName}/extension`}
              className="mt-0"
            >
              {children}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
