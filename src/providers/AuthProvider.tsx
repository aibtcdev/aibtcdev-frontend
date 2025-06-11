"use client";

import { useEffect, createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isInitialized: false,
});

export function useAuthContext() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isInitialized } = useAuth();

  // Clean up auth subscription on unmount
  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        (
          window as unknown as {
            __supabaseAuthSubscription?: { unsubscribe: () => void };
          }
        ).__supabaseAuthSubscription
      ) {
        (
          window as unknown as {
            __supabaseAuthSubscription: { unsubscribe: () => void };
          }
        ).__supabaseAuthSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}
