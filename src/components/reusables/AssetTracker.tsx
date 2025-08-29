"use client";

import { useState, useEffect, useMemo } from "react";
import { useWalletStore } from "@/store/wallet";
import { getStacksAddress } from "@/lib/address";
import Link from "next/link";
import { X } from "lucide-react";

// Custom format function for token balances with specified decimals
const formatBalance = (balance: number, decimals: number = 8): string => {
  if (!balance || balance === 0) return "0";
  const divisor = Math.pow(10, decimals);
  const formatted = (balance / divisor).toFixed(decimals);
  return parseFloat(formatted).toString();
};

// Session storage key for dismissed state
const DISMISSED_KEY = "assetTracker_dismissed";

const isFakeToken = (tokenId: string) => {
  const cleaned = tokenId.replace(/:$/, "");
  const parts = cleaned.split("::");
  const asset = parts[parts.length - 1];
  return asset === "fake";
};

const getFakeTokenName = (tokenId: string) => {
  const cleaned = tokenId.replace(/:$/, "");
  const parts = cleaned.split("::");
  if (parts.length >= 2) {
    return parts[parts.length - 1].toUpperCase();
  }
  return "FAKE";
};

const AssetTracker = () => {
  const { balances, fetchSingleBalance } = useWalletStore();
  const [isDismissed, setIsDismissed] = useState(() => {
    // Initialize from sessionStorage immediately
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(DISMISSED_KEY) === "true";
    }
    return false;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user address
  const address = getStacksAddress();

  useEffect(() => {
    const initializeBalance = async () => {
      if (!address || isInitialized) return;

      // Fetch balance and mark as initialized
      await fetchSingleBalance(address);
      setIsInitialized(true);
    };

    initializeBalance();
  }, [address, fetchSingleBalance, isInitialized]);

  // Calculate token info whenever balances change
  const { tokenBalance, tokenName } = useMemo(() => {
    if (!address || !balances[address]?.fungible_tokens) {
      return { tokenBalance: 0, tokenName: "FAKE" };
    }

    const fungibleTokens = balances[address].fungible_tokens;

    for (const [tokenId, tokenData] of Object.entries(fungibleTokens)) {
      if (isFakeToken(tokenId)) {
        const balance = Number(tokenData.balance || 0);
        if (balance > 0) {
          return {
            tokenBalance: balance,
            tokenName: getFakeTokenName(tokenId),
          };
        }
      }
    }

    return { tokenBalance: 0, tokenName: "FAKE" };
  }, [balances, address]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "true");
  };

  // Only show if we have tokens and not dismissed
  if (tokenBalance === 0 || isDismissed) {
    return null;
  }

  const formattedBalance = formatBalance(tokenBalance, 8);

  return (
    <div
      className={`fixed top-16 right-4 z-50 max-w-sm transition-all duration-300 ease-out ${
        isDismissed ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <div className="bg-primary/90 backdrop-blur-sm rounded-lg shadow-lg animate-in slide-in-from-right-5 duration-300 border border-white/10">
        <div className="flex items-center gap-3 p-3">
          {/* Token Icon */}
          <div className="flex-shrink-0">
            <div className="h-5 w-5 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">₿</span>
            </div>
          </div>

          {/* Banner Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium leading-relaxed">
              Deposit your{" "}
              <span className="font-bold text-yellow-100">
                {formattedBalance} {tokenName}
              </span>{" "}
              into Agent voting contract to send contribution and provide them
              voting power
            </p>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            <Link href="/account?tab=wallets" onClick={handleDismiss}>
              <span className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-sm whitespace-nowrap cursor-pointer">
                Deposit
              </span>
            </Link>
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/50"
              aria-label="Dismiss notification"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetTracker;
