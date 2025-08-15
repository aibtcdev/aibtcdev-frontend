import { useEffect } from "react";
import { useSessionStore } from "@/store/session";
import { supabase } from "@/utils/supabase/client";
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

    // Clear local storage
    localStorage.clear();

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
