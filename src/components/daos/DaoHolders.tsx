"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Copy,
  Check,
  ExternalLink,
  Star,
  AlertTriangle,
} from "lucide-react";
import { TokenBalance } from "@/components/reusables/BalanceDisplay";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { DAOTabLayout } from "@/components/daos/DAOTabLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClipboard } from "@/hooks/useClipboard";
import { useAgentAccount } from "@/hooks/useAgentAccount";
import { useWalletStore } from "@/store/wallet";
import { getExplorerLink } from "@/utils/format";
import { truncateAddress } from "@/utils/address-utils";
import {
  categorizeHolders,
  getSectionInfo,
  isUserWallet,
  isUserAgentAccount,
  type UserContext,
  type CategorizedHolders,
} from "@/utils/holder-categorization";

interface Holder {
  address: string;
  balance: string;
  percentage: number;
  value_usd?: string;
  last_transaction?: string;
}

interface DAOHoldersProps {
  holders: Holder[];
  tokenSymbol: string;
}

export default function DAOHolders({ holders, tokenSymbol }: DAOHoldersProps) {
  const { copyToClipboard, copiedText } = useClipboard();
  const { userAgentAddress } = useAgentAccount();
  const { userWallet } = useWalletStore();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Get user context for highlighting
  const userContext: UserContext = useMemo(() => {
    const connectedWallet =
      userWallet?.testnet_address || userWallet?.mainnet_address || null;
    return {
      connectedWallet,
      agentVotingAccount: userAgentAddress,
    };
  }, [userWallet, userAgentAddress]);

  // Categorize holders into sections
  const categorizedHolders: CategorizedHolders = useMemo(() => {
    return categorizeHolders(holders, userContext);
  }, [holders, userContext]);

  // const toolbar = (
  //   <div className="flex flex-col gap-4 sm:items-end">
  //     <div className="relative w-full max-w-sm">
  //       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  //       <Input
  //         placeholder="Search by address..."
  //         value={searchQuery}
  //         onChange={(e) => setSearchQuery(e.target.value)}
  //         className="pl-9"
  //       />
  //     </div>
  //     <Select value={sortBy} onValueChange={setSortBy}>
  //       <SelectTrigger className="w-[180px]">
  //         <div className="flex items-center gap-2">
  //           <ArrowUpDown className="h-4 w-4" />
  //           <SelectValue placeholder="Sort by" />
  //         </div>
  //       </SelectTrigger>
  //       <SelectContent>
  //         <SelectItem value="balance">Balance</SelectItem>
  //         <SelectItem value="percentage">Percentage</SelectItem>
  //       </SelectContent>
  //     </Select>
  //   </div>
  // );

  // Render a section of holders
  const renderHolderSection = (
    sectionKey: keyof CategorizedHolders,
    sectionHolders: Holder[],
    startIndex: number
  ) => {
    if (sectionHolders.length === 0) return null;

    const sectionInfo = getSectionInfo(sectionKey);

    return (
      <div key={sectionKey} className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">{sectionInfo.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {sectionInfo.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {sectionInfo.description}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {sectionHolders.length}{" "}
            {sectionHolders.length === 1 ? "holder" : "holders"}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">#</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectionHolders.map((holder, index) => {
                const isUserConnectedWallet = isUserWallet(holder, userContext);
                const isUserAgent = isUserAgentAccount(holder, userContext);
                const isHighlighted = isUserConnectedWallet || isUserAgent;

                return (
                  <TableRow
                    key={holder.address}
                    className={`hover:bg-accent/10 ${
                      isHighlighted
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    <TableCell className="pl-4 text-muted-foreground">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={isMobile ? "text-sm" : "break-all"}>
                            {truncateAddress(holder.address, isMobile)}
                          </span>
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1">
                          {isUserConnectedWallet && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                Your Wallet
                              </Badge>
                            </div>
                          )}
                          {isUserAgent && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs p-2">
                                Your Agent
                              </Badge>
                            </div>
                          )}
                          {isUserConnectedWallet && holder.percentage < 1 && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              <Badge
                                variant="destructive"
                                className="text-xs px-1 py-0"
                              >
                                Consider depositing more!
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <TokenBalance
                        value={holder.balance}
                        symbol={tokenSymbol}
                        variant="rounded"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {holder.percentage.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(holder.address)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedText === holder.address ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <a
                            href={getExplorerLink("address", holder.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <DAOTabLayout
      title="Token Holders"
      description="View token distribution organized by holder type"
      icon={Users}
      isEmpty={holders.length === 0}
      emptyTitle="No Holders Found"
      emptyDescription="No token holders found for this DAO."
      emptyIcon={Users}
    >
      <div className="space-y-6">
        {/* Render sections in order */}
        {renderHolderSection("protocol", categorizedHolders.protocol, 0)}
        {renderHolderSection(
          "contracts",
          categorizedHolders.contracts,
          categorizedHolders.protocol.length
        )}
        {renderHolderSection(
          "agentVotingAccounts",
          categorizedHolders.agentVotingAccounts,
          categorizedHolders.protocol.length +
            categorizedHolders.contracts.length
        )}
        {renderHolderSection(
          "addresses",
          categorizedHolders.addresses,
          categorizedHolders.protocol.length +
            categorizedHolders.contracts.length +
            categorizedHolders.agentVotingAccounts.length
        )}
      </div>
    </DAOTabLayout>
  );
}
