"use client";

import type React from "react";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Blocks,
  Users,
  Activity,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { BsGlobe, BsTwitterX, BsTelegram } from "react-icons/bs";
import {
  fetchToken,
  fetchDAOExtensions,
  fetchMarketStats,
  fetchTreasuryTokens,
  fetchTokenPrice,
  fetchHolders,
  fetchProposals,
  fetchDAOByName,
} from "@/queries/dao-queries";
import { DAOChatButton } from "@/components/daos/dao-chat-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAOCreationDate } from "@/components/daos/dao-creation-date";
import { Card, CardContent } from "@/components/ui/card";
import { FormatMission } from "@/helpers/format-mission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { DAOSendProposal } from "@/components/daos/proposal/dao-send-proposal";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const encodedName = params.name as string; // Changed from id to name
  const pathname = usePathname();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [missionModalOpen, setMissionModalOpen] = useState(false);

  // First, fetch the DAO by name to get its ID
  const { data: dao, isLoading: isLoadingDAOByName } = useQuery({
    queryKey: ["dao", encodedName],
    queryFn: () => fetchDAOByName(encodedName),
    staleTime: 600000, // 10 minutes
  });

  const id = dao?.id; // Get the ID from the fetched DAO

  // Determine which tab is active - update paths to use name instead of id
  const isProposals = pathname === `/daos/${encodedName}`;
  const isExtensions = pathname === `/daos/${encodedName}/extensions`;
  const isHolders = pathname === `/daos/${encodedName}/holders`;

  // Fetch token data - only if we have the DAO ID
  const { data: token, isLoading: isLoadingToken } = useQuery({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  // Fetch extensions data - only if we have the DAO ID
  const { data: extensions, isLoading: isLoadingExtensions } = useQuery({
    queryKey: ["extensions", id],
    queryFn: () => fetchDAOExtensions(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  const dex = extensions?.find((ext) => ext.type === "dex")?.contract_principal;
  const treasuryAddress = extensions?.find(
    (ext) => ext.type === "aibtc-treasury"
  )?.contract_principal;

  // Fetch token price
  const { data: tokenPrice, isLoading: isLoadingTokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
  });

  // Fetch holders data
  const { data: holdersData, isLoading: isLoadingHolders } = useQuery({
    queryKey: ["holders", token?.contract_principal, token?.symbol],
    queryFn: () => fetchHolders(token!.contract_principal, token!.symbol),
    enabled: !!token?.contract_principal && !!token?.symbol,
    staleTime: 600000, // 10 minutes
  });

  // Fetch proposals
  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals", id],
    queryFn: () => fetchProposals(id!),
    enabled: !!id, // Only run if we have the DAO ID
    staleTime: 600000, // 10 minutes
  });

  // Fetch market stats
  const { data: marketStats, isLoading: isLoadingMarketStats } = useQuery({
    queryKey: [
      "marketStats",
      id,
      dex,
      token?.contract_principal,
      token?.symbol,
      token?.max_supply,
    ],
    queryFn: () =>
      fetchMarketStats(
        dex!,
        token!.contract_principal,
        token!.symbol,
        token!.max_supply || 0
      ),
    enabled: !!dex && !!token && !!token.contract_principal && !!token.symbol,
  });

  // Fetch treasury tokens
  const { data: treasuryTokens, isLoading: isLoadingTreasuryTokens } = useQuery(
    {
      queryKey: ["treasuryTokens", treasuryAddress, tokenPrice?.price],
      queryFn: () => fetchTreasuryTokens(treasuryAddress!, tokenPrice!.price),
      enabled: !!treasuryAddress && !!tokenPrice,
    }
  );

  // Check if we're loading basic DAO info
  const isBasicLoading = isLoadingDAOByName || isLoadingToken;

  // Check if we're loading overview-specific data
  const isOverviewLoading =
    isLoadingExtensions ||
    isLoadingTokenPrice ||
    isLoadingMarketStats ||
    isLoadingTreasuryTokens ||
    isLoadingHolders ||
    isLoadingProposals;

  // Format number helper function
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

  // Create enhanced market stats
  const enhancedMarketStats = marketStats
    ? {
        ...marketStats,
        holderCount: holdersData?.holderCount || marketStats.holderCount,
      }
    : {
        price: tokenPrice?.price || 0,
        marketCap: tokenPrice?.marketCap || 0,
        treasuryBalance: token?.max_supply
          ? token.max_supply * 0.8 * (tokenPrice?.price || 0)
          : 0,
        holderCount: holdersData?.holderCount || 0,
      };

  // Calculate total proposals
  const totalProposals = proposals ? proposals.length : 0;

  if (isBasicLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">
            DAO not found
          </p>
          <p className="text-sm text-muted-foreground/60">
            The DAO you&apos;re looking for doesn&apos;t exist or has been
            removed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-6 flex-grow">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs sm:text-sm text-muted-foreground mb-6">
          <Link
            href="/daos"
            className="hover:text-foreground transition-colors"
          >
            DAOs
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-foreground font-medium truncate">
            {dao?.name || "Details"}
          </span>
        </nav>

        {/* DAO Header - Improved layout */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            {/* Token Image */}
            {token?.image_url && (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-border shadow-sm">
                <Image
                  src={token.image_url || "/placeholder.svg"}
                  alt={`${dao?.name} token`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, 128px"
                  priority
                />
              </div>
            )}

            {/* DAO Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {dao?.name}
                </h1>

                {/* Social links - Moved next to the title */}
                <div className="flex gap-3 justify-center sm:justify-start">
                  {dao.website_url && (
                    <a
                      href={dao.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Website"
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
                      aria-label="X (Twitter)"
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
                      aria-label="Telegram"
                    >
                      <BsTelegram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>

              {dao?.mission && (
                <div className="text-base sm:text-lg text-muted-foreground mb-4">
                  <p>
                    <FormatMission content={dao.mission} inline={true} />
                  </p>
                </div>
              )}

              <div className="space-y-2 space-x-2">
                {dao?.mission && (
                  <Dialog
                    open={missionModalOpen}
                    onOpenChange={setMissionModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Info className="h-3.5 w-3.5 mr-1" />
                        Show Mission
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {dao.name} Mission
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <FormatMission content={dao.mission} inline={false} />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* NO NEED TO FILTER IT OUT AS THE QUERY HANDLES AND FETCHES OUR REQURED DAO */}
                <DAOChatButton daoId={id!} />
                {/* <DAOSendProposal daoId={id!} /> */}
              </div>
            </div>
          </div>

          {/* Key Metrics - Card-based layout */}
          {isOverviewLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">
                    Token Price
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    {formatNumber(enhancedMarketStats.price, true)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">
                    Market Cap
                  </div>
                  <div className="text-xl font-semibold mt-1">
                    {formatNumber(enhancedMarketStats.marketCap)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Treasury</div>
                  <div className="text-xl font-semibold mt-1">
                    {formatNumber(enhancedMarketStats.treasuryBalance)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Holders</div>
                  <div className="text-xl font-semibold mt-1">
                    {enhancedMarketStats.holderCount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Proposals</div>
                  <div className="text-xl font-semibold mt-1">
                    {totalProposals}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* About section - Improved with card styling */}
        {dao.description && (
          <div className="space-y-4 rounded-lg border bg-background/50 backdrop-blur-sm p-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">About</h3>
              {dao.description.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
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
                !isDescriptionExpanded && dao.description.length > 200
                  ? "line-clamp-4"
                  : ""
              }`}
            >
              {dao.description}
            </p>
          </div>
        )}

        {/* Navigation Tabs - Mobile */}
        <div className="block sm:hidden border-b border-border overflow-x-auto mb-4">
          <div className="flex whitespace-nowrap">
            <Link href={`/daos/${encodedName}`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isProposals
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Proposals</span>
              </div>
            </Link>
            <Link href={`/daos/${encodedName}/extensions`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isExtensions
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Blocks className="h-4 w-4" />
                <span className="text-xs font-medium">Extensions</span>
              </div>
            </Link>
            <Link href={`/daos/${encodedName}/holders`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isHolders
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Holders</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden sm:flex border-b border-border mb-4">
          <Link href={`/daos/${encodedName}`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isProposals
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Proposals</span>
            </div>
          </Link>
          <Link href={`/daos/${encodedName}/extensions`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isExtensions
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Blocks className="h-4 w-4" />
              <span className="text-sm font-medium">Extensions</span>
            </div>
          </Link>
          <Link href={`/daos/${encodedName}/holders`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isHolders
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Holders</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <main className="w-full mb-8">{children}</main>

        {/* Treasury Holdings - Improved styling */}
        {!isOverviewLoading && treasuryTokens && treasuryTokens.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="text-base font-medium">Treasury Holdings</h3>
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

        {/* Creation Date - Better positioned */}
        {!isOverviewLoading && (
          <div className="text-center text-sm text-muted-foreground mt-8">
            <DAOCreationDate createdAt={dao.created_at} />
          </div>
        )}
      </div>
    </div>
  );
}
