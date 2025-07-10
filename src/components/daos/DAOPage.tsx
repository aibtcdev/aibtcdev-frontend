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
  Activity,
  TrendingUp,
  Home,
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
import { CompactMetrics } from "@/components/daos/MetricsGrid";
import { Separator } from "@/components/ui/separator";
import { ApproveAssetButton } from "../account/ApproveAsset";
import { useAuth } from "@/hooks/useAuth"; // Add this import

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
        <AvatarImage src={token?.image_url} alt={dao.name} />
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

// Re-integrating DAONavigation
function DAONavigation({
  daoName,
  pathname,
}: {
  daoName: string;
  pathname: string;
}) {
  const navItems = [
    {
      href: `/daos/${daoName}`,
      label: "Contributions",
      icon: FileText,
      isActive: pathname === `/daos/${daoName}`,
    },
    {
      href: `/daos/${daoName}/holders`,
      label: "Holders",
      icon: Users,
      isActive: pathname === `/daos/${daoName}/holders`,
    },
    {
      href: `/daos/${daoName}/about`,
      label: "About",
      icon: BarChart3,
      isActive:
        pathname.startsWith(`/daos/${daoName}/about`) ||
        pathname.startsWith(`/daos/${daoName}/mission`),
    },
    {
      href: `/daos/${daoName}/activity`,
      label: "Activity",
      icon: Activity,
      disabled: true,
    },
    {
      href: `/daos/${daoName}/analytics`,
      label: "Analytics",
      icon: TrendingUp,
      disabled: true,
    },
  ];

  return (
    <nav className="flex flex-col gap-2 p-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.disabled ? "#" : item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              item.isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.disabled && (
              <div className="ml-auto px-2 py-1 text-xs leading-none bg-muted/80 text-foreground/70 rounded-md border border-border/50">
                Soon
              </div>
            )}
          </Link>
        );
      })}
    </nav>
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

  const metricsData = {
    price: enhancedMarketStats.price,
    marketCap: enhancedMarketStats.marketCap,
    holderCount: enhancedMarketStats.holderCount,
    proposalCount: totalProposals,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      <aside className="w-full md:w-[280px] flex-shrink-0 bg-card/40 md:flex md:flex-col">
        <DAOSidebarHeader dao={dao} token={token} />
        <ScrollArea className="flex-1 hidden md:block">
          <div className="flex h-full flex-col justify-between p-2">
            <div className="space-y-4 py-2">
              <div className="px-2">
                <DAOBuyToken daoId={dao.id} daoName={dao.name} />
              </div>
              {userAgent?.account_contract && votingExt?.contract_principal ? (
                <div className="px-2">
                  <ApproveAssetButton
                    agentAccountContract={userAgent.account_contract}
                    contractToApprove={votingExt.contract_principal}
                    onSuccess={() => {
                      console.log("Proposal contract approved");
                    }}
                  />
                </div>
              ) : null}
              <DAONavigation daoName={encodedName} pathname={pathname} />
            </div>
            <div className="space-y-2 px-2">
              <h3 className="px-2 text-sm font-semibold text-foreground/80">
                Quick Stats
              </h3>
              <CompactMetrics data={metricsData} isLoading={isBasicLoading} />
            </div>
          </div>
        </ScrollArea>
        <div className="hidden md:block">
          <Separator className="bg-border/60" />
          <div className="p-4">
            <Link
              href="/daos"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Back to DAOs</span>
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
