"use client";

import type React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Building2,
  FileText,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
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
import { Loader } from "@/components/reusables/Loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProposalSubmission } from "../proposals/ProposalSubmission";
import { MissionContent } from "@/components/daos/MissionContent";
import DAOExtensions from "@/components/daos/DaoExtensions";
import DAOHolders from "@/components/daos/DaoHolders";
import { extractMission, formatTokenPrice } from "@/utils/format";
import BitcoinDeposit from "@/components/btc-deposit";
import { formatNumber } from "@/utils/format";

export function DAOPage({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const encodedName = params.name as string;

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("charter");

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

  const { dex, treasuryAddress, dexContract, tokenContract } = useMemo(() => {
    if (!extensions)
      return {
        dex: undefined,
        treasuryAddress: undefined,
        dexContract: null,
        tokenContract: null,
      };
    const dexExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
    );
    const tokenExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
    );
    const dexPrincipal = dexExtension?.contract_principal;
    const tokenPrincipal = tokenExtension?.contract_principal;
    console.log(dexPrincipal);

    // const dexPrincipal =
    //   "SP2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5E4R0JRM.beast2-faktory-dex";
    return {
      dex: dexPrincipal,
      treasuryAddress: extensions.find((ext) => ext.type === "aibtc-treasury")
        ?.contract_principal,
      dexContract: dexPrincipal,
      tokenContract: tokenPrincipal,
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

  // Expandable tabs data
  const expandableTabs = [
    {
      id: "charter",
      label: "Charter",
      icon: BarChart3,
      href: `/daos/${encodedName}/charter`,
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: FileText,
      href: `/daos/${encodedName}/extension`,
    },
    {
      id: "holders",
      label: "Holders",
      icon: Users,
      href: `/daos/${encodedName}/holders`,
    },
  ];

  // Handle modal open
  const handleModalOpen = () => {
    setIsModalOpen(true);
    setActiveTab("charter"); // Default to charter when opening
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-6 lg:px-8 py-4  max-w-screen-xl mx-auto">
          <div className="bg-muted/10 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-4 mb-4">
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
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl text-white">{dao.name}</h1>
                    <p className="text-zinc-400 mt-2 text-sm">
                      <span className="font-bold"> Mission: </span>
                      {extractMission(dao.mission)}
                    </p>
                  </div>
                  <Button
                    onClick={handleModalOpen}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Details
                  </Button>
                </div>
              </div>
            </div>

            {/* Token Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">
                  {formatTokenPrice(enhancedMarketStats.price)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="text-muted-foreground">Market Cap:</span>
                <span className="font-medium">
                  ${formatNumber(enhancedMarketStats.marketCap)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-muted-foreground">Holders:</span>
                <span className="font-medium">
                  {Math.floor(enhancedMarketStats.holderCount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-400" />
                <span className="text-muted-foreground">Contributions:</span>
                <span className="font-medium">{totalProposals}</span>
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
                tokenContract={tokenContract || ""}
                headerOffset={96}
              />
            </div>
          </div>

          {/* Contributions Content */}
          <div className="mt-6">{children}</div>

          {/* Modal Dialog */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {dao.name} Details
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="h-full flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
                    {expandableTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex items-center justify-center gap-2   data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <tab.icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="charter" className="mt-0 h-full">
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {dao ? (
                          <MissionContent description={dao.description} />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="extensions" className="mt-0 h-full">
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {extensions ? (
                          <DAOExtensions extensions={extensions} />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="holders" className="mt-0 h-full">
                      <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {holdersData && token ? (
                          <DAOHolders
                            holders={holdersData.holders || []}
                            tokenSymbol={token.symbol || ""}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader />
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
