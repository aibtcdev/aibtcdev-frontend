"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  PlusCircle,
  BarChart3,
} from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DAOBuyToken } from "@/components/daos/DaoBuyToken";

interface DAOInfo {
  id: string;
  name: string;
  description?: string;
}

interface TokenInfo {
  image_url?: string;
  max_supply?: number;
}

interface MarketStats {
  price: number;
  marketCap: number;
  holderCount: number;
}

interface DAOLayoutProps {
  children: React.ReactNode;
  dao?: DAOInfo;
  token?: TokenInfo;
  marketStats: MarketStats;
  proposalCount: number;
  isLoading: boolean;
  daoName: string;
}

export function DAOLayout({
  children,
  dao,
  token,
  marketStats,
  proposalCount,
  isLoading,
  daoName,
}: DAOLayoutProps) {
  const pathname = usePathname();

  if (isLoading || !dao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <Loader />
            <p className="text-muted-foreground">
              {!dao ? "DAO not found..." : "Loading DAO..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!dao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-muted/50">
              <Building2 className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                DAO Not Found
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                The DAO you&apos;re looking for doesn&apos;t exist or has been
                removed from our platform
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const daoStats = [
    {
      label: "Price",
      value: `$${marketStats.price.toFixed(2)}`,
      icon: DollarSign,
      change: null,
    },
    {
      label: "Market Cap",
      value: `$${marketStats.marketCap.toFixed(2)}`,
      icon: TrendingUp,
      change: null,
    },
    {
      label: "Holders",
      value: marketStats.holderCount,
      icon: Users,
      change: "+2",
    },
    {
      label: "Proposals",
      value: proposalCount,
      icon: FileText,
      change: "+3",
    },
  ];

  const isHolders = pathname === `/daos/${daoName}/holders`;
  const isAbout = pathname.startsWith(`/daos/${daoName}/about`);
  const isMission = pathname.startsWith(`/daos/${daoName}/mission`);

  let activeTab = "proposals";
  if (isHolders) activeTab = "holders";
  if (isAbout || isMission) activeTab = "about";

  return (
    <div className="min-h-screen">
      <div className="bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={token?.image_url} alt={dao.name} />
                <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                  {dao.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {dao.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="bg-success/10 text-success border-success/20"
                  >
                    <div className="w-1.5 h-1.5 bg-success rounded-full mr-1"></div>
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            <DAOBuyToken daoId={dao.id} daoName={dao.name} />
          </div>

          {/* {dao.description && (
            <div className="mt-4 text-muted-foreground whitespace-pre-wrap">
              {dao.description}
            </div>
          )} */}

          <div className="grid grid-cols-4 md:grid-cols-4 gap-6 mt-6">
            {daoStats.map((stat, index) => (
              <Card
                key={index}
                className="bg-background border-muted/50 border-1"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-xl font-semibold text-foreground">
                          {stat.value}
                        </p>
                        {stat.change && (
                          <p className="text-xs text-success">{stat.change}</p>
                        )}
                      </div>
                    </div>
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={activeTab} className="space-y-6">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger
              value="proposals"
              asChild
              className="data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Link
                href={`/daos/${daoName}`}
                className="flex items-center space-x-2 pb-2"
              >
                <FileText className="w-4 h-4" />
                <span>Proposals</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="holders"
              asChild
              className="data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Link
                href={`/daos/${daoName}/holders`}
                className="flex items-center space-x-2 pb-2"
              >
                <Users className="w-4 h-4" />
                <span>Holders</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger
              value="about"
              asChild
              className="data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Link
                href={`/daos/${daoName}/about`}
                className="flex items-center space-x-2 pb-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>About</span>
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>{children}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
