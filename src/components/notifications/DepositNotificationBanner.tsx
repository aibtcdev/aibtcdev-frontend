"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BalanceDisplay } from "@/components/reusables/BalanceDisplay";
import Link from "next/link";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";

interface DismissedState {
  [tokenId: string]: boolean;
}

const isDAOToken = (tokenId: string) => {
  const cleaned = tokenId.replace(/:$/, "");
  const parts = cleaned.split("::");
  const asset = parts[parts.length - 1];
  const daoTokens = [
    "fake",
    "facerizz",
    "facedrop",
    "faces",
    "facevibe",
    "elonbtc",
  ];
  return daoTokens.includes(asset.toLowerCase());
};

const getDAOTokenName = (tokenId: string) => {
  const cleaned = tokenId.replace(/:$/, "");
  const parts = cleaned.split("::");
  if (parts.length >= 2) {
    return parts[parts.length - 1].toUpperCase();
  }
  return "FAKE";
};

export const DepositNotificationBanner: React.FC = () => {
  const { balances } = useWalletStore();
  const [dismissedNotifications, setDismissedNotifications] =
    useState<DismissedState>({});
  const [isClient, setIsClient] = useState(false);

  const address = getStacksAddress();

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true);
    // Don't load dismissed state from localStorage - always show notifications on new tab
    // This ensures notifications appear every time user opens a new tab
  }, []);

  // Don't save dismissed state to localStorage - keep it session-only
  // This means dismissed notifications will reappear on new tab/page refresh

  // Calculate token info directly from balances (same logic as NotificationProvider)
  const daoTokens = useMemo(() => {
    if (!address || !balances[address]?.fungible_tokens) {
      return [];
    }

    const fungibleTokens = balances[address].fungible_tokens;
    const tokens: Array<{ balance: number; name: string; id: string }> = [];

    for (const [tokenId, tokenData] of Object.entries(fungibleTokens)) {
      if (isDAOToken(tokenId)) {
        const balance = Number(tokenData.balance || 0);
        if (balance > 0) {
          tokens.push({
            balance,
            name: getDAOTokenName(tokenId),
            id: `asset-deposit-${getDAOTokenName(tokenId).toLowerCase()}`,
          });
        }
      }
    }

    return tokens;
  }, [balances, address]);

  const handleDismiss = (notificationId: string) => {
    setDismissedNotifications((prev) => ({
      ...prev,
      [notificationId]: true,
    }));
  };

  // Filter tokens that haven't been dismissed in this session
  const visibleTokens = daoTokens.filter(
    (token) => !dismissedNotifications[token.id]
  );

  // Don't render anything on server-side or if no tokens
  if (!isClient || visibleTokens.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-16 md:top-20 right-4 z-50 space-y-2">
      {visibleTokens.map((token) => {
        return (
          <div
            key={token.id}
            className="max-w-md bg-primary text-primary-foreground rounded-md shadow-lg animate-in slide-in-from-right-2 duration-300"
          >
            <div className="px-3 py-2 flex items-center justify-between gap-3">
              {/* Message with token amount - inline */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-xs leading-relaxed">
                  Deposit{" "}
                  <BalanceDisplay
                    value={token.balance}
                    symbol={token.name}
                    decimals={8}
                    variant="abbreviated"
                    showSymbol={true}
                    className="font-bold"
                  />{" "}
                  into your agent voting account to enable AI voting.
                </p>
                <Link href="/account?tab=wallets">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs px-2 py-1 h-6 flex-shrink-0"
                  >
                    Deposit
                  </Button>
                </Link>
              </div>

              {/* Dismiss Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(token.id)}
                className="hover:bg-primary-foreground/10 text-primary-foreground p-1 h-5 w-5 flex-shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
