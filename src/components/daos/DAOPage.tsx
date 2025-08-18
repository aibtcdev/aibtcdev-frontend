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
import { extractMission } from "@/utils/format";
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
        <div className="flex flex-col items-center gap-4 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0 rounded-none">
                  <AvatarImage
                    src={
                      token?.image_url ||
                      "/placeholder.svg?height=64&width=64&query=DAO logo"
                    }
                    alt={dao.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-foreground text-2xl rounded-none">
                    {dao.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {dao.name}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {extractMission(dao.mission)}
                  </p>
                </div>
              </div>

              <div className="w-full bg-muted rounded-lg">
                <div className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                  <div className="flex items-center justify-center gap-2 py-2 px-4">
                    <span className="text-xs font-medium text-white">
                      Price
                    </span>
                    <span className="text-lg font-bold text-white">
                      ${enhancedMarketStats.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-4">
                    <span className="text-xs font-medium text-white">
                      Market Cap
                    </span>
                    <span className="text-lg font-bold text-white">
                      ${formatNumber(enhancedMarketStats.marketCap)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-4">
                    <span className="text-xs font-medium text-white">
                      Holders
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatNumber(enhancedMarketStats.holderCount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 px-4">
                    <span className="text-xs font-medium text-white">
                      Contributions
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatNumber(totalProposals)}
                    </span>
                  </div>
                </div>
              </div>
              <ProposalSubmission daoId={dao.id} />
            </div>
            <div className="lg:col-span-1">
              {dexContract && (
                <BitcoinDeposit
                  dexContract={dexContract}
                  tokenContract={dexContract}
                  daoName={dao.name}
                  dexId={1}
                />
              )}
            </div>
          </div>

          <Tabs
            defaultValue={defaultTabValue}
            value={pathname}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 h-auto mb-6">
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
