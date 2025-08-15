"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { fundTestnetSBTC, fundTestnetSTX } from "@/services/tool.service";

interface TestnetFaucetProps {
  accessToken: string | null;
  userId: string | null;
  fetchWallets: (userId: string) => Promise<void>;
}

export function TestnetFaucet({
  accessToken,
  userId,
  fetchWallets,
}: TestnetFaucetProps) {
  const { toast } = useToast();
  const [isRequestingSBTC, setIsRequestingSBTC] = useState(false);
  const [isRequestingSTX, setIsRequestingSTX] = useState(false);

  const handleRequestSBTC = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSBTC(true);
    try {
      const result = await fundTestnetSBTC(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: "Testnet sBTC requested successfully",
          variant: "default",
        });
        if (userId) fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request testnet sBTC",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request testnet sBTC:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet sBTC from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSBTC(false);
    }
  };

  const handleRequestSTX = async () => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingSTX(true);
    try {
      const result = await fundTestnetSTX(accessToken);
      if (result.success) {
        toast({
          title: "Success",
          description: "Testnet STX requested successfully",
          variant: "default",
        });
        if (userId) fetchWallets(userId);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request testnet STX",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to request testnet STX:", error);
      toast({
        title: "Error",
        description: "Failed to request testnet STX from faucet",
        variant: "destructive",
      });
    } finally {
      setIsRequestingSTX(false);
    }
  };

  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Coins className="h-4 w-4 text-accent" />
          </div>
          Testnet Faucet
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get free testnet tokens for development and testing purposes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRequestSBTC}
              disabled={isRequestingSBTC || !accessToken}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20 rounded-lg hover:bg-secondary/20 hover:scale-105 focus:ring-2 ring-secondary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 motion-reduce:transition-none"
            >
              {isRequestingSBTC ? (
                <>
                  <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Request Testnet sBTC
                </>
              )}
            </button>
            <button
              onClick={handleRequestSTX}
              disabled={isRequestingSTX || !accessToken}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 hover:scale-105 focus:ring-2 ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 motion-reduce:transition-none"
            >
              {isRequestingSTX ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  Request Testnet STX
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/10 p-3 rounded-lg">
            <p className="font-medium mb-1">Note:</p>
            <p>
              Testnet tokens have no real value and are only for development
              purposes. Faucet requests may have rate limits applied.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
