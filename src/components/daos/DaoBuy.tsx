"use client";

import type React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { executeBuy, type ApiResponse } from "@/services/tool.service";

interface TokenBuyInputProps {
  tokenName: string;
  contractPrincipal: string;
  initialAmount?: string;
  onAmountChange?: (amount: string) => void;
  onResult: (res: ApiResponse) => void; // <── only change
  disabled?: boolean;
}

export function TokenBuyInput({
  tokenName,
  contractPrincipal,
  initialAmount = "",
  onAmountChange,
  onResult,
  disabled = false,
}: TokenBuyInputProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { accessToken } = useAuth();

  /* keep in sync with preset */
  useEffect(() => {
    if (initialAmount) setAmount(initialAmount);
  }, [initialAmount]);

  const satoshiToBTC = (s: string) =>
    !s || isNaN(Number(s))
      ? "0.00000000"
      : (Number(s) / 100_000_000).toFixed(8);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount.trim() || !accessToken) return;

      setIsLoading(true);

      try {
        const btcAmount = (Number(amount) / 100_000_000).toString();

        const apiResponse = await executeBuy(
          accessToken,
          btcAmount,
          contractPrincipal,
          "15"
        );
        onResult(apiResponse);
        if (apiResponse.success) setAmount("");
      } catch (err) {
        onResult({
          success: false,
          output: "",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [amount, accessToken, contractPrincipal, onResult]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d.]/g, "");
    setAmount(val);
    onAmountChange?.(val);
  };

  const handleFocus = () =>
    setTimeout(
      () =>
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      300
    );

  if (!accessToken) return null;

  return (
    <div className="w-full backdrop-blur bg-background/95 border-t border-border">
      <div className="mx-auto max-w-5xl px-2 md:px-4 py-3 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
          <div className="text-md text-muted-foreground text-right px-1 text-orange-500">
            {amount ? `${satoshiToBTC(amount)} BTC` : "0 BTC"}
          </div>

          <div className="flex gap-2 items-center w-full">
            <div className="relative flex-1 min-w-0">
              <Input
                ref={inputRef}
                value={amount}
                onChange={handleChange}
                onClick={handleFocus}
                onFocus={handleFocus}
                placeholder={`Enter satoshi amount to spend on ${tokenName}…`}
                disabled={disabled || isLoading}
                className={cn(
                  "h-11 pr-16 py-2.5 px-4 border border-muted text-base placeholder:text-muted-foreground",
                  "rounded-xl md:rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-medium text-muted-foreground text-orange-500">
                sats
              </span>
            </div>

            <Button
              type="submit"
              variant="ghost"
              disabled={disabled || isLoading || !amount.trim()}
              className="h-11 px-4 flex items-center gap-2 text-sm sm:text-base font-inter font-bold bg-transparent text-primary border border-primary/20 rounded-lg sm:rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ease-in-out motion-reduce:transition-none backdrop-blur-sm shadow-md"
            >
              {isLoading ? (
                <span className="animate-pulse">Processing…</span>
              ) : (
                <>
                  Buy
                  <Wallet className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
