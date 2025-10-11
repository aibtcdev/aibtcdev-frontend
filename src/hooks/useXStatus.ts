import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { hasLinkedXAccount } from "@/services/x-auth.service";
import { supabase } from "@/utils/supabase/client";
import type { Profile } from "@/types/user";

export function useXStatus() {
  const { userId, isAuthenticated } = useAuth();

  // Check if user has linked X account
  const {
    data: hasX = false,
    isLoading: isLoadingLink,
    refetch: refetchLink,
  } = useQuery({
    queryKey: ["x-status", userId],
    queryFn: hasLinkedXAccount,
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user profile to get verification status
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isLoading = isLoadingLink || isLoadingProfile;

  // Determine verification status
  const getVerificationStatus = () => {
    if (!hasX) {
      return { status: "not_linked", message: "X account not linked" };
    }

    if (profile?.is_verified === true) {
      return { status: "verified", message: "X account verified" };
    }

    if (profile?.is_verified === false) {
      return { status: "not_verified", message: "X account not verified" };
    }

    // is_verified is null - verification pending
    return { status: "pending", message: "X verification pending" };
  };

  const verificationStatus = getVerificationStatus();

  return {
    hasUsername: hasX,
    needsXLink: !hasX,
    isLoading,
    profile,
    verificationStatus,
    canSubmitContribution: hasX && profile?.is_verified === true,
    refreshStatus: () => {
      refetchLink();
      refetchProfile();
    },
  };
}

// Keep the old hook name for backward compatibility during transition
export const useTwitterStatus = useXStatus;
