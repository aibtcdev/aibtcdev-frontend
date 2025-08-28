"use client";

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
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// Helper function to extract contract name from principal
const getContractName = (contractPrincipal: string) => {
  const parts = contractPrincipal.split(".");
  return parts.length > 1 ? parts[1] : contractPrincipal;
};

export default function DAOExtensions({ extensions }: DAOExtensionsProps) {
  const { copyToClipboard, copiedText } = useClipboard();

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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Subtype</TableHead>
              <TableHead>Contract Name</TableHead>
              <TableHead>Deployer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableRow key={extension.id}>
                  <TableCell className="font-medium capitalize">
                    {formatExtensionType(extension.type)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {extension.subtype}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {contractName}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {truncateAddress(deployer)}
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
    </DAOTabLayout>
  );
}
