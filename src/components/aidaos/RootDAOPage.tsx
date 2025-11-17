"use client";

import type React from "react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  Building2,
  FileText,
  Users,
  BarChart3,
  // DollarSign,
  // TrendingUp,
  // Bot,
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
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProposalSubmission } from "../proposals/ProposalSubmission";
import { MissionContent } from "@/components/aidaos/MissionContent";
import DAOExtensions from "@/components/aidaos/DaoExtensions";
import DAOHolders from "@/components/aidaos/DaoHolders";
// import { extractMission, formatTokenPrice } from "@/utils/format";
// import { formatNumber } from "@/utils/format";
import { hexToCV, cvToJSON } from "@stacks/transactions";
import Link from "next/link";
import { getStacksAddress } from "@/lib/address";
// import { useAgentAccount } from "@/hooks/useAgentAccount";
// import { BalanceDisplay } from "@/components/reusables/BalanceDisplay";
import { TwitterCard } from "@/components/twitter/TwitterCard";

// Network configuration
const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "mainnet";
const NETWORK_CONFIG = {
  HIRO_API_URL: isMainnet
    ? "https://api.hiro.so"
    : "https://api.testnet.hiro.so",
};

interface RootDAOPageProps {
  children: React.ReactNode;
  daoName: string;
}

export function RootDAOPage({ children, daoName }: RootDAOPageProps) {
  const encodedName = daoName;

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("charter");

  // State for Twitter preview
  // const [twitterUrl, setTwitterUrl] = useState("");

  // Agent account data
  // const { userAgentBalance } = useAgentAccount();

  // Helper function to get agent balance for specific DAO token
  // const getAgentTokenBalance = useCallback(
  //   (tokenContract: string | null | undefined): string => {
  //     if (!userAgentBalance || !tokenContract) return "0";

  //     // Look for the token in fungible_tokens using the contract principal
  //     const tokenKey = Object.keys(userAgentBalance.fungible_tokens).find(
  //       (key) => key.includes(tokenContract)
  //     );

  //     if (tokenKey && userAgentBalance.fungible_tokens[tokenKey]) {
  //       const balance = userAgentBalance.fungible_tokens[tokenKey].balance;
  //       return balance;
  //     }

  //     return "0";
  //   },
  //   [userAgentBalance]
  // );

  // Helper function to check if the token is bonded
  const checkBonded = useCallback(
    async (dexContract: string): Promise<boolean | null> => {
      if (!dexContract) return null;

      const senderAddress =
        getStacksAddress() || "SP2Z94F6QX847PMXTPJJ2ZCCN79JZDW3PJ4E6ZABY";
      const [contractAddress, contractName] = dexContract.split(".");

      try {
        const url = `${NETWORK_CONFIG.HIRO_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/get-bonded?tip=latest`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: senderAddress,
            arguments: [],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data?.result) {
          try {
            const clarityValue = hexToCV(data.result);
            const jsonValue = cvToJSON(clarityValue);
            return jsonValue.value?.value === true;
          } catch (error) {
            console.error("Error parsing bonded status:", error);
            return null;
          }
        }
        return null;
      } catch (error) {
        console.error("Error fetching bonded status:", error);
        return null;
      }
    },
    []
  );

  // Helper function to check if the market is open
  const checkMarketOpen = useCallback(
    async (prelaunchContract: string): Promise<boolean | null> => {
      if (!prelaunchContract) return null;

      const senderAddress =
        getStacksAddress() || "SP2Z94F6QX847PMXTPJJ2ZCCN79JZDW3PJ4E6ZABY";
      const [contractAddress, contractName] = prelaunchContract.split(".");

      try {
        const url = `${NETWORK_CONFIG.HIRO_API_URL}/v2/contracts/call-read/${contractAddress}/${contractName}/is-market-open?tip=latest`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: senderAddress,
            arguments: [],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data?.okay && data?.result) {
          const clarityValue = hexToCV(data.result);
          const jsonValue = cvToJSON(clarityValue);
          return jsonValue.value?.value === true;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

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

  const {
    dex,
    treasuryAddress,
    dexContract,
    // tokenContract,
    prelaunchContract,
    buyPrelaunchContract,
  } = useMemo(() => {
    if (!extensions)
      return {
        dex: undefined,
        treasuryAddress: undefined,
        dexContract: null,
        tokenContract: null,
        prelaunchContract: null,
        buyPrelaunchContract: null,
        poolContract: null,
        bitflowAdapter: null,
        bitflowPool: null,
      };

    console.log("All extensions:", extensions);

    const dexExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "DEX"
    );
    const tokenExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "DAO"
    );
    const prelaunchExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "PRELAUNCH"
    );
    const buyPrelaunchExtension = extensions.find(
      (ext) =>
        ext.type === "TRADING" && ext.subtype === "FAKTORY_BUY_AND_DEPOSIT"
    );
    const poolExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "POOL"
    );

    // Bitflow contract extensions
    const bitflowAdapterExtension = extensions.find(
      (ext) =>
        ext.type === "TRADING" && ext.subtype === "BITFLOW_BUY_AND_DEPOSIT"
    );
    const bitflowPoolExtension = extensions.find(
      (ext) => ext.type === "TOKEN" && ext.subtype === "POOL"
    );

    const dexPrincipal = dexExtension?.contract_principal;
    const tokenPrincipal = tokenExtension?.contract_principal;
    const prelaunchPrincipal = prelaunchExtension?.contract_principal;
    const buyPrelaunchPrincipal = buyPrelaunchExtension?.contract_principal;
    const poolPrincipal = poolExtension?.contract_principal;
    const bitflowAdapterPrincipal = bitflowAdapterExtension?.contract_principal;
    const bitflowPoolPrincipal = bitflowPoolExtension?.contract_principal;

    return {
      dex: dexPrincipal,
      treasuryAddress: extensions.find((ext) => ext.type === "aibtc-treasury")
        ?.contract_principal,
      dexContract: dexPrincipal,
      tokenContract: tokenPrincipal,
      prelaunchContract: prelaunchPrincipal,
      buyPrelaunchContract: buyPrelaunchPrincipal,
      poolContract: poolPrincipal,
      bitflowAdapter: bitflowAdapterPrincipal,
      bitflowPool: bitflowPoolPrincipal,
    };
  }, [extensions]);

  // Check if token is bonded - NOW AFTER dexContract is defined
  const { data: isBonded } = useQuery({
    queryKey: ["bonded", dexContract],
    queryFn: () => checkBonded(dexContract!),
    enabled: !!dexContract,
    staleTime: 300000,
  });

  const { data: tokenPrice } = useQuery({
    queryKey: ["tokenPrice", dex],
    queryFn: () => fetchTokenPrice(dex!),
    enabled: !!dex,
    staleTime: 300000,
  });

  // Check if market is open
  const {
    data: isMarketOpen,
    error: marketOpenError,
    isLoading: isMarketOpenLoading,
  } = useQuery({
    queryKey: ["marketOpen", prelaunchContract],
    queryFn: () => checkMarketOpen(prelaunchContract!),
    enabled: !!prelaunchContract,
    staleTime: 300000,
  });

  console.log("Market open query status:");
  console.log("- prelaunchContract:", prelaunchContract);
  console.log("- isMarketOpen:", isMarketOpen);
  console.log("- marketOpenError:", marketOpenError);
  console.log("- isMarketOpenLoading:", isMarketOpenLoading);
  console.log("- isBonded:", isBonded);

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
    if (!Array.isArray(proposals)) return 0;
    return proposals.filter((proposal) => proposal.status === "DEPLOYED")
      .length;
  }, [proposals]);

  const passedProposals = useMemo(() => {
    if (!Array.isArray(proposals)) return 0;
    return proposals.filter((proposal) => proposal.passed === true).length;
  }, [proposals]);

  if (isBasicLoading || !dao) {
    return (
      <main className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {isBasicLoading ? "Loading..." : "Not Found"}
            </h1>
            <p className="max-w-md text-muted-foreground">
              {isBasicLoading
                ? "Please wait while we fetch the details."
                : "The item you're looking for doesn't exist or has been removed."}
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
      href: `/aidaos/${encodedName}/charter`,
    },
    {
      id: "extensions",
      label: "Extensions",
      icon: FileText,
      href: `/aidaos/${encodedName}/extension`,
    },
    {
      id: "holders",
      label: "Holders",
      icon: Users,
      href: `/aidaos/${encodedName}/holders`,
    },
  ];

  // Handle modal open
  // const handleModalOpen = () => {
  //   setIsModalOpen(true);
  //   setActiveTab("charter"); // Default to charter when opening
  // };

  return (
    <div className="flex flex-col w-full">
      <main className="overflow-y-auto overflow-x-hidden">
        <div className=" sm:px-6 lg:px-14 py-4  mx-auto w-full">
          <div className="bg-background p-4 sm:p-6 rounded-sm mb-6">
            {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 flex-shrink-0 rounded-sm">
                <AvatarImage
                  src={
                    token?.image_url ||
                    "/placeholder.svg?height=64&width=64&query=DAO logo"
                  }
                  alt={dao.name}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground text-xl sm:text-2xl rounded-sm">
                  {dao.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
                      {dao.name}
                    </h1>
                    <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                      <span className="font-bold"> Mission: </span>
                      {extractMission(dao.mission)}
                    </p>
                  </div>
                  <Button
                    onClick={handleModalOpen}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 text-sm self-start sm:self-auto"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Details
                  </Button>
                </div>
              </div>
            </div> */}

            {/* Token Stats - Responsive layout */}
            <div className="flex flex-wrap  items-stretch justify-stretch gap-6 sm:gap-8 lg:gap-44 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <span className="font-bold">Holders:</span>
                <span className="font-medium">
                  {Math.floor(enhancedMarketStats.holderCount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Submissions:</span>
                <span className="font-medium">{totalProposals}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Passed:</span>
                <span className="font-medium">{passedProposals}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Rewards:</span>
                <span className="font-medium">$4,005</span>
              </div>
            </div>
          </div>

          {/* Market Status - Fixed height to prevent layout shift */}
          <div className="mb-1 text-center min-h-[24px] flex items-center justify-center">
            {buyPrelaunchContract && isMarketOpen === false && (
              <p className="text-muted-foreground">
                Buy seats{" "}
                <Link
                  href={`/prelaunch/${encodedName}/${buyPrelaunchContract}`}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 hover:no-underline transition-colors"
                >
                  via prelaunch
                </Link>{" "}
                to participate when the market opens.
              </p>
            )}
          </div>

          {/* Two-column grid layout - Improved alignment and stability */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-7">
            {/* Left column - Submit Contribution */}
            <div className="order-2 lg:order-1">
              <ProposalSubmission
                daoId={dao.id}
                daoName={dao.name}
                headerOffset={96}
                // onTwitterUrlChange={setTwitterUrl}
              />
            </div>

            {/* Right column - Twitter Card */}
            <div className="order-1 lg:order-2">
              <TwitterCard
                name="AIBTC"
                username="aibtcdev"
                tweet={`AIBTC order update — proof of coffee ritual ☕

quote this post with:
1️⃣ a coffee selfie
2️⃣ tag a blue-check builder you respect
3️⃣ tell us what you've built today for bitcoin

submit daily at aibtc.com`}
                date="Nov 7, 2025"
                time="8:14 PM"
                avatarUrl="/logos/aibtcdev-avatar-250px.png"
                verified={true}
                link="https://x.com/aibtcdev/status/1985732853540470816"
                title="The Current Order"
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
                  <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/90">
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
