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
import { DAOTabLayout } from "@/components/aidaos/DAOTabLayout";
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

        {isMobile ? (
          // Mobile card layout
          <div className="space-y-3">
            {sectionHolders.map((holder, index) => {
              const isUserConnectedWallet = isUserWallet(holder, userContext);
              const isUserAgent = isUserAgentAccount(holder, userContext);
              const isHighlighted = isUserConnectedWallet || isUserAgent;

              return (
                <div
                  key={holder.address}
                  className={`rounded-sm border bg-card p-4 hover:bg-muted/50 transition-colors ${
                    isHighlighted
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : ""
                  }`}
                >
                  <div className="flex flex-col space-y-3">
                    {/* Header row with rank and actions */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm font-medium">
                          #{startIndex + index + 1}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {isUserConnectedWallet && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-1 flex items-center gap-1"
                            >
                              <Star className="h-3 w-3 text-yellow-500" />
                              Your Wallet
                            </Badge>
                          )}
                          {isUserAgent && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-1"
                            >
                              Your Agent
                            </Badge>
                          )}
                          {isUserConnectedWallet && holder.percentage < 1 && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-2 py-1 flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {isMobile
                                ? "Deposit more!"
                                : "Consider depositing more!"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
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
                    </div>

                    {/* Address */}
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Address
                      </span>
                      <div className="font-mono text-sm mt-1 break-all">
                        {truncateAddress(holder.address, isMobile)}
                      </div>
                    </div>

                    {/* Balance and Percentage */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Balance
                        </span>
                        <div className="mt-1">
                          <TokenBalance
                            value={holder.balance}
                            symbol={tokenSymbol}
                            variant="rounded"
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                          Percentage
                        </span>
                        <div className="font-semibold text-lg mt-1">
                          {holder.percentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Desktop table layout
          <div className="rounded-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="min-w-[200px]">Address</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Balance
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Percentage
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionHolders.map((holder, index) => {
                    const isUserConnectedWallet = isUserWallet(
                      holder,
                      userContext
                    );
                    const isUserAgent = isUserAgentAccount(holder, userContext);
                    const isHighlighted = isUserConnectedWallet || isUserAgent;

                    return (
                      <TableRow
                        key={holder.address}
                        className={`hover:bg-muted/50 transition-colors ${
                          isHighlighted
                            ? "bg-primary/5 border-l-4 border-l-primary"
                            : ""
                        }`}
                      >
                        <TableCell className="text-muted-foreground text-sm">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-mono text-sm break-all">
                              {truncateAddress(holder.address, false)}
                            </div>
                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1">
                              {isUserConnectedWallet && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 flex items-center gap-1"
                                >
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  Your Wallet
                                </Badge>
                              )}
                              {isUserAgent && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0"
                                >
                                  Your Agent
                                </Badge>
                              )}
                              {isUserConnectedWallet &&
                                holder.percentage < 1 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs px-1 py-0 flex items-center gap-1"
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    Consider depositing more!
                                  </Badge>
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
                                href={getExplorerLink(
                                  "address",
                                  holder.address
                                )}
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
        )}
      </div>
    );
  };

  return (
    <DAOTabLayout
      // title="Token Holders"
      // description="View token distribution organized by holder type"
      // icon={Users}
      isEmpty={holders.length === 0}
      emptyTitle="No Holders Found"
      // emptyDescription="No token holders found for this DAO."
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
