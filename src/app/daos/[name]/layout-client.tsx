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
  // ChevronDown,
  // ChevronUp,
  Info,
  Wallet,
  CoinsIcon as CoinIcon,
  Building2,
  Users2,
  FileText,
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
} from "@/queries/dao-queries";
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
import { FormatMission } from "@/helpers/format-mission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DAOSendProposal } from "@/components/daos/proposal/dao-send-proposal-updated";
// import { DAOChatButton } from "@/components/daos/dao-chat-button";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const encodedName = params.name as string;
  const pathname = usePathname();
  // const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!dao) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <p className="text-xl font-medium text-muted-foreground">
            DAO not found
          </p>
          <p className="text-base text-muted-foreground/60">
            The DAO you&apos;re looking for doesn&apos;t exist or has been
            removed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full py-2 flex-grow">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm sm:text-base text-muted-foreground mb-2 px-4">
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

        {/* DAO Header - Grid layout with metrics on the right */}
        <div className="mb-4 px-4">
          <div className="grid grid-cols-1 gap-6 items-start">
            {/* Left column: DAO Info */}
            <div className="flex items-start gap-3">
              {/* Token Image - Increased size */}
              {token?.image_url && (
                <div className="flex flex-col gap-2">
                  <div className="relative w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden border border-border shadow-sm">
                    <Image
                      src={token.image_url || "/placeholder.svg"}
                      alt={`${dao?.name} token`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80px, 128px"
                      priority
                    />
                  </div>

                  {/* Mission Dialog directly below image */}
                  {dao?.mission && (
                    <Dialog
                      open={missionModalOpen}
                      onOpenChange={setMissionModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="border-none">
                          <Info className="h-4 w-4 mr-1.5" />
                          <span className="text-base">View Mission</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">
                            {dao.name} Mission
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <FormatMission content={dao.mission} inline={false} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}

              {/* DAO Info - Horizontal layout */}
              <div className="flex-1">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {dao?.name}
                    </h1>
                  </div>

                  {dao?.mission && (
                    <div className="text-lg text-muted-foreground line-clamp-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="cursor-pointer">
                              <FormatMission
                                content={dao.mission}
                                inline={true}
                              />
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm">
                            <p className="text-sm">
                              <FormatMission
                                content={dao.mission}
                                inline={true}
                              />
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Improved Action Buttons Layout */}
                  <div className="flex flex-col space-y-3 pt-1">
                    {/* <div className="flex items-center gap-3">
                      <DAOChatButton daoId={id!} />
                    </div> */}

                    {/* Send Proposal moved to bottom */}

                    {/* Key Metrics - Moved below SendProposal */}
                    <div className="mt-4">
                      {isOverviewLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton
                              key={i}
                              className="h-12 w-full rounded-md"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          <div className="bg-zinc-900 rounded-md p-2 flex flex-col justify-between h-full ">
                            <div className="flex items-center">
                              <CoinIcon className="h-4 w-4 text-zinc-400 mr-1" />
                              <span className="text-sm text-zinc-400">
                                Token Price
                              </span>
                            </div>
                            <span className="text-base font-medium">
                              {formatNumber(enhancedMarketStats.price, true)}
                            </span>
                          </div>

                          <div className="bg-zinc-900 rounded-md p-2 flex flex-col justify-between h-full ">
                            <div className="flex items-center">
                              <Wallet className="h-4 w-4 text-zinc-400 mr-1" />
                              <span className="text-sm text-zinc-400">
                                Market Cap
                              </span>
                            </div>
                            <span className="text-base font-medium">
                              {formatNumber(enhancedMarketStats.marketCap)}
                            </span>
                          </div>

                          <div className="bg-zinc-900 rounded-md p-2 flex flex-col justify-between h-full ">
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-zinc-400 mr-1" />
                              <span className="text-sm text-zinc-400">
                                Treasury
                              </span>
                            </div>
                            <span className="text-base font-medium">
                              {formatNumber(
                                enhancedMarketStats.treasuryBalance
                              )}
                            </span>
                          </div>

                          <div className="bg-zinc-900 rounded-md p-2 flex flex-col justify-between h-full ">
                            <div className="flex items-center">
                              <Users2 className="h-4 w-4 text-zinc-400 mr-1" />
                              <span className="text-sm text-zinc-400">
                                Holders
                              </span>
                            </div>
                            <span className="text-base font-medium">
                              {enhancedMarketStats.holderCount.toLocaleString()}
                            </span>
                          </div>

                          <div className="bg-zinc-900 rounded-md p-2 flex flex-col justify-between h-full ">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 text-zinc-400 mr-1" />
                              <span className="text-sm text-zinc-400">
                                Proposals
                              </span>
                            </div>
                            <span className="text-base font-medium">
                              {totalProposals}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <DAOSendProposal daoId={id!} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About section - Improved with card styling */}

        {/* {dao.description && (
          <div className="space-y-2 rounded-lg border bg-background/50 backdrop-blur-sm p-4 mb-4 mx-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">About</h3>
              {dao.description.length > 200 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="text-sm h-8 px-2"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Show Less <ChevronUp className="ml-1 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show More <ChevronDown className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <p
              className={`text-muted-foreground text-base leading-relaxed ${
                !isDescriptionExpanded && dao.description.length > 200
                  ? "line-clamp-3"
                  : ""
              }`}
            >
              {dao.description}
            </p>
          </div>
        )} */}

        {/* Navigation Tabs - Mobile */}
        <div className="block sm:hidden overflow-x-auto mb-4 px-4 sticky top-0 z-10 bg-background pt-2 border-b">
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
                <span className="text-sm font-medium">Proposals</span>
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
                <span className="text-sm font-medium">Extensions</span>
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
                <span className="text-sm font-medium">Holders</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden sm:flex mb-4 px-4 sticky top-0 z-10 pt-2 bg-background border-b">
          <Link href={`/daos/${encodedName}`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isProposals
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span className="text-base font-medium">Proposals</span>
            </div>
          </Link>
          <Link href={`/daos/${encodedName}/extensions`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isExtensions
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }`}
            >
              <Blocks className="h-4 w-4" />
              <span className="text-base font-medium">Extensions</span>
            </div>
          </Link>
          <Link href={`/daos/${encodedName}/holders`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isHolders
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground transition-colors"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-base font-medium">Holders</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <main className="w-full mb-6 px-4">{children}</main>

        {/* Treasury Holdings - Improved styling */}
        {!isOverviewLoading && treasuryTokens && treasuryTokens.length > 0 && (
          <div className="space-y-3 mb-6 px-4">
            <h3 className="text-base font-medium">Treasury Holdings</h3>
            <div className="rounded-lg border bg-background/50 backdrop-blur-sm overflow-x-auto shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] sm:w-[100px] text-base">
                      Type
                    </TableHead>
                    <TableHead className="text-base">Name</TableHead>
                    <TableHead className="text-base">Symbol</TableHead>
                    <TableHead className="text-right text-base">
                      Amount
                    </TableHead>
                    {treasuryTokens.some((token) => token.value > 0) && (
                      <TableHead className="text-right text-base">
                        Value
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treasuryTokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium whitespace-nowrap py-2 text-base">
                        {token.type}
                      </TableCell>
                      <TableCell className="max-w-[120px] sm:max-w-none truncate py-2 text-base">
                        {token.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap py-2 text-base">
                        {token.symbol}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap py-2 text-base">
                        {formatNumber(token.amount)}
                      </TableCell>
                      {treasuryTokens.some((token) => token.value > 0) && (
                        <TableCell className="text-right whitespace-nowrap py-2 text-base">
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
          <div className="text-center text-sm text-muted-foreground mt-6">
            <DAOCreationDate createdAt={dao.created_at} />
          </div>
        )}
      </div>
    </div>
  );
}
