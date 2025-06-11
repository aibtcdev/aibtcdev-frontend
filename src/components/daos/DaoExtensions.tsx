"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Extension } from "@/types";

interface DAOExtensionsProps {
  extensions: Extension[];
}

// Function to format extension type for display
function formatExtensionType(type: string): string {
  // Replace hyphens with spaces
  return type.replace(/-/g, " ");
}

const getExplorerUrl = (txId: string) => {
  const baseUrl = "https://explorer.hiro.so/txid";
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  return `${baseUrl}/${txId}${isTestnet ? "?chain=testnet" : ""}`;
};

export default function DAOExtensions({ extensions }: DAOExtensionsProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Extensions</h2>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your DAO&apos;s active extensions and
            capabilities
          </p>
        </div>

        <div className="space-y-6">
          {extensions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subtype</TableHead>
                    <TableHead>Contract Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extensions.map((extension) => (
                    <TableRow key={extension.id}>
                      <TableCell className="font-medium capitalize">
                        {formatExtensionType(extension.type)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {extension.subtype}
                      </TableCell>
                      <TableCell>
                        {extension.contract_principal && extension.tx_id && (
                          <a
                            href={getExplorerUrl(extension.tx_id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                          >
                            {extension.contract_principal}
                          </a>
                        )}
                        {!extension.tx_id && extension.contract_principal && (
                          <span className="text-xs">
                            {extension.contract_principal}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-400">No extensions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
