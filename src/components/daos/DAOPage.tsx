"use client";

import type React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Building2,
  FileText,
  Users,
  BarChart3,
  Home,
  Plus,
} from "lucide-react";
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
import { fetchAgents } from "@/services/agent.service";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/reusables/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DAOBuyToken } from "@/components/daos/DaoBuyToken";
import { Separator } from "@/components/ui/separator";
import { ApproveContractButton } from "@/components/account/ApproveContract";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProposalSubmission } from "../proposals/ProposalSubmission";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Re-integrating DAOSidebarHeader
function DAOSidebarHeader({
  dao,
  token,
}: {
  dao: { id: string; name: string };
  token?: { image_url?: string };
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <Avatar className="h-10 w-10 border-2 border-primary/20 flex-shrink-0">
        <AvatarImage
          src={
            token?.image_url ||
            "/placeholder.svg?height=40&width=40&query=DAO logo"
          }
          alt={dao.name}
        />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 font-bold text-foreground">
          {dao.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-foreground truncate">
          {dao.name}
        </h2>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-xs text-success font-medium">Active</span>
        </div>
      </div>
    </div>
  );
}

export function DAOPage({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const encodedName = params.name as string;

  // Get auth data
  const { userId } = useAuth();

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAOByName } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000, // 10 minutes
  });

  const id = dao?.id;

  // Fetch agents data
  const { data: agents } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Fetch token data
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  // Fetch extensions data
  const { data: extensions } = useQuery({
    queryKey: ["extensions", id],
    queryFn: () => fetchDAOExtensions(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  const { dex, treasuryAddress } = useMemo(() => {
    if (!extensions) return { dex: undefined, treasuryAddress: undefined };
    return {
      dex: extensions.find((ext) => ext.type === "dex")?.contract_principal,
      treasuryAddress: extensions.find((ext) => ext.type === "aibtc-treasury")
        ?.contract_principal,
    };
  }, [extensions]);

  // Fetch token price
  const { data: tokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
    staleTime: 300000,
  });

  // Fetch holders data
  const { data: holdersData } = useQuery({
    queryKey: ["holders", id],
    queryFn: () => fetchHolders(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  // Fetch proposals
  const { data: proposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id!),
    enabled: !!id,
    staleTime: 600000,
  });

  // Fetch market stats
  const { data: marketStats } = useQuery({
    queryKey: ["marketStats", id, dex, token?.max_supply],
    queryFn: () => fetchMarketStats(dex!, id!, token!.max_supply || 0),
    enabled: !!dex && !!id && !!token?.max_supply,
    staleTime: 300000,
  });

  // Fetch treasury tokens
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

  // Get the user's agent account contract
  const userAgent = useMemo(() => {
    if (!agents || !userId) return undefined;
    return agents.find((a) => a.profile_id === userId);
  }, [agents, userId]);

  // Get the voting extension contract to approve
  const votingExt = useMemo(() => {
    if (!extensions) return undefined;
    return extensions.find(
      (ext) =>
        ext.type === "EXTENSIONS" && ext.subtype === "ACTION_PROPOSAL_VOTING"
    );
  }, [extensions]);

  // Define navigation items for horizontal tabs in the new order
  const navItems = [
    {
      href: `/daos/${encodedName}`, // Default path for contributions
      label: "Contributions",
      icon: FileText,
      isActive: pathname === `/daos/${encodedName}`,
      count: totalProposals,
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/about`,
      label: "About",
      icon: BarChart3,
      isActive:
        pathname.startsWith(`/daos/${encodedName}/about`) ||
        pathname.startsWith(`/daos/${encodedName}/mission`),
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/holders`,
      label: "Holders",
      icon: Users,
      isActive: pathname === `/daos/${encodedName}/holders`,
      count: enhancedMarketStats.holderCount,
      disabled: false,
    },
    {
      href: `/daos/${encodedName}/price`,
      label: "Price",
      icon: FileText, // Using FileText for price, can be changed
      isActive: pathname === `/daos/${encodedName}/price`,
      disabled: true,
    },
    {
      href: `/daos/${encodedName}/marketcap`,
      label: "Market Cap",
      icon: BarChart3, // Using BarChart3 for market cap, can be changed
      isActive: pathname === `/daos/${encodedName}/marketcap`,
      disabled: true,
    },
  ];

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  // Determine the default active tab based on the current pathname
  // If the current path is not explicitly a tab, default to the Contributions tab's path
  const defaultTabValue =
    navItems.find((item) => item.isActive)?.href || `/daos/${encodedName}`;

  return (
    <div className="flex flex-col h-screen w-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-screen-xl mx-auto">
          {" "}
          {/* Added max-w-screen-xl and mx-auto */}
          {/* DAO Name and Mission */}
          <div className="mb-6 flex items-center gap-4">
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
              <h1 className="text-3xl font-bold text-foreground">{dao.name}</h1>
              <p className="text-muted-foreground mt-2">
                A decentralized autonomous organization focused on
                community-driven initiatives and innovation.
              </p>
            </div>
          </div>
          {/* Horizontal Tabs for Navigation and Content */}
          <Tabs
            defaultValue={defaultTabValue}
            value={pathname}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5 h-auto mb-6">
              {" "}
              {/* Added mb-6 for spacing */}
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
                    {item.count !== undefined && (
                      <Badge
                        variant="secondary"
                        className="ml-1 hidden sm:inline-flex"
                      >
                        {formatNumber(item.count)}
                      </Badge>
                    )}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tabs Content for Contributions */}
            <TabsContent value={`/daos/${encodedName}`} className="mt-0">
              {/* Proposal Submission - Visible only when Contributions tab is active */}
              <div className="mb-6">
                <ProposalSubmission daoId={dao.id} />
              </div>
              {children} {/* This will render the Contributions page content */}
            </TabsContent>

            {/* Tabs Content for About */}
            <TabsContent value={`/daos/${encodedName}/about`} className="mt-0">
              {children} {/* This will render the About page content */}
            </TabsContent>

            {/* Tabs Content for Holders */}
            <TabsContent
              value={`/daos/${encodedName}/holders`}
              className="mt-0"
            >
              {children} {/* This will render the Holders page content */}
            </TabsContent>

            {/* Tabs Content for Price */}
            <TabsContent value={`/daos/${encodedName}/price`} className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Price
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(enhancedMarketStats.price)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {/* Placeholder for daily change */}
                    {"+2.5% from yesterday"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tabs Content for Market Cap */}
            <TabsContent
              value={`/daos/${encodedName}/marketcap`}
              className="mt-0"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Market Cap
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(enhancedMarketStats.marketCap)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {/* Placeholder for daily change */}
                    {"+1.8% from last month"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          {/* Buy Token and Approve Contract - Commented out */}
          {/*          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <DAOBuyToken daoId={dao.id} daoName={dao.name} />
            {userAgent?.account_contract && votingExt?.contract_principal ? (
              <ApproveContractButton
                agentAccountContract={userAgent.account_contract}
                contractToApprove={votingExt.contract_principal}
                onSuccess={() => {
                  console.log("Proposal contract approved");
                }}
              />
            ) : null}
          </div>          */}
        </div>
      </main>
    </div>
  );
}
