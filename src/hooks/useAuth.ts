import { useEffect } from "react";
import { useSessionStore } from "@/store/session";
import { useWalletStore } from "@/store/wallet";
import { supabase } from "@/utils/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Session } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  accessToken: string | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const {
    session,
    accessToken,
    userId,
    isLoading,
    error,
    isInitialized,
    initialize,
    clearSession,
    refreshSession,
  } = useSessionStore();

  const { clearWalletData } = useWalletStore();
  const queryClient = useQueryClient();

  // Initialize session store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Periodically check for session validity
  useEffect(() => {
    if (!session || !isInitialized) return;

    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session check error:", error);
        }
        // The auth state listener will handle updating the store
      } catch (error) {
        console.error("Session validation error:", error);
      }
    };

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, isInitialized]);

  const signOut = async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out from Supabase:", err);
    }

    // Clear all browser storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear all cookies
    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Clear cookie for current domain and all parent domains
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    });

    // Clear React Query cache to prevent stale data
    queryClient.clear();

    // Clear wallet store data (balances, userWallet, agentWallets)
    clearWalletData();

    // Clear app-specific session state
    clearSession();
  };

  return {
    user: session?.user || null,
    session,
    accessToken,
    userId,
    isLoading,
    isAuthenticated: !!session && !!accessToken,
    isInitialized,
    error,
    signOut,
    refreshSession,
  };
}
