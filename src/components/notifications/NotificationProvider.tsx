"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useWalletStore } from "@/store/wallet";
import { useQuery } from "@tanstack/react-query";
import { fetchAgentPrompts } from "@/services/agent-prompt.service";
import { useAuth } from "@/hooks/useAuth";
import { getStacksAddress } from "@/lib/address";
import { Settings, Coins } from "lucide-react";
import { Notification, NotificationContextType } from "./types";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Custom format function for token balances with specified decimals
const formatBalance = (balance: number, decimals: number = 8): string => {
  if (!balance || balance === 0) return "0";
  const divisor = Math.pow(10, decimals);
  const formatted = (balance / divisor).toFixed(decimals);
  return parseFloat(formatted).toString();
};

const isDAOToken = (tokenId: string) => {
  const cleaned = tokenId.replace(/:$/, "");
  const parts = cleaned.split("::");
  const asset = parts[parts.length - 1];
  const daoTokens = ["fake", "facerizz", "facedrop", "faces", "facevibe"];
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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { balances, fetchSingleBalance, agentWallets, fetchWallets } =
    useWalletStore();
  const { userId } = useAuth();

  const [isInitialized, setIsInitialized] = useState(false);
  const address = getStacksAddress();

  // Fetch wallets when userId is available
  useEffect(() => {
    if (userId) {
      fetchWallets(userId).catch((err) => {
        console.error("Failed to fetch wallets:", err);
      });
    }
  }, [userId, fetchWallets]);

  // Initialize balance fetching
  useEffect(() => {
    const initializeBalance = async () => {
      if (!address || isInitialized) return;
      await fetchSingleBalance(address);
      setIsInitialized(true);
    };
    initializeBalance();
  }, [address, fetchSingleBalance, isInitialized]);

  // Fetch agent prompts to check if user has set custom instructions
  const { data: prompts = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: fetchAgentPrompts,
    enabled: !!userId,
  });

  // Calculate token info whenever balances change
  const daoTokens = useMemo(() => {
    if (!address || !balances[address]?.fungible_tokens) {
      return [];
    }

    const fungibleTokens = balances[address].fungible_tokens;
    const tokens: Array<{ balance: number; name: string }> = [];

    for (const [tokenId, tokenData] of Object.entries(fungibleTokens)) {
      if (isDAOToken(tokenId)) {
        const balance = Number(tokenData.balance || 0);
        if (balance > 0) {
          tokens.push({
            balance,
            name: getDAOTokenName(tokenId),
          });
        }
      }
    }

    return tokens;
  }, [balances, address]);

  // Generate notifications based on current state
  const notifications = useMemo(() => {
    const notifs: Notification[] = [];

    // Asset deposit notification - show for each DAO token with balance
    daoTokens.forEach((token, index) => {
      const formattedBalance = formatBalance(token.balance, 8);
      notifs.push({
        id: `asset-deposit-${token.name.toLowerCase()}`,
        type: "asset-deposit",
        title: "Deposit Available",
        message: `Deposit your ${formattedBalance} ${token.name} into Agent voting contract to send contribution and provide them voting power`,
        actionText: "Deposit",
        actionUrl: "/account?tab=wallets",
        icon: Coins,
        isDismissed: false,
        createdAt: new Date(),
        priority: "high",
      });
    });

    // Custom instructions notification - only show if user has agent but no instructions
    const hasAgent = agentWallets.length > 0;
    const hasCustomInstructions = prompts.some(
      (prompt) => prompt.prompt_text && prompt.prompt_text.trim().length > 0
    );

    if (hasAgent && !hasCustomInstructions) {
      notifs.push({
        id: "custom-instructions",
        type: "custom-instructions",
        title: "Configure Agent Instructions",
        message:
          "Configure your AI agent instructions based on your preferences",
        actionText: "Configure",
        actionUrl: "/account?tab=agent-settings",
        icon: Settings,
        isDismissed: false,
        createdAt: new Date(),
        priority: "medium",
      });
    }

    return notifs.sort((a, b) => {
      // Sort by priority first (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [daoTokens, agentWallets, prompts]);

  const unreadCount = notifications.length;

  const dismissNotification = (id: string) => {
    // Notifications cannot be dismissed - they persist until conditions are resolved
    console.log("Notification dismiss attempted but ignored:", id);
  };

  const markAsRead = (id: string) => {
    // Notifications cannot be marked as read - they persist until conditions are resolved
    console.log("Notification mark as read attempted but ignored:", id);
  };

  const addNotification = (
    notification: Omit<Notification, "id" | "createdAt" | "isDismissed">
  ) => {
    // This could be used for dynamic notifications in the future
    console.log("Adding notification:", notification);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    dismissNotification,
    markAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
