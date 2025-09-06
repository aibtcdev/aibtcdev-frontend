"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Puzzle } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { getExplorerLink } from "@/utils/format";
import type { Extension } from "@/types";
import { DAOTabLayout } from "@/components/daos/DAOTabLayout";

interface DAOExtensionsProps {
  extensions: Extension[];
}

// Function to format extension type for display
function formatExtensionType(type: string): string {
  // Replace hyphens with spaces
  return type.replace(/-/g, " ");
}

// Helper function to truncate address for display
const truncateAddress = (address: string, startLength = 5, endLength = 5) => {
  if (!address || address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// Helper function to extract contract name from principal
const getContractName = (contractPrincipal: string) => {
  const parts = contractPrincipal.split(".");
  return parts.length > 1 ? parts[1] : contractPrincipal;
};

export default function DAOExtensions({ extensions }: DAOExtensionsProps) {
  const { copyToClipboard, copiedText } = useClipboard();
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

  return (
    <DAOTabLayout
      title="Extensions"
      description="Manage and monitor your DAO's active extensions and capabilities"
      icon={Puzzle}
      isEmpty={extensions.length === 0}
      emptyTitle="No Extensions Found"
      emptyDescription="This DAO has no active extensions."
      emptyIcon={Puzzle}
    >
      {isMobile ? (
        // Mobile card layout
        <div className="space-y-4">
          {extensions.map((extension) => {
            const contractName = extension.contract_principal
              ? getContractName(extension.contract_principal)
              : "Unknown";
            const deployer = extension.contract_principal
              ? extension.contract_principal.split(".")[0]
              : "Unknown";

            return (
              <div
                key={extension.id}
                className="rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col space-y-3">
                  {/* Header row with type and actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium capitalize text-sm">
                        {formatExtensionType(extension.type)}
                      </span>
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {extension.subtype}
                      </span>
                    </div>
                    {extension.contract_principal && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(extension.contract_principal!)
                          }
                          className="h-8 w-8 p-0"
                        >
                          {copiedText === extension.contract_principal ? (
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
                              extension.contract_principal
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Contract details */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Contract Name
                      </span>
                      <div className="font-mono text-sm mt-1 break-all">
                        {contractName}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Deployer
                      </span>
                      <div className="font-mono text-sm text-muted-foreground mt-1">
                        {truncateAddress(deployer, 6, 4)}
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
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[100px]">Subtype</TableHead>
                  <TableHead className="min-w-[150px]">Contract Name</TableHead>
                  <TableHead className="w-[120px]">Deployer</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensions.map((extension) => {
                  const contractName = extension.contract_principal
                    ? getContractName(extension.contract_principal)
                    : "Unknown";
                  const deployer = extension.contract_principal
                    ? extension.contract_principal.split(".")[0]
                    : "Unknown";

                  return (
                    <TableRow
                      key={extension.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium capitalize">
                        {formatExtensionType(extension.type)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {extension.subtype}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="truncate">{contractName}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        <div className="truncate">
                          {truncateAddress(deployer, 6, 4)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {extension.contract_principal && (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(extension.contract_principal!)
                              }
                              className="h-8 w-8 p-0"
                            >
                              {copiedText === extension.contract_principal ? (
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
                                  extension.contract_principal
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </DAOTabLayout>
  );
}
