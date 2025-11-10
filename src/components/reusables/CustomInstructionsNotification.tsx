"use client";

import { useState, useEffect, useMemo } from "react";
import { useWalletStore } from "@/store/wallet";
import { useQuery } from "@tanstack/react-query";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { X, Settings } from "lucide-react";

// Session storage key for dismissed state (tab-specific)
const DISMISSED_KEY = "customInstructions_dismissed";

const CustomInstructionsNotification = () => {
  const { agentWallets, fetchWallets } = useWalletStore();
  const { userId } = useAuth();
  const [isDismissed, setIsDismissed] = useState(() => {
    // Initialize from sessionStorage immediately
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(DISMISSED_KEY) === "true";
    }
    return false;
  });

  // Fetch wallets when userId is available
  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
      });
    }
  }, [userId, fetchWallets]);

  // Fetch agent prompts to check if user has set custom instructions
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
    enabled: !!userId, // Only fetch when user is authenticated
  });

  // Check if user should see the notification
  const shouldShowNotification = useMemo(() => {
    const hasAgent = agentWallets.length > 0;
    const hasCustomInstructions = prompts.some(
      (prompt) => prompt.prompt_text && prompt.prompt_text.trim().length > 0
    );

    // Debug logging
    console.log("CustomInstructionsNotification Debug:", {
      agentWallets: agentWallets.length,
      hasAgent,
      prompts: prompts.length,
      hasCustomInstructions,
      isDismissed,
      shouldShow: hasAgent && !hasCustomInstructions,
    });

    // Show if user has agent but no custom instructions
    return hasAgent && !hasCustomInstructions;
  }, [agentWallets, prompts, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, "true");
  };

  // Only show if should show notification and not dismissed (matching AssetTracker pattern)
  if (!shouldShowNotification || isDismissed) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 ease-out ${
        isDismissed ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      }`}
    >
      <div className="bg-primary/90 backdrop-blur-sm rounded-sm shadow-lg animate-in slide-in-from-right-5 duration-300 border border-white/10">
        <div className="flex items-center gap-3 p-3">
          {/* Settings Icon */}
          <div className="flex-shrink-0">
            <div className="h-5 w-5 bg-white/20 rounded-sm flex items-center justify-center">
              <Settings className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Banner Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium leading-relaxed">
              Configure your{" "}
              <span className="font-bold text-yellow-100">
                AI agent instructions
              </span>{" "}
              based on your preferences
            </p>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            <Link href="/account?tab=agent-settings" onClick={handleDismiss}>
              <span className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-sm whitespace-nowrap cursor-pointer">
                Configure
              </span>
            </Link>
          </div>

          {/* Close Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="p-0.5 hover:bg-white/20 rounded-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-white/50"
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

export default CustomInstructionsNotification;
