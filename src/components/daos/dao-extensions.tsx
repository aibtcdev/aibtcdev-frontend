"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";
import type { Extension } from "@/types/supabase";

interface DAOExtensionsProps {
  extensions: Extension[];
}

function truncateString(str: string): string {
  if (!str || str.length <= 11) return str;
  return `${str.slice(0, 5)}...${str.slice(-30)}`;
}

const getStatusColor = (status: Extension["status"]) => {
  switch (status) {
    case "DEPLOYED":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  }
};

const getExplorerUrl = (txId: string) => {
  const baseUrl = "https://explorer.hiro.so/txid";
  const isTestnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === "testnet";
  return `${baseUrl}/${txId}${isTestnet ? "?chain=testnet" : ""}`;
};

export function DAOExtensions({ extensions }: DAOExtensionsProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<Extension["status"]>("DEPLOYED");

  const filteredExtensions = extensions.filter(
    (ext) => ext.status === selectedStatus
  );

  const stats = {
    active: extensions.filter((e) => e.status === "DEPLOYED").length,
    pending: extensions.filter((e) => e.status === "pending").length,
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
          Extensions
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage and monitor your DAO&apos;s active extensions and capabilities
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6 pb-12">
        <div className="flex flex-wrap gap-2">
          <StatusButton
            status="DEPLOYED"
            count={stats.active}
            selected={selectedStatus === "DEPLOYED"}
            onClick={() => setSelectedStatus("DEPLOYED")}
          />
          <StatusButton
            status="pending"
            count={stats.pending}
            selected={selectedStatus === "pending"}
            onClick={() => setSelectedStatus("pending")}
          />
        </div>

        <div className="space-y-3 sm:space-y-4">
          {filteredExtensions.map((extension) => (
            <div
              key={extension.id}
              className="group relative rounded-lg border bg-background/50 backdrop-blur-sm p-3 sm:p-4 transition-all hover:bg-background/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <h3 className="text-sm sm:text-base font-medium capitalize">
                      {extension.type.replace("-", " ")}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(
                        extension.status
                      )} border capitalize text-xs`}
                    >
                      {extension.status}
                    </Badge>
                  </div>
                  {extension.contract_principal && (
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncateString(extension.contract_principal)}
                      </code>
                    </div>
                  )}
                  {extension.tx_id && (
                    <a
                      href={getExplorerUrl(extension.tx_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>TX: {truncateString(extension.tx_id)}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(extension.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusButton({
  status,
  count,
  selected,
  onClick,
}: {
  status: Extension["status"];
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={selected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className="h-8"
    >
      <span className="capitalize">{status}</span>
      <span className="ml-2 text-xs bg-primary-foreground/10 px-1.5 py-0.5 rounded-full">
        {count}
      </span>
    </Button>
  );
}

export default DAOExtensions;
