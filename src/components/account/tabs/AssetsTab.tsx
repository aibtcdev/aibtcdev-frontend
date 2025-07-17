"use client";

import { Button } from "@/components/ui/button";
import { WalletBalance } from "@/store/wallet";
import { AssetsDataTable } from "../AssetsDataTable";
import { useToast } from "@/hooks/useToast";
import { fundTestnetSBTC, fundTestnetSTX } from "@/services/tool.service";
import { useState } from "react";

interface AssetsTabProps {
  userAgentContractBalance: WalletBalance | null;
  accessToken: string | null;
  userId: string | null;
  fetchWallets: (userId: string) => Promise<void>;
}

export function AssetsTab({
  userAgentContractBalance,
  accessToken,
  userId,
  fetchWallets,
}: AssetsTabProps) {
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [isRequestingSTX, setIsRequestingSTX] = useState(false);
  const { toast } = useToast();

  const handleRequestToken = async (type: "sbtc" | "stx") => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const isSTX = type === "stx";
    const setter = isSTX ? setIsRequestingSTX : setIsRequestingSBTC;
    const service = isSTX ? fundTestnetSTX : fundTestnetSBTC;

    setter(true);
    try {
      const result = await service(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: `Testnet ${isSTX ? "STX" : "sBTC"} requested successfully`,
        });
        if (userId) fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description:
            result.error ||
            `Failed to request testnet ${isSTX ? "STX" : "sBTC"}`,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: `Failed to request testnet ${isSTX ? "STX" : "sBTC"}`,
        variant: "destructive",
      });
    } finally {
      setter(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Asset Portfolio</h2>
          <p className="text-sm text-muted-foreground">
            Manage your tokens and balances
          </p>
        </div>
      </div>

      {/* Assets Table */}
      <AssetsDataTable walletBalance={userAgentContractBalance} />

      {/* Testnet Faucet - Inline */}
      {process.env.NEXT_PUBLIC_STACKS_NETWORK !== "mainnet" && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Need test tokens?
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestToken("sbtc")}
                disabled={isRequestingSBTC || !accessToken}
              >
                {isRequestingSBTC ? "Requesting..." : "Get sBTC"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRequestToken("stx")}
                disabled={isRequestingSTX || !accessToken}
              >
                {isRequestingSTX ? "Requesting..." : "Get STX"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
