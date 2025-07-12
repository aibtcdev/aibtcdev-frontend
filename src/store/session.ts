import { create } from "zustand";
import { supabase } from "@/utils/supabase/client";
import type { Session, AuthError } from "@supabase/supabase-js";

interface SessionState {
  session: Session | null;
  accessToken: string | null;
  userId: string | null;
  isLoading: boolean;
  error: AuthError | Error | null;
  network: string;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  accessToken: null,
  userId: null,
  isLoading: true,
  error: null,
  network: process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet",
  isInitialized: false,

  initialize: async () => {
    try {
      set({
        isLoading: true,
        error: null,
      });

      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      // Set initial session state
      get().setSession(session);

      // Set up auth state listener for real-time updates
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          "Auth state change:",
          event,
          session?.access_token ? "session exists" : "no session"
        );

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "SIGNED_OUT":
            get().setSession(session);
            break;
          case "PASSWORD_RECOVERY":
          case "USER_UPDATED":
            // Update session if it exists
            if (session) {
              get().setSession(session);
            }
            break;
          default:
            break;
        }
      });

      // Store subscription for cleanup (optional)
      if (typeof window !== "undefined") {
        (
          window as unknown as { __supabaseAuthSubscription?: unknown }
        ).__supabaseAuthSubscription = subscription;
      }

      set({
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Session initialization error:", error);
      set({
        error: error as AuthError | Error,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  setSession: (session: Session | null) => {
    set({
      session,
      accessToken: session?.access_token || null,
      userId: session?.user?.id || null,
      error: null,
      isLoading: false,
    });
  },

  clearSession: async () => {
    try {
      await supabase.auth.signOut();
      set({
        session: null,
        accessToken: null,
        userId: null,
        error: null,
      });
    } catch (error) {
      console.error("Error clearing session:", error);
      set({
        error: error as AuthError | Error,
      });
    }
  },

  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) throw error;

      if (data.session) {
        get().setSession(data.session);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      set({
        error: error as AuthError | Error,
      });
    }
  },
}));
